function test() {
  return jsx2.templateResult(_template(), [jsx2.Fragment, x]);
}

function _template() {
  const tree = JSON.parse(`{"type":0,"props":{"children":[1]}}`);

  _template = () => tree;

  return tree;
}
