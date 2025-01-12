import type { TElement } from '@udecode/slate';
import type { AnyObject } from '@udecode/utils';

import clsx from 'clsx';

import type { SlateEditor } from '../../editor';
import type { SlateRenderNodeProps } from '../types';

import { pipeInjectNodeProps } from '../../../internal/plugin/pipeInjectNodeProps';
import { type AnyEditorPlugin, getEditorPlugin } from '../../plugin';
import { getSlateClass } from '../../utils';
import { getPluginNodeProps } from '../../utils/getPluginNodeProps';

export const getRenderNodeStaticProps = ({
  attributes,
  editor,
  element,
  plugin,
  props,
}: {
  editor: SlateEditor;
  props: SlateRenderNodeProps;
  attributes?: AnyObject;
  element?: TElement;
  plugin?: AnyEditorPlugin;
}): SlateRenderNodeProps => {
  props = getPluginNodeProps({
    attributes,
    element,
    plugin,
    props,
  });

  const { className } = props;

  let nodeProps = {
    ...props,
    ...(plugin ? (getEditorPlugin(editor, plugin) as any) : {}),
    className: clsx(getSlateClass(plugin?.node.type), className),
  };

  nodeProps = pipeInjectNodeProps(
    editor,
    nodeProps,
    (node) => editor.api.findPath(node)!
  );

  if (nodeProps.style && Object.keys(nodeProps.style).length === 0) {
    delete nodeProps.style;
  }

  return nodeProps;
};
