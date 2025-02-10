import { type Value, NodeApi } from '@udecode/plate';
import { createAtomStore, usePluginOption } from '@udecode/plate/react';

import type { CommentUser, TComment } from '../../../lib/types';

import { CommentsPlugin } from '../../CommentsPlugin';

export const SCOPE_ACTIVE_COMMENT = 'activeComment';

export interface CommentStoreState {
  id: string;
  editingValue: Value | null;
  isMenuOpen: boolean;
}

export const {
  CommentProvider,
  commentStore,
  useCommentSet,
  useCommentState,
  useCommentStore,
  useCommentValue,
} = createAtomStore(
  {
    id: '',
    editingValue: null,
    isMenuOpen: false,
  } as CommentStoreState,
  {
    name: 'comment',
  }
);

export const useCommentUser = (scope?: string): CommentUser | null => {
  const commentId = useCommentValue('id', { scope });
  const comment = usePluginOption(CommentsPlugin, 'commentById', commentId);
  const users = usePluginOption(CommentsPlugin, 'users');

  if (!comment) return null;

  return users[comment.userId];
};

export const useCommentReplies = (scope?: string) => {
  const commentId = useCommentValue('id', { scope });
  const comments = usePluginOption(CommentsPlugin, 'comments');

  const replies: Record<string, TComment> = {};

  Object.keys(comments).forEach((id) => {
    const comment = comments[id];

    if (!comment) return null;
    if (comment.parentId === commentId) {
      replies[id] = comment;
    }
  });

  return replies;
};

export const useComment = (scope?: string) => {
  const commentId = useCommentValue('id', { scope });

  return usePluginOption(CommentsPlugin, 'commentById', commentId);
};

export const useCommentText = (scope?: string) => {
  const comment = useComment(scope);

  if (!comment) return null;

  return NodeApi.string(comment.value?.[0]);
};

export const useEditingCommentText = () => {
  const editingValue = useCommentValue('editingValue');

  if (!editingValue) return null;

  return NodeApi.string(editingValue?.[0]);
};
