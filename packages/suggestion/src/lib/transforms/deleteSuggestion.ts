import {
  type Point,
  type SlateEditor,
  type TElement,
  type TRange,
  nanoid,
  PointApi,
} from '@udecode/plate';

import { BaseSuggestionPlugin } from '../BaseSuggestionPlugin';
import { findSuggestionId } from '../queries/findSuggestionId';
import { findSuggestionNode } from '../queries/index';
import { getSuggestionCurrentUserKey } from './getSuggestionProps';
import { setSuggestionNodes } from './setSuggestionNodes';

/**
 * Suggest deletion one character at a time until target point is reached.
 * Suggest additions are safely deleted.
 */
export const deleteSuggestion = (
  editor: SlateEditor,
  at: TRange,
  {
    reverse,
  }: {
    reverse?: boolean;
  } = {}
) => {
  editor.tf.withoutNormalizing(() => {
    const { anchor: from, focus: to } = at;

    const suggestionId = findSuggestionId(editor, from) ?? nanoid();

    const toRef = editor.api.pointRef(to);

    let pointCurrent: Point | undefined;

    while (true) {
      pointCurrent = editor.selection?.anchor;

      if (!pointCurrent) break;

      const pointTarget = toRef.current;

      if (!pointTarget) break;
      // don't delete across blocks
      if (
        !editor.api.isAt({
          at: { anchor: pointCurrent, focus: pointTarget },
          blocks: true,
        })
      ) {
        // always 0 when across blocks
        const str = editor.api.string(
          reverse
            ? {
                anchor: pointTarget,
                focus: pointCurrent,
              }
            : {
                anchor: pointCurrent,
                focus: pointTarget,
              }
        );

        if (str.length === 0) break;
      }

      const getPoint = reverse ? editor.api.before : editor.api.after;

      const pointNext: Point | undefined = getPoint(pointCurrent, {
        unit: 'character',
      });

      if (!pointNext) break;

      let range: TRange = reverse
        ? {
            anchor: pointNext,
            focus: pointCurrent,
          }
        : {
            anchor: pointCurrent,
            focus: pointNext,
          };
      range = editor.api.unhangRange(range, { character: true });

      // if the current point is in block addition suggestion, delete block
      const entryBlock = editor.api.node<TElement>({
        at: pointCurrent,
        block: true,
        match: (n) =>
          n[BaseSuggestionPlugin.key] &&
          !n.suggestionDeletion &&
          n[getSuggestionCurrentUserKey(editor)],
      });

      if (
        entryBlock &&
        editor.api.isStart(pointCurrent, entryBlock[1]) &&
        editor.api.isEmpty(entryBlock[0] as any)
      ) {
        editor.tf.removeNodes({
          at: entryBlock[1],
        });

        continue;
      }
      // move selection if still the same
      if (PointApi.equals(pointCurrent, editor.selection!.anchor)) {
        editor.tf.move({
          reverse,
          unit: 'character',
        });
      }
      // skip if the range is across blocks
      if (editor.api.isAt({ at: range, blocks: true })) {
        continue;
      }

      // if the current point is in addition suggestion, delete
      const entryText = findSuggestionNode(editor, {
        at: range,
        match: (n) =>
          !n.suggestionDeletion && n[getSuggestionCurrentUserKey(editor)],
      });

      if (entryText) {
        editor.tf.delete({ at: range, unit: 'character' });

        continue;
      }

      setSuggestionNodes(editor, {
        at: range,
        suggestionDeletion: true,
        suggestionId,
      });
    }
  });
};
