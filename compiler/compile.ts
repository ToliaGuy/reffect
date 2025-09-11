import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parse } from "@babel/parser";
import { transformFromAstAsync } from "@babel/core";

async function ensureDirectory(path: string) {
  await mkdir(path, { recursive: true });
}

export async function compile(sourceCode: string, filename: string) {
  const ast = parse(sourceCode, {
    sourceType: "module",
    plugins: [
      "typescript",
      "jsx"
    ],
    errorRecovery: false,
    allowReturnOutsideFunction: false,
    allowAwaitOutsideFunction: false
  });

  const result = await transformFromAstAsync(ast, sourceCode, {
    filename: filename,
    babelrc: false,
    configFile: false,
    generatorOpts: { retainLines: false },
    plugins: [
      [
        "@babel/plugin-transform-react-jsx",
        {
          runtime: "classic",
          pragma: "createElement",
          pragmaFrag: "Fragment",
          throwIfNamespace: false
        }
      ]
    ]
  });

  if (!result || !result.code) {
    throw new Error("Babel transform returned no code");
  }


  return {
    js: { 
      code: result.code
    },
    css: '' // don't bother with css for now
  };
}

async function main() {
  const projectRoot = resolve(process.cwd());
  const inputPath = resolve(projectRoot, "src", "main.reffect");
  const outputPath = resolve(projectRoot, "compiler", "generated.ts");

  const sourceCode = await readFile(inputPath, "utf8");
  const result = await compile(sourceCode, "src/main.reffect");

  await ensureDirectory(dirname(outputPath));
  await writeFile(outputPath, result.js.code, "utf8");
  console.log(`Generated code written to: ${outputPath}`);
}

main().catch((error) => {
  console.error("Unified compile failed:", error);
  process.exit(1);
});


