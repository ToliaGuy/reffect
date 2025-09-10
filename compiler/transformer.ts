import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";


function identifier(name: string) {
  return { type: "Identifier", name };
}

function stringLiteral(value: string) {
  return { type: "StringLiteral", value };
}

function booleanLiteral(value: boolean) {
  return { type: "BooleanLiteral", value };
}

function nullLiteral() {
  return { type: "NullLiteral" };
}

function memberExpression(object, property, computed = false) {
  return { type: "MemberExpression", object, property, computed, optional: false }; 
}

function callExpression(callee, args) {
  return { type: "CallExpression", callee, arguments: args, optional: false }; 
}

function objectProperty(key, value) {
  return { type: "ObjectProperty", key, value, computed: false, shorthand: false, method: false };
}

function spreadElement(argument) {
  return { type: "SpreadElement", argument };
}

function objectExpression(properties) {
  return { type: "ObjectExpression", properties };
}

function isLowercaseIntrinsicName(name: string) {
  if (name.length === 0) return false;
  const first = name[0];
  return first === first.toLowerCase();
}

function isValidIdentifierName(name: string) {
  // Basic conservative check sufficient for JSX attribute keys
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function convertJSXNameToExpression(nameNode) {
  if (!nameNode) return stringLiteral("");
  switch (nameNode.type) {
    case "JSXIdentifier": {
      const name = nameNode.name as string;
      if (isLowercaseIntrinsicName(name)) {
        return stringLiteral(name);
      } else {
        return identifier(name);
      }
    }
    case "JSXMemberExpression": {
      return convertJSXMemberExpression(nameNode);
    }
    case "JSXNamespacedName": {
      const ns = nameNode.namespace?.name ?? "";
      const name = nameNode.name?.name ?? "";
      return stringLiteral(`${ns}:${name}`);
    }
    default:
      return stringLiteral("");
  }
}

function convertJSXMemberExpression(node) {
  const object = node.object.type === "JSXIdentifier"
    ? identifier(node.object.name)
    : convertJSXMemberExpression(node.object);
  const property = identifier(node.property.name);
  return memberExpression(object, property, false);
}

function transformJSXAttributesToProps(attributes) {
  if (!attributes || attributes.length === 0) return nullLiteral();
  const props = [];
  for (const attr of attributes) {
    if (attr.type === "JSXAttribute") {
      const nameNode = attr.name;
      let key;
      if (nameNode.type === "JSXIdentifier" && isValidIdentifierName(nameNode.name)) {
        key = identifier(nameNode.name);
      } else if (nameNode.type === "JSXNamespacedName") {
        key = stringLiteral(`${nameNode.namespace.name}:${nameNode.name.name}`);
      } else {
        key = stringLiteral(nameNode.name);
      }

      let value;
      if (attr.value == null) {
        value = booleanLiteral(true);
      } else if (attr.value.type === "StringLiteral") {
        value = { type: "StringLiteral", value: attr.value.value };
      } else if (attr.value.type === "JSXExpressionContainer") {
        if (attr.value.expression && attr.value.expression.type !== "JSXEmptyExpression") {
          value = transformNode(attr.value.expression);
        } else {
          // default to true when empty
          value = booleanLiteral(true);
        }
      } else {
        value = transformNode(attr.value);
      }
      props.push(objectProperty(key, value));
    } else if (attr.type === "JSXSpreadAttribute") {
      props.push(spreadElement(transformNode(attr.argument)));
    }
  }
  return objectExpression(props);
}

function normalizeJSXText(value: string) {
  // Collapse whitespace similar to React transform basics
  const lines = value.split(/\r?\n/);
  let text = lines.map((l) => l.trim()).join(" ");
  text = text.replace(/\s+/g, " ");
  return text;
}

function transformJSXChildToArg(child) {
  switch (child.type) {
    case "JSXText": {
      const text = normalizeJSXText(child.value ?? "");
      return text.length > 0 ? stringLiteral(text) : null;
    }
    case "JSXExpressionContainer": {
      if (!child.expression || child.expression.type === "JSXEmptyExpression") return null;
      return transformNode(child.expression);
    }
    case "JSXElement":
      return transformJSXElement(child);
    case "JSXFragment":
      return transformJSXFragment(child);
    case "JSXSpreadChild":
      return spreadElement(transformNode(child.expression));
    default:
      return transformNode(child);
  }
}

function transformJSXElement(node) {
  const opening = node.openingElement;
  const nameExpr = convertJSXNameToExpression(opening.name);
  const propsExpr = transformJSXAttributesToProps(opening.attributes || []);
  const childArgs = [];
  for (const ch of node.children || []) {
    const arg = transformJSXChildToArg(ch);
    if (arg) childArgs.push(arg);
  }
  return callExpression(identifier("reffectElement"), [nameExpr, propsExpr, ...childArgs]);
}

function transformJSXFragment(node) {
  const nameExpr = identifier("Fragment");
  const propsExpr = nullLiteral();
  const childArgs = [];
  for (const ch of node.children || []) {
    const arg = transformJSXChildToArg(ch);
    if (arg) childArgs.push(arg);
  }
  return callExpression(identifier("reffectElement"), [nameExpr, propsExpr, ...childArgs]);
}

function transformNode(node: any) {
  if (Array.isArray(node)) {
    return node.map((n) => transformNode(n));
  }
  if (node && typeof node === "object") {
    if (node.type === "JSXElement") return transformJSXElement(node);
    if (node.type === "JSXFragment") return transformJSXFragment(node);
    const out = Array.isArray(node) ? [] : { ...node };
    for (const key of Object.keys(node)) {
      const value = (node as any)[key];
      (out as any)[key] = transformNode(value);
    }
    return out;
  }
  return node;
}

async function main(): Promise<void> {
  const projectRoot = resolve(process.cwd());
  const inputAstPath = resolve(projectRoot, "compiler", "ast.json");
  const outputAstPath = resolve(projectRoot, "compiler", "transformed-ast.json");
  const astText = await readFile(inputAstPath, "utf8");
  const ast = JSON.parse(astText);
  const transformed = transformNode(ast);
  await writeFile(outputAstPath, JSON.stringify(transformed, null, 2), "utf8");
  console.log(`Transformed AST written to: ${outputAstPath}`);
}

main().catch((err) => {
  console.error("Transformer failed:", err);
  process.exit(1);
});
