function test() {
  return jsx2.templateResult(_template(jsx2.createElement), [x]);
}

function _template(createElement) {
  const tree = createElement("div", {
    attr: createElement("inner", null, 0)
  });

  _template = () => tree;

  return tree;
}
