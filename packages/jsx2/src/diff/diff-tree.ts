type Fiber = import('../fiber').Fiber;
type CoercedRenderable = import('../util/coerce-renderable').CoercedRenderable;
type RenderableArray = import('../render').RenderableArray;
type ElementVNode = import('../create-element').ElementVNode;
type FunctionComponentVNode = import('../create-element').FunctionComponentVNode;
type ClassComponentVNode = import('../create-element').ClassComponentVNode;
type RefWork = import('./ref').RefWork;

import { isFunctionComponent } from '../component';
import { isValidElement } from '../create-element';
import { clone } from '../fiber/clone';
import { getNextSibling } from '../fiber/get-next-sibling';
import { insert } from '../fiber/insert';
import { mark } from '../fiber/mark';
import { remove } from '../fiber/remove';
import { replace } from '../fiber/replace';
import { unmount } from '../fiber/unmount';
import { verify } from '../fiber/verify';
import { coerceRenderable } from '../util/coerce-renderable';
import { isArray } from '../util/is-array';
import { equals } from '../util/nullish-equals';
import { createChild } from './create-tree';
import { diffProps } from './prop';
import { deferRef } from './ref';

export function diffTree(
  old: Fiber,
  renderable: CoercedRenderable,
  container: Node,
  refs: RefWork[],
): void {
  diffChild(old.child!, renderable, old, null, container, refs);
  verify(old);
}

function diffChild(
  old: Fiber,
  renderable: CoercedRenderable,
  parentFiber: Fiber,
  previousFiber: null | Fiber,
  container: Node,
  refs: RefWork[],
): Fiber {
  const { data } = old;
  if (data === renderable) return old;

  if (renderable === null) {
    return renderNull(old, renderable, parentFiber, previousFiber, container, refs);
  }

  if (typeof renderable === 'string') {
    return renderText(old, renderable, parentFiber, previousFiber, container, refs);
  }

  if (isArray(renderable)) {
    return renderArray(old, renderable, parentFiber, previousFiber, container, refs);
  }

  const { type } = renderable;
  if (typeof type === 'string') {
    return renderElement(
      old,
      renderable as ElementVNode,
      parentFiber,
      previousFiber,
      container,
      refs,
    );
  }

  return renderComponent(
    old,
    renderable as FunctionComponentVNode | ClassComponentVNode,
    parentFiber,
    previousFiber,
    container,
    refs,
  );
}

function renderNull(
  old: Fiber,
  renderable: null,
  parentFiber: Fiber,
  previousFiber: null | Fiber,
  container: Node,
  refs: RefWork[],
): Fiber {
  return replaceFiber(old, renderable, parentFiber, previousFiber, container, refs);
}

function renderText(
  old: Fiber,
  renderable: string,
  parentFiber: Fiber,
  previousFiber: null | Fiber,
  container: Node,
  refs: RefWork[],
): Fiber {
  const { data } = old;
  if (typeof data !== 'string') {
    return replaceFiber(old, renderable, parentFiber, previousFiber, container, refs);
  }
  old.data = renderable;

  (old.dom as Text).data = renderable;
  return old;
}

function renderArray(
  old: Fiber,
  renderable: RenderableArray,
  parentFiber: Fiber,
  previousFiber: null | Fiber,
  container: Node,
  refs: RefWork[],
): Fiber {
  const { data } = old;
  if (!isArray(data)) {
    return replaceFiber(old, renderable, parentFiber, previousFiber, container, refs);
  }
  old.data = renderable;

  let i = 0;
  let current: null | Fiber = old.child;
  let last: null | Fiber = null;
  for (; i < renderable.length && current !== null; i++) {
    const r = coerceRenderable(renderable[i]);
    if (isValidElement(r) && !equals(current.key, r.key)) break;
    const f = diffChild(current, r, old, last, container, refs);
    last = f;
    current = f.next;
  }

  const keyed = Object.create(null) as Record<string, undefined | Fiber>;
  for (let c = current; c !== null; c = c.next) {
    const { key } = c;
    keyed[key === null ? c.index : key] = c;
  }

  // If we have a last node, we want to get its next's DOM. If not, we want to
  // descend into the old fiber to find the next DOM.
  const before = getNextSibling(last || old, container, !!last);
  for (; i < renderable.length; i++) {
    const r = coerceRenderable(renderable[i]);

    if (isValidElement(r)) {
      const key = r.key === null ? i : r.key;
      const already = keyed[key];

      if (already) {
        const cloned = clone(already);
        mark(cloned, old, last);

        if (current === already) {
          current = current.next;
        } else {
          insert(cloned, container, before);
        }

        const f = diffChild(cloned, r, old, last, container, refs);
        last = f;
        f.next = null;
        continue;
      }
    }

    const f = createChild(r, old, last, refs);
    insert(f, container, before);
    last = f;
  }

  if (last) last.next = current;
  while (current !== null) {
    unmount(current);
    current = remove(current, old, last, container);
  }
  return old;
}

function renderElement(
  old: Fiber,
  renderable: ElementVNode,
  parentFiber: Fiber,
  previousFiber: null | Fiber,
  container: Node,
  refs: RefWork[],
): Fiber {
  const { data } = old;
  if (data === null || typeof data === 'string' || isArray(data)) {
    return replaceFiber(old, renderable, parentFiber, previousFiber, container, refs);
  }

  const { type } = renderable;
  if (type !== data.type) {
    return replaceFiber(old, renderable, parentFiber, previousFiber, container, refs);
  }
  old.data = renderable;

  const oldProps = data.props;
  const { props } = renderable;
  const dom = old.dom!;
  diffProps(dom as HTMLElement, oldProps, props);
  diffChild(old.child!, coerceRenderable(props.children), old, null, dom, refs);
  deferRef(refs, dom, data.ref, renderable.ref);
  return old;
}

function renderComponent(
  old: Fiber,
  renderable: FunctionComponentVNode | ClassComponentVNode,
  parentFiber: Fiber,
  previousFiber: null | Fiber,
  container: Node,
  refs: RefWork[],
): Fiber {
  const { data } = old;
  if (data === null || typeof data === 'string' || isArray(data)) {
    return replaceFiber(old, renderable, parentFiber, previousFiber, container, refs);
  }
  old.data = renderable;

  const { type } = renderable;
  if (type !== data.type) {
    return replaceFiber(old, renderable, parentFiber, previousFiber, container, refs);
  }

  const { props } = renderable;
  const rendered = coerceRenderable(
    isFunctionComponent(type) ? type(props) : old.component!.render(props),
  );

  diffChild(old.child!, rendered, old, null, container, refs);
  return old;
}

function replaceFiber(
  old: Fiber,
  renderable: CoercedRenderable,
  parentFiber: Fiber,
  previousFiber: null | Fiber,
  container: Node,
  refs: RefWork[],
): Fiber {
  const f = createChild(renderable, parentFiber, previousFiber, refs);
  return replace(old, f, parentFiber, container);
}
