function test() {
  return jsx2.templateResult(_template(), [x], 1);
}

function _template() {
  const tree = JSON.parse(`{"type":"div","key":"","ref":null,"props":{"children":[{"type":"inner","key":"","ref":null,"props":{"children":[1]}}]}}`);

  _template = () => tree;

  return tree;
}
