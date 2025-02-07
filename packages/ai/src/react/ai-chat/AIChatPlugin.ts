import type { TriggerComboboxPluginOptions } from '@udecode/plate-combobox';
import type { UseChatHelpers } from 'ai/react';

import {
  type OmitFirst,
  type PluginConfig,
  type SlateEditor,
  type TNode,
  bindFirst,
} from '@udecode/plate';
import { createTPlatePlugin } from '@udecode/plate/react';
import { BlockSelectionPlugin } from '@udecode/plate-selection/react';

import type { AIBatch } from '../../lib';

import { AIPlugin } from '../ai/AIPlugin';
import { acceptAIChat } from './transforms/acceptAIChat';
import { insertBelowAIChat } from './transforms/insertBelowAIChat';
import { replaceSelectionAIChat } from './transforms/replaceSelectionAIChat';
import { useAIChatHooks } from './useAIChatHook';
import {
  type EditorPromptParams,
  getEditorPrompt,
} from './utils/getEditorPrompt';
import { resetAIChat } from './utils/resetAIChat';
import { submitAIChat } from './utils/submitAIChat';
import { withAIChat } from './withAIChat';

export type AIChatOptions = {
  /** @private The Editor used to generate the AI response. */
  aiEditor: SlateEditor | null;

  chat: Partial<UseChatHelpers>;
  /**
   * Specifies how the assistant message is handled:
   *
   * - 'insert': Directly inserts content into the editor without preview.
   * - 'chat': Initiates an interactive session to review and refine content
   *   before insertion.
   */
  mode: 'chat' | 'insert';
  open: boolean;
  /**
   * Template function for generating the user prompt. Supports the following
   * placeholders:
   *
   * - {block}: Replaced with the markdown of the blocks in selection.
   * - {editor}: Replaced with the markdown of the entire editor content.
   * - {selection}: Replaced with the markdown of the current selection.
   * - {prompt}: Replaced with the actual user prompt.
   */
  promptTemplate: (props: EditorPromptParams) => string;

  /**
   * Template function for generating the system message. Supports the same
   * placeholders as `promptTemplate`.
   */
  systemTemplate: (props: EditorPromptParams) => string | void;
  /**
   * Callback function to update the anchor element when the AI is done
   * rendering its answer
   */
  anchorUpdate?: (anchor: TNode) => void;
} & TriggerComboboxPluginOptions;

export type AIChatApi = {
  hide: () => void;
  reload: () => void;
  reset: OmitFirst<typeof resetAIChat>;
  show: (anchorUpdate?: (anchor: TNode) => void) => void;
  stop: () => void;
  submit: OmitFirst<typeof submitAIChat>;
};

export type AIChatTransforms = {
  accept: OmitFirst<typeof acceptAIChat>;
  insertBelow: OmitFirst<typeof insertBelowAIChat>;
  replaceSelection: OmitFirst<typeof replaceSelectionAIChat>;
};

export type AIChatPluginConfig = PluginConfig<
  'aiChat',
  AIChatOptions,
  { aiChat: AIChatApi },
  { aiChat: AIChatTransforms }
>;

export const AIChatPlugin = createTPlatePlugin<AIChatPluginConfig>({
  key: 'aiChat',
  dependencies: ['ai'],
  options: {
    aiEditor: null,
    chat: { messages: [] } as any,
    mode: 'chat',
    open: false,
    promptTemplate: () => '{prompt}',
    systemTemplate: () => {},
    anchorUpdate: undefined,
    trigger: ' ',
    triggerPreviousCharPattern: /^\s?$/,
  },
})
  .overrideEditor(withAIChat)
  .extend(() => ({
    useHooks: useAIChatHooks,
  }))
  .extendApi<Pick<AIChatApi, 'reset' | 'stop' | 'submit'>>(
    ({ editor, getOptions }) => {
      return {
        reload: () => {
          const { chat, mode } = getOptions();

          if (mode === 'insert') {
            editor.getTransforms(AIPlugin).ai.undo();
          }

          void chat.reload?.({
            body: {
              system: getEditorPrompt(editor, {
                promptTemplate: getOptions().systemTemplate,
              }),
            },
          });
        },
        reset: bindFirst(resetAIChat, editor),
        stop: () => {
          getOptions().chat.stop?.();
        },
        submit: bindFirst(submitAIChat, editor),
      };
    }
  )
  .extendApi(({ api, editor, getOptions, setOption }) => ({
    hide: () => {
      api.aiChat.reset();

      setOption('open', false);

      if (editor.getOption(BlockSelectionPlugin, 'isSelectingSome')) {
        // TODO
        // editor.getApi(BlockSelectionPlugin).blockSelection.focus();
      } else {
        editor.tf.focus();
      }

      const lastBatch = editor.history.undos.at(-1) as AIBatch;

      if (lastBatch?.ai) {
        delete lastBatch.ai;
      }
    },
    show: (anchorUpdate?: (anchor: TNode) => void) => {
      api.aiChat.reset();

      getOptions().chat.setMessages?.([]);

      setOption('open', true);
      if (anchorUpdate) {
        setOption('anchorUpdate', anchorUpdate);
      }
    },
  }))
  .extendTransforms(({ editor }) => ({
    accept: bindFirst(acceptAIChat, editor),
    insertBelow: bindFirst(insertBelowAIChat, editor),
    replaceSelection: bindFirst(replaceSelectionAIChat, editor),
  }));
