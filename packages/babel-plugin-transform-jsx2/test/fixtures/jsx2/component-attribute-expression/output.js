function test() {
  return jsx2.templateResult(_template(jsx2.createElement, jsx2.expressionMarker, jsx2.Fragment), [jsx2.createElement(Component, {
    attr: x
  })]);
}

function _template(createElement, expressionMarker, Fragment) {
  const tree = createElement("div", null, [expressionMarker]);

  _template = () => tree;

  return tree;
}
