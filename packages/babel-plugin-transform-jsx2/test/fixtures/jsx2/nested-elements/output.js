function test() {
  return jsx2.templateResult(_template(jsx2.createElement), []);
}

function _template(createElement) {
  const tree = createElement("div", null, [createElement("inner")]);

  _template = () => tree;

  return tree;
}
