function test() {
  return jsx2.templateResult(_template(), [jsx2.createElement(Component, { ...s
  })]);
}

function _template() {
  const tree = JSON.parse(`{"type":"div","props":{"children":0}}`);

  _template = () => tree;

  return tree;
}
