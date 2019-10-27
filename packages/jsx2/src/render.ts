type VNode<R> = import('./create-element').VNode<R>;
type CoercedRenderable<R> = import('./util/coerce-renderable').CoercedRenderable<R>;

import { coerceRenderable } from './util/coerce-renderable';
import { createTree } from './diff/create-tree';
import { diffTree } from './diff/diff-tree';

export type Container<R> = (Element | Document | ShadowRoot | DocumentFragment) & {
  _component?: CoercedRenderable<R>;
};

export type Renderable<R> =
  | string
  | number
  | boolean
  | null
  | undefined
  | VNode<R>
  // | TemplateResult
  | RenderableArray<R>;
export interface RenderableArray<R> extends ReadonlyArray<Renderable<R>> {}

export function render<R>(_renderable: Renderable<R>, container: Container<R>): void {
  const renderable = coerceRenderable(_renderable);
  const old = container._component;
  if (old) {
    diffTree(old, renderable, container, container.firstChild);
  } else {
    createTree(renderable, container);
    container._component = renderable;
  }
}
