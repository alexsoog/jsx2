type Primitive = string | boolean | null;
type Marker = number;

type PropValue = Primitive | Marker | StaticNode;
type Props = {
  readonly children?: null | readonly PropValue[];
} | {
  readonly [key: string]: PropValue;
};
type PropsWithSpread = readonly (Props | Marker)[];

export interface StaticNode {
  readonly type: string;
  readonly key: null | string | Marker;
  readonly ref: null | Marker;
  readonly props: null | Props | PropsWithSpread;
}

export interface TemplateResult {
  readonly tree: StaticNode;
  readonly expressions: unknown[];
  readonly constructor: undefined;
}

const parsed = new WeakMap<TemplateStringsArray, StaticNode>();

function parse(strings: TemplateStringsArray): StaticNode {
  let s = strings[0];
  for (let i = 1; i < strings.length; i++) {
    s += (i - 1) + strings[i];
  }
  return JSON.parse(s) as StaticNode;
}

function getTree(strings: TemplateStringsArray): StaticNode {
  let tree = parsed.get(strings);
  if (tree) return tree;

  tree = parse(strings);
  parsed.set(strings, tree);
  return tree;
}

export function templateResult(strings: TemplateStringsArray, ...expressions: unknown[]): TemplateResult {
  return {
    tree: getTree(strings),
    expressions,
    constructor: void 0,
  };
}

export function isMarker(value: unknown): value is Marker {
  return typeof value === 'number';
};

export function isTemplateResult(value: unknown): value is TemplateResult {
  if (!value) return false;
  if (typeof value !== 'object') return false;
  let v = value as { constructor: unknown, tree: unknown };
  return v.constructor === void 0 && !!v.tree;
}
