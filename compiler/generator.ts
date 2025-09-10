import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import generate from "@babel/generator";

type BabelNode = any;

function generateFromAst(ast: BabelNode): string {
  const { code } = generate.default ? generate.default(ast, { retainLines: false }) : generate(ast, { retainLines: false });
  return code;
}

async function main(): Promise<void> {
  const projectRoot = resolve(process.cwd());
  const inputPath = resolve(projectRoot, "compiler", "transformed-ast.json");
  const outputPath = resolve(projectRoot, "compiler", "generated.ts");
  const astText = await readFile(inputPath, "utf8");
  const ast = JSON.parse(astText);
  const code = generateFromAst(ast);
  await writeFile(outputPath, code, "utf8");
  console.log(`Generated code written to: ${outputPath}`);
}

main().catch((err) => {
  console.error("Generator failed:", err);
  process.exit(1);
});
