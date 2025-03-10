import {
  type EditorNodesOptions,
  type SlateEditor,
  type ValueOf,
  combineMatchOptions,
} from '@udecode/plate';

import type { TSuggestionText } from '../types';

import { BaseSuggestionPlugin } from '../BaseSuggestionPlugin';

export const findSuggestionNode = <E extends SlateEditor>(
  editor: E,
  options: EditorNodesOptions<ValueOf<E>> = {}
) =>
  editor.api.node<TSuggestionText>({
    ...options,
    match: combineMatchOptions(
      editor,
      (n) => (n as any)[BaseSuggestionPlugin.key],
      options
    ),
  });
