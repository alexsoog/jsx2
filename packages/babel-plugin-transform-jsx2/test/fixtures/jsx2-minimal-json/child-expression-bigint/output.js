function test() {
  return jsx2.templateResult(_template(), [1n]);
}

function _template() {
  const tree = JSON.parse(`{"type":"div","props":{"children":[0]}}`);

  _template = () => tree;

  return tree;
}
