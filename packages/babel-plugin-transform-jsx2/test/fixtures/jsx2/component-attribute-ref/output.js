function test() {
  const ref = {};
  return jsx2.templateResult(_template(), [jsx2.createElement(Component, {
    ref: ref
  })], 1);
}

function _template() {
  const tree = JSON.parse(`{"type":"div","key":"","ref":null,"props":{"children":[1]}}`);

  _template = () => tree;

  return tree;
}
