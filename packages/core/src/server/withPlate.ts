import { type TEditor, type Value, normalizeEditor } from '@udecode/slate';

import type { WithPlateOptions } from '../client';
import type { PlateEditor } from '../shared/types/PlateEditor';

import {
  getCorePlugins,
  pipeNormalizeInitialValue,
  resolvePlugins,
} from '../shared';
import { resetEditor } from '../shared/transforms';
import { ReactPlugin } from './ReactPlugin';

const shouldHaveBeenOverridden = (fnName: string) => () => {
  console.warn(
    `editor.${fnName} should have been overriden but was not. Please report this issue here: https://github.com/udecode/plate/issues`
  );
};

/** `withPlate` with server-side support. */
export const withPlate = <
  V extends Value = Value,
  E extends TEditor<V> = TEditor<V>,
>(
  e: E,
  {
    id,
    maxLength,
    plugins = [],
    shouldNormalizeEditor,
    value,
  }: WithPlateOptions<V> = {}
): E & PlateEditor<V> => {
  let editor = e as any as E & PlateEditor<V>;

  // Override incremental id generated by slate
  editor.id = id ?? editor.id;
  editor.prevSelection = null;
  editor.isFallback = false;
  editor.currentKeyboardEvent = null;

  // Editor methods
  editor.reset = () => resetEditor(editor);
  editor.redecorate = () => shouldHaveBeenOverridden('redecorate');
  editor.plate = {
    get set() {
      shouldHaveBeenOverridden('plate.set');

      return null as any;
    },
  };

  if (!editor.key) {
    editor.key = Math.random();
  }

  resolvePlugins(editor as any, [
    ...getCorePlugins({
      maxLength,
      reactPlugin: ReactPlugin,
    }),
    ...plugins,
  ]);

  // withOverrides
  editor.plugins.forEach((plugin) => {
    if (plugin.withOverrides) {
      editor = plugin.withOverrides({ editor: editor as any, plugin }) as any;
    }
  });

  if (value) {
    editor.children = value;
  }
  if (editor.children?.length) {
    pipeNormalizeInitialValue(editor);

    if (shouldNormalizeEditor) {
      normalizeEditor(editor, { force: true });
    }
  }

  return editor;
};
