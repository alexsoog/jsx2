const jsx = require('@babel/plugin-syntax-jsx');

module.exports = function({ types: t, template }) {
  return {
    name: 'transform-jsx2',
    inherits: jsx.default,

    visitor: {
      'JSXElement|JSXFragment'(path) {
        path.replaceWith(buildTemplate(path));
      },
    },
  };

  function createElementRef(insideTemplate) {
    if (insideTemplate) return t.identifier('createElement');
    return template.expression.ast`jsx2.createElement`;
  }

  function expressionMarkerRef(insideTemplate) {
    if (insideTemplate) return t.identifier('expressionMarker');
    return template.expression.ast`jsx2.expressionMarker`;
  }

  function fragMarkerRef(insideTemplate) {
    if (insideTemplate) return t.identifier('Fragment');
    return template.expression.ast`jsx2.Fragment`;
  }

  function buildTemplate(path) {
    if (isComponent(path)) {
      return buildElement(path);
    }

    const expressions = [];
    const numbers = [];
    let hasExpressionMarker = false;
    let hasFragment = false;

    const tree = buildElement(path, {
      expressions,
      numbers,
      expressionMarker() {
        hasExpressionMarker = true;
        return expressionMarkerRef(true);
      },
      fragMarker() {
        hasFragment = true;
        return fragMarkerRef(true);
      },
    });

    let expressionMarker = null;
    if (hasExpressionMarker) {
      for (let i = 0; true; i++) {
        if (!numbers.includes(i)) {
          expressionMarker = t.numericLiteral(i);
          break;
        }
      }
    }

    const id = path.scope.generateUidIdentifier('template');
    const lazyTree = template.statement.ast`
      function ${id}(
        ${createElementRef(true)},
        ${hasExpressionMarker ? expressionMarkerRef(true) : null},
        ${hasFragment ? fragMarkerRef(true) : null}
      ) {
        const tree = ${tree};
        ${id} = () => tree;
        return tree;
      }
    `;
    const program = path.findParent(p => p.isProgram());
    program.pushContainer('body', lazyTree);

    return template.expression.ast`
      jsx2.templateResult(
        ${id}(
          ${createElementRef(false)},
          ${expressionMarker},
          ${hasFragment ? fragMarkerRef(false) : null}
        ),
        ${t.arrayExpression(expressions)},
        ${expressionMarker}
      )
    `;
  }

  function buildElement(path, state) {
    if (isComponent(path) && state) {
      state.expressions.push(path.node);
      return state.expressionMarker();
    }

    const frag = path.isJSXFragment();
    const type = frag
      ? state
        ? state.fragMarker()
        : fragMarkerRef(false)
      : elementType(path);

    const { props, children } = buildProps(
      frag ? [] : path.get('openingElement.attributes'),
      path.get('children'),
      state
    );

    return template.expression.ast`
      ${createElementRef(state)}(${type}, ${props}, ${children})
    `;
  }

  function buildProps(attributePaths, childPaths, state) {
    const childrenStatic = [];
    const objs = [];
    let objProps = [];

    for (let i = 0; i < attributePaths.length; i++) {
      const attribute = attributePaths[i];

      if (attribute.isJSXSpreadAttribute()) {
        objProps = pushProps(objProps, objs);
        const { argument } = attribute.node;
        if (state) {
          state.expressions.push(argument);
          objs.push(state.expressionMarker());
        } else {
          objs.push(t.objectExpression([t.spreadElement(argument)]));
        }
        continue;
      }

      const name = attribute.get('name');
      const value = attribute.get('value');

      objProps.push(
        t.objectProperty(convertJSXName(name, false), extractAttributeValue(value, state))
      );
    }

    for (let i = 0; i < childPaths.length; i++) {
      const child = childPaths[i];
      if (child.isJSXText()) {
        const text = cleanJSXText(child.node);
        if (text) childrenStatic.push(text);
        continue;
      }

      if (child.isJSXSpreadChild()) {
        const array = t.arrayExpression([t.spreadElement(child.node.expression)]);
        if (state) {
          state.expressions.push(array);
          childrenStatic.push(state.expressionMarker());
        } else {
          childrenStatic.push(array);
        }
        continue;
      }

      childrenStatic.push(extractValue(child, state));
    }
    pushProps(objProps, objs);

    const children = childrenStatic.length ? t.arrayExpression(childrenStatic) : null;

    let props = null;
    if (objs.length) {
      if (objs.length === 1 && t.isObjectExpression(objs[0])) {
        props = objs[0];
      } else if (state) {
        props = t.arrayExpression(objs);
      } else {
        props = t.objectExpression(flatMap(objs, o => o.properties));
      }
    } else if (children) {
      props = t.nullLiteral();
    }

    return { props, children };
  }

  function pushProps(objProps, objs) {
    if (!objProps.length) return objProps;

    objs.push(t.objectExpression(objProps));
    return [];
  }

  function extractAttributeValue(value, state) {
    if (!value.node) return t.booleanLiteral(true);
    return extractValue(value, state);
  }

  function extractValue(value, state) {
    if (value.isJSXExpressionContainer()) value = value.get('expression');

    if (value.isJSXElement() || value.isJSXFragment()) {
      if (state) return buildElement(value, state);
      return buildTemplate(value);
    }

    const { node } = value;
    if (value.isNumericLiteral()) {
      state.numbers.push(node.value);
      return node;
    }
    if (value.isLiteral()) return node;

    if (!state) return node;
    state.expressions.push(node);
    return state.expressionMarker();
  }

  function elementType(path) {
    const node = convertJSXName(path.get('openingElement.name'));
    if (t.isStringLiteral(node)) return node;
    if (!t.isIdentifier(node)) return node;

    const { name } = node;
    if (t.react.isCompatTag(name)) return t.stringLiteral(name);
    return node;
  }

  function isComponent(path) {
    if (path.isJSXFragment()) return false;
    return !t.isStringLiteral(elementType(path));
  }

  function convertJSXName(name, root = true) {
    if (name.isJSXMemberExpression()) {
      return t.memberExpression(
        convertJSXName(name.get('object'), true),
        convertJSXName(name.get('property'), false)
      );
    }

    const { node } = name;
    if (name.isJSXNamespacedName()) {
      return t.stringLiteral(`${node.namespace.name}:${node.name.name}`);
    }

    if (root) {
      if (name.isJSXIdentifier({ name: 'this' })) {
        return t.thisExpression();
      }
      if (!t.isValidIdentifier(node.name)) {
        throw name.buildCodeFrameError('invalid name');
      }
    }

    return t.identifier(node.name);
  }

  function cleanJSXText(node) {
    return t.react.buildChildren({ children: [node] }).pop();
  }

  function flatMap(array, cb) {
    if (array.flatMap) {
      return array.flatMap(cb);
    }
    return array.reduce((collection, ...args) => {
      return collection.concat(cb(...args));
    }, []);
  }
};
