function test() {
  return jsx2.template(_template(jsx2), []);
}

function _template(jsx2) {
  const tree = jsx2.createElement(jsx2.Fragment, null, null, null);

  _template = () => tree;

  return tree;
}
