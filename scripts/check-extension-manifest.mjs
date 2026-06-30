import { access, readFile } from "node:fs/promises";

import { validateExtensionManifest } from "./extension-manifest-rules.mjs";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const result = await validateExtensionManifest({
  packageJson,
  async fileExists(filePath) {
    try {
      await access(filePath);
      return true;
    } catch (error) {
      if (error?.code === "ENOENT") {
        return false;
      }
      throw error;
    }
  },
});

if (!result.ok) {
  for (const diagnostic of result.diagnostics) {
    console.error(`${diagnostic.code}: ${diagnostic.message}`);
  }
  process.exitCode = 1;
} else {
  console.log("extension manifest ok");
}
