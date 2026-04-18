import fs from "node:fs/promises";
import path from "node:path";

const handlerPath = path.join(
  process.cwd(),
  ".open-next",
  "server-functions",
  "default",
  "handler.mjs",
);

const patchedSnippet = "getMiddlewareManifest(){return null}";
const unpatchedPattern =
  /getMiddlewareManifest\(\)\{return this\.minimalMode\?null:require\(this\.middlewareManifestPath\)\}/;

async function main() {
  const handlerSource = await fs.readFile(handlerPath, "utf8");

  if (handlerSource.includes(patchedSnippet)) {
    console.log(`OpenNext handler already patched: ${handlerPath}`);
    return;
  }

  if (!unpatchedPattern.test(handlerSource)) {
    throw new Error(`OpenNext handler patch target not found: ${handlerPath}`);
  }

  const patchedSource = handlerSource.replace(unpatchedPattern, patchedSnippet);
  await fs.writeFile(handlerPath, patchedSource, "utf8");

  console.log(`Patched OpenNext handler: ${handlerPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});