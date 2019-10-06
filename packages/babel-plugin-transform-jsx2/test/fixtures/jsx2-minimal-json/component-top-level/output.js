function test() {
  return jsx2.createElement(Component, {
    id: foo,
    bar: bar
  }, [jsx2.templateResult(_template(), [text]), "second", jsx2.templateResult(_template2(), []), fourth, jsx2.templateResult(_template3(), [fifth]), [...sixth]]);
}

function _template() {
  const tree = JSON.parse(`{"type":"first","props":{"children":0}}`);

  _template = () => tree;

  return tree;
}

function _template2() {
  const tree = JSON.parse(`{"type":"third","props":{"third":"third"}}`);

  _template2 = () => tree;

  return tree;
}

function _template3() {
  const tree = JSON.parse(`{"type":"fifth","props":{"fifth":0}}`);

  _template3 = () => tree;

  return tree;
}
