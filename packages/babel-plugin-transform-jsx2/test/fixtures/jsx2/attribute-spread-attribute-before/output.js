function test() {
  return jsx2.templateResult(_template(jsx2.createElement, jsx2.expressionMarker), [s]);
}

function _template(createElement, expressionMarker) {
  const tree = createElement("div", [{
    before: true
  }, expressionMarker]);

  _template = () => tree;

  return tree;
}
