type CoercedRenderable = import('../util/coerce-renderable').CoercedRenderable;
type Fiber = import('../util/fiber').Fiber;

import { isFunctionComponent } from '../component';
import { coerceRenderable } from '../util/coerce-renderable';
import { fiber } from '../util/fiber';
import { isArray } from '../util/is-array';
import { addProps } from './prop';
import { diffRef } from './ref';

export function createTree(renderable: CoercedRenderable, container: Node): Fiber {
  const root = fiber(null, null);
  createChild(renderable, root, null);
  mount(container, root, null);
  return root;
}

export function createChild(
  renderable: CoercedRenderable,
  parentFiber: Fiber,
  previousFiber: null | Fiber,
): Fiber {
  const f = fiber(null, renderable);
  mark(parentFiber, f, previousFiber);

  if (renderable === null) return f;

  if (typeof renderable === 'string') {
    f.dom = document.createTextNode(renderable);
    return f;
  }

  if (isArray(renderable)) {
    let last: null | Fiber = null;
    for (let i = 0; i < renderable.length; i++) {
      const child = createChild(coerceRenderable(renderable[i]), f, last);
      mark(f, child, last);
      last = child;
    }
    return f;
  }

  f.key = renderable.key;
  const { type, props } = renderable;
  if (typeof type === 'string') {
    const el = document.createElement(type);
    f.dom = el;
    addProps(el, props);
    createChild(coerceRenderable(props.children), f, null);
    diffRef(el, null, renderable.ref);
    return f;
  }

  if (isFunctionComponent(type)) {
    createChild(coerceRenderable(type(props)), f, null);
    return f;
  }

  f.component = new type(props);
  createChild(coerceRenderable(f.component.render(props)), f, null);
  return f;
}

export function mark(parent: Fiber, current: Fiber, previous: null | Fiber): void {
  if (previous) {
    previous.next = current;
  } else {
    parent.child = current;
  }
}

export function mount(container: Node, fiber: null | Fiber, before: null | Node): void {
  while (fiber !== null) {
    const { dom, child } = fiber;
    if (dom) {
      if (child) mount(dom, child, null);
      container.insertBefore(dom, null);
    } else if (child) {
      mount(container, child, before);
    }
    fiber = fiber.next;
  }
}
