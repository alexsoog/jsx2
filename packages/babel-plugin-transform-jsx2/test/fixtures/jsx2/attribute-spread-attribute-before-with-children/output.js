function test() {
  return jsx2.templateResult(_template(jsx2.createElement, jsx2.expressionMarker, jsx2.Fragment), [s]);
}

function _template(createElement, expressionMarker, Fragment) {
  const tree = createElement("div", [{
    before: true
  }, expressionMarker], ["text"]);

  _template = () => tree;

  return tree;
}
