function test() {
  return jsx2.templateResult(_template(), [s]);
}

function _template() {
  const tree = JSON.parse(`{"type":"div","props":[{"before":true},0,{"children":["text"]}]}`);

  _template = () => tree;

  return tree;
}
