function test() {
  return {
    tree: _template(jsx2),
    expressions: [cond ? true : false],
    constructor: void 0
  };
}

function _template(jsx2) {
  const tree = {
    type: "div",
    key: null,
    ref: null,
    props: {
      attr: jsx2.expression
    }
  };

  _template = () => tree;

  return tree;
}
