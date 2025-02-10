import {
  type Descendant,
  type SlateEditor,
  applyDeepToNodes,
  nanoid,
} from '@udecode/plate';

import { BaseSuggestionPlugin, SUGGESTION_KEYS } from '../BaseSuggestionPlugin';
import { findSuggestionId } from '../queries/findSuggestionId';
import { getSuggestionKeys } from '../utils/index';
import { deleteFragmentSuggestion } from './deleteFragmentSuggestion';
import { getSuggestionCurrentUserKey } from './getSuggestionProps';

export const insertFragmentSuggestion = (
  editor: SlateEditor,
  fragment: Descendant[],
  {
    insertFragment = editor.tf.insertFragment,
  }: {
    insertFragment?: (fragment: Descendant[]) => void;
  } = {}
) => {
  editor.tf.withoutNormalizing(() => {
    deleteFragmentSuggestion(editor);

    const id = findSuggestionId(editor, editor.selection!) ?? nanoid();

    fragment.forEach((node) => {
      applyDeepToNodes({
        node,
        source: {},
        apply: (n) => {
          if (!n[BaseSuggestionPlugin.key]) {
            // Add suggestion mark
            n[BaseSuggestionPlugin.key] = true;
          }
          if (n.suggestionDeletion) {
            // Remove suggestion deletion mark
            delete n.suggestionDeletion;
          }

          n[SUGGESTION_KEYS.id] = id;

          // remove the other user keys
          const otherUserKeys = getSuggestionKeys(n);
          otherUserKeys.forEach((key) => {
            delete n[key];
          });

          // set current user key
          n[getSuggestionCurrentUserKey(editor)] = true;
        },
      });
    });

    insertFragment(fragment);
  });
};
