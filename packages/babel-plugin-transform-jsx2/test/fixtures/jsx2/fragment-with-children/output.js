function test() {
  return jsx2.templateResult(_template(jsx2.createElement, jsx2.Fragment), []);
}

function _template(createElement, Fragment) {
  const tree = createElement(Fragment, null, [createElement("inner")]);

  _template = () => tree;

  return tree;
}
