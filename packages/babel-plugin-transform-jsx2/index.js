const jsx = require('@babel/plugin-syntax-jsx');

module.exports = function({ types: t, template }) {
  const numberLiteralVisitor = {
    JSXExpressionContainer(path, state) {
      const expression = path.get('expression');
      if (expression.isNumericLiteral()) {
        state.numbers.push(expression.node.value);
        return;
      }

      if (expression.isJSXElement() || expression.isJSXFragment()) return;
      path.skip();
    },

    JSXElement(path) {
      if (isComponent(path)) path.skip();
    },
  };

  return {
    name: 'transform-jsx2',
    inherits: jsx.default,

    visitor: {
      'JSXElement|JSXFragment'(path) {
        path.replaceWith(buildTemplate(path));
      },
    },
  };

  function buildTemplate(path) {
    if (isComponent(path)) {
      return buildElement(path);
    }

    const numberState = {
      numbers: [],
      lowestNumber: 0,
    };
    path.traverse(numberLiteralVisitor, numberState);

    const expressions = [];
    let expressionMarker = null;
    let fragMarker = null;

    const treeNode = buildElement(path, {
      expressions,

      expressionMarker() {
        if (!expressionMarker) {
          expressionMarker = nextLowestNumber(numberState);
        }
        return t.cloneNode(expressionMarker);
      },

      fragMarker() {
        if (!fragMarker) {
          fragMarker = nextLowestNumber(numberState);
        }
        return t.cloneNode(fragMarker);
      },
    });

    const program = path.findParent(p => p.isProgram());
    const cooked = JSON.stringify(evaluateNode(program, treeNode));
    const stringified = t.templateLiteral(
      [
        t.templateElement({
          cooked,
          raw: cooked.replace(/\${|\\/g, '\\$&'),
        }),
      ],
      []
    );

    const id = path.scope.generateUidIdentifier('template');
    const lazyTree = template.statement.ast`
      function ${id}() {
        const tree = JSON.parse(${stringified});
        ${id} = () => tree;
        return tree;
      }
    `;
    program.pushContainer('body', lazyTree);

    return template.expression.ast`
      jsx2.templateResult(
        ${id}(),
        ${t.arrayExpression(expressions)},
        ${expressionMarker || (fragMarker ? template.expression.ast`void 0` : null)},
        ${fragMarker}
      )
    `;
  }

  function buildElement(path, state) {
    if (state && isComponent(path)) {
      state.expressions.push(path.node);
      return state.expressionMarker();
    }

    const frag = path.isJSXFragment();
    const type = frag
      ? state
        ? state.fragMarker()
        : template.expression.ast`jsx2.Fragment`
      : elementType(path);

    const { props, key, ref, children } = buildProps(
      frag ? [] : path.get('openingElement.attributes'),
      path.get('children'),
      state
    );

    if (state) {
      return template.expression.ast`{
        type: ${type},
        key: ${key},
        ref: ${ref},
        props: ${props},
      }`;
    }

    return template.expression.ast`
      jsx2.createElement(
        ${type},
        ${props || (children ? t.nullLiteral() : null)},
        ${children}
      )
    `;
  }

  function buildProps(attributePaths, childPaths, state) {
    const childrenStatic = [];
    const objs = [];
    let objProps = [];
    let ref = t.nullLiteral();
    let key = t.stringLiteral('');

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

      if (state) {
        if (name.isJSXIdentifier({ name: 'key' })) {
          key = extractAttributeValue(value, state);
          continue;
        } else if (name.isJSXIdentifier({ name: 'ref' })) {
          ref = extractAttributeValue(value, state);
          continue;
        }
      }

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

    const children = childrenStatic.length ? t.arrayExpression(childrenStatic) : null;
    if (state && children) {
      objProps.push(t.objectProperty(t.identifier('children'), children));
    }
    pushProps(objProps, objs);

    let props = t.nullLiteral();
    if (objs.length) {
      if (objs.length === 1 && t.isObjectExpression(objs[0])) {
        props = objs[0];
      } else if (state) {
        props = t.arrayExpression(objs);
      } else {
        props = t.objectExpression(flatMap(objs, o => o.properties));
      }
    }

    return { props, key, ref, children };
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

  function nextLowestNumber(state) {
    let { numbers, lowestNumber } = state;
    while (true) {
      lowestNumber++;
      if (!numbers.includes(lowestNumber)) {
        state.lowestNumber = lowestNumber;
        return t.numericLiteral(lowestNumber);
      }
    }
  }

  function evaluateNode(program, node) {
    const [path] = program.pushContainer('body', node);
    const result = path.evaluate();

    if (!result.confident) {
      throw path.buildCodeFrameError("Well this is strange, we can't evaluate the static template");
    }

    path.remove();
    return result.value;
  }
};
