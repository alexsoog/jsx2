function test() {
  return jsx2.templateResult(_template(), [x], 0);
}

function _template() {
  const tree = JSON.parse("{\"type\":\"div\",\"children\":[{\"type\":\"inner\",\"children\":[0]}]}");

  _template = () => tree;

  return tree;
}
