function test() {
  return jsx2.templateResult(_template(), [s], 0);
}

function _template() {
  const tree = JSON.parse("{\"type\":\"div\",\"props\":[0,{\"after\":true}]}");

  _template = () => tree;

  return tree;
}
