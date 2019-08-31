function test() {
  return {
    tree: _template(jsx2),
    expressions: [{
      type: Component,
      key: null,
      ref: null,
      props: [s, {
        after: true,
        children: [{
          tree: _template2(jsx2),
          expressions: [],
          constructor: void 0
        }]
      }],
      constructor: void 0
    }],
    constructor: void 0
  };
}

function _template(jsx2) {
  const tree = {
    type: "div",
    key: null,
    ref: null,
    props: {
      children: [jsx2.expression]
    },
    constructor: void 0
  };

  _template = () => tree;

  return tree;
}

function _template2(jsx2) {
  const tree = {
    type: jsx2.Fragment,
    key: null,
    ref: null,
    props: {
      children: ["text"]
    },
    constructor: void 0
  };

  _template2 = () => tree;

  return tree;
}
