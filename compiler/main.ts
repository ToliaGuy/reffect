import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parse } from "@babel/parser";

async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function main(): Promise<void> {
  const projectRoot = resolve(process.cwd());
  const inputPath = resolve(projectRoot, "src", "main.tsx");
  const outputPath = resolve(projectRoot, "compiler", "ast.json");

  const sourceCode = await readFile(inputPath, "utf8");

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

  await ensureDirectory(dirname(outputPath));
  await writeFile(outputPath, JSON.stringify(ast, null, 2), "utf8");
  console.log(`Parsed AST written to: ${outputPath}`);
}

main().catch((error) => {
  console.error("Failed to parse src/main.tsx with Babel:", error);
  process.exit(1);
});
