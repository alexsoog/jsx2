function test() {
  return jsx2.templateResult(_template(), []);
}

function _template() {
  const tree = JSON.parse(`{"type":"xml:foo","key":"","ref":null,"props":null}`);

  _template = () => tree;

  return tree;
}
