function test() {
  return jsx2.templateResult(_template(jsx2.createElement), [cond ? jsx2.templateResult(_template2(jsx2.createElement), []) : jsx2.templateResult(_template3(jsx2.createElement), [])]);
}

function _template(createElement) {
  const tree = createElement("div", null, 0);

  _template = () => tree;

  return tree;
}

function _template2(createElement) {
  const tree = createElement("t", null);

  _template2 = () => tree;

  return tree;
}

function _template3(createElement) {
  const tree = createElement("f", null);

  _template3 = () => tree;

  return tree;
}
