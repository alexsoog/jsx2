function test() {
  return jsx2.templateResult(_template(jsx2.createElement), []);
}

function _template(createElement) {
  const tree = createElement("div", {
    children: "foo"
  }, "real children");

  _template = () => tree;

  return tree;
}
