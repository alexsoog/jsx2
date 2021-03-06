type Fiber = import('.').Fiber;

export function mark(current: Fiber, parent: Fiber, previous: null | Fiber): void {
  current.parent = parent;
  if (previous === null) {
    current.index = 0;
    parent.child = current;
  } else {
    current.index = previous.index + 1;
    previous.next = current;
  }
}
