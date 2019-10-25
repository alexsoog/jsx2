type MarkedNode<R> = import('./mark').MarkedNode<R>;
type RenderedChild = import('../render').RenderedChild;

export function removeRange<R>(node: RenderedChild | Comment): void {
  const { parentNode } = node;
  if (parentNode === null) throw new Error('detached child');

  const end = (node as MarkedNode<R>)._range!;
  if (node === end) {
    parentNode.removeChild(node);
    return;
  }

  let current = node as null | ChildNode;
  do {
    const n = current!.nextSibling;
    parentNode.removeChild(current!);
    current = n;
  } while (current !== end);
}
