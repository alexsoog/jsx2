function test() {
  return jsx2.templateResult(_template(), [cond && jsx2.templateResult(_template2(), [x], 0)], 0);
}

function _template() {
  const tree = JSON.parse("{\"type\":\"div\",\"props\":{\"attr\":0}}");

  _template = () => tree;

  return tree;
}

function _template2() {
  const tree = JSON.parse("{\"type\":\"inner\",\"children\":[0]}");

  _template2 = () => tree;

  return tree;
}
