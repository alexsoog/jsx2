type Renderable<R> = import('../render').Renderable<R>;

import { isValidElement } from '../create-element';
import { isArray } from './is-array';

export type CoercedRenderable<R> = Exclude<Renderable<R>, boolean | number | undefined>;

export function coerceRenderable<R>(renderable: Renderable<R> | void): CoercedRenderable<R> {
  if (renderable == null) return null;
  if (typeof renderable === 'boolean') return null;
  if (typeof renderable === 'number') return String(renderable);
  if (typeof renderable === 'string') return renderable;

  if (isArray(renderable)) return renderable;

  if (isValidElement<R>(renderable)) return renderable;
  return null;
}
