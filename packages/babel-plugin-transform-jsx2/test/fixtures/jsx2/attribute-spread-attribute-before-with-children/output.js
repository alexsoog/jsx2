function test() {
  return jsx2.templateResult(_template(jsx2.createElement), [s]);
}

function _template(createElement) {
  const tree = createElement("div", [{
    before: true
  }, 0], "text");

  _template = () => tree;

  return tree;
}
