import {
  type PluginConfig,
  type WithPartial,
  createTSlatePlugin,
  nanoid,
} from '@udecode/plate';

import type { SuggestionUser, TSuggestion } from './types';

import { withSuggestion } from './withSuggestion';

export const SUGGESTION_KEYS = {
  id: 'suggestionId',
} as const;

export type SuggestionConfig = PluginConfig<
  'suggestion',
  {
    activeSuggestionId: string | null;
    currentUserId: string | null;
    isSuggesting: boolean;
    suggestions: Record<string, TSuggestion>;
    users: Record<string, SuggestionUser>;
    onSuggestionAdd: ((value: Partial<TSuggestion>) => void) | null;
    onSuggestionDelete: ((id: string) => void) | null;
    onSuggestionUpdate:
      | ((
          value: Partial<Omit<TSuggestion, 'id'>> & Pick<TSuggestion, 'id'>
        ) => void)
      | null;
  },
  {
    suggestion: {
      addSuggestion: (
        value: WithPartial<TSuggestion, 'createdAt' | 'id' | 'userId'>
      ) => void;
      removeSuggestion: (id: string | null) => void;
      updateSuggestion: (
        id: string | null,
        value: Partial<TSuggestion>
      ) => void;
    };
  },
  {},
  {
    currentSuggestionUser?: () => SuggestionUser | null;
    suggestionById?: (id: string | null) => TSuggestion | null;
    suggestionUserById?: (id: string | null) => SuggestionUser | null;
  }
>;

export const BaseSuggestionPlugin = createTSlatePlugin<SuggestionConfig>({
  key: 'suggestion',
  node: { isLeaf: true },
  options: {
    activeSuggestionId: null,
    currentUserId: null,
    isSuggesting: false,
    suggestions: {},
    users: {},
    onSuggestionAdd: null,
    onSuggestionDelete: null,
    onSuggestionUpdate: null,
  },
})
  .overrideEditor(withSuggestion)
  .extendSelectors<SuggestionConfig['selectors']>(({ getOptions }) => ({
    currentSuggestionUser: () => {
      const { currentUserId, users } = getOptions();

      if (!currentUserId) return null;

      return users[currentUserId];
    },
    suggestionById: (id) => {
      if (!id) return null;

      return getOptions().suggestions[id];
    },
    suggestionUserById: (id) => {
      if (!id) return null;

      return getOptions().users[id];
    },
  }))
  .extendApi<Partial<SuggestionConfig['api']['suggestion']>>(
    ({ getOptions, setOptions }) => ({
      addSuggestion: (value) => {
        const { currentUserId } = getOptions();

        if (!currentUserId) return;

        const id = value.id ?? nanoid();
        const newSuggestion: TSuggestion = {
          id,
          createdAt: Date.now(),
          userId: currentUserId,
          ...value,
        };

        setOptions((draft) => {
          draft.suggestions![id] = newSuggestion;
        });
      },
      removeSuggestion: (id) => {
        if (!id) return;

        setOptions((draft) => {
          delete draft.suggestions![id];
        });
      },
      updateSuggestion: (id, value) => {
        if (!id) return;

        setOptions((draft) => {
          draft.suggestions![id] = { ...draft.suggestions![id], ...value };
        });
      },
    })
  );
