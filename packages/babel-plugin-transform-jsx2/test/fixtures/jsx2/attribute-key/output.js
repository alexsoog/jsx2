function test() {
  return {
    tree: _template(jsx2),
    expressions: [],
    constructor: void 0
  };
}

function _template(jsx2) {
  const tree = {
    type: "div",
    key: "key",
    ref: null,
    props: null
  };

  _template = () => tree;

  return tree;
}
