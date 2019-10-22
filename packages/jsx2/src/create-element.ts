type Ref<R> = import('./create-ref').Ref<R>;
type FunctionComponent<R> = import('./component').FunctionComponent<R>;
type Component<R> = import('./component').Component<R>;
type Renderable<R> = import('./render').Renderable<R>;

export interface VNode<R> {
  readonly type: string | FunctionComponent<R> | (new (props: object) => Component<R>);
  readonly key: string | number | null | undefined;
  readonly ref: null | undefined | Ref<R>;
  readonly props: RegularProps & { readonly children?: Renderable<R> };
  readonly constructor: undefined;
}

export interface RegularProps {
  readonly [key: string]: unknown;
}

export interface SpecialProps<R> {
  readonly key?: VNode<R>['key'];
  readonly ref?: VNode<R>['ref'];
  readonly children?: Renderable<R>;
}

export type Props<R> = SpecialProps<R> & RegularProps;

const nilProps: { key: null; ref: null; children?: null } = {
  key: null,
  ref: null,
} as const;

export function createElement<R>(
  type: VNode<R>['type'],
  props?: null | undefined | Props<R>,
  ...children: Renderable<R>[]
): VNode<R> {
  const { key = null, ref = null, ..._props } = props || nilProps;
  if (children.length > 0) {
    _props.children = children.length === 1 ? children[0] : children;
  }

  return Object.freeze({
    type,
    key,
    ref,
    props: Object.freeze(_props),
    constructor: void 0,
  });
}

export function isValidElement<R>(value: unknown): value is VNode<R> {
  return (
    typeof value === 'object' &&
    !!value &&
    value.constructor === void 0 &&
    !!(value as { type?: unknown }).type
  );
}
