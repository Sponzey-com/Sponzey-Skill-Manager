import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflowPath = ".github/workflows/release-vsix.yml";

const requiredWorkflowMarkers = Object.freeze([
  "name: Release VSIX",
  "tags:",
  "\"v*\"",
  "permissions:",
  "contents: write",
  "actions/checkout@v4",
  "actions/setup-node@v4",
  "node-version: \"22\"",
  "GITHUB_REF_NAME",
  "v${VERSION}",
  "BUILD_ONLY_TAG=\"${RELEASE_TAG}a\"",
  "register_release=true",
  "register_release=false",
  "publish_marketplace=true",
  "publish_marketplace=false",
  "npm install --no-save --no-package-lock @vscode/vsce",
  "npm run release:gate",
  "npm run package:vsix-candidate",
  "actions/upload-artifact@v4",
  "if: steps.tag_policy.outputs.register_release == 'true'",
  "gh release view",
  "gh release create",
  "gh release upload",
  "--clobber",
  "name: Publish VSIX to VS Code Marketplace",
  "if: steps.tag_policy.outputs.publish_marketplace == 'true'",
  "VSCE_PAT: ${{ secrets.VSCE_PAT }}",
  "node_modules/.bin/vsce publish --packagePath \"${VSIX_PATH}\"",
  ".dist",
  ".vsix",
]);

test("GitHub tag release workflow builds and registers VSIX release asset", async () => {
  const content = await readFile(workflowPath, "utf8");

  for (const marker of requiredWorkflowMarkers) {
    assert.match(content, new RegExp(escapeRegExp(marker)));
  }
});

test("GitHub build-only tag uploads artifact without registering release asset", async () => {
  const content = await readFile(workflowPath, "utf8");

  assert.match(content, /BUILD_ONLY_TAG="\$\{RELEASE_TAG\}a"/);
  assert.match(content, /register_release=false/);
  assert.match(content, /publish_marketplace=false/);
  assert.match(
    content,
    /if: steps\.tag_policy\.outputs\.register_release == 'true'/,
  );
  assert.match(content, /actions\/upload-artifact@v4/);
});

test("GitHub release tag publishes the verified VSIX with the repository secret", async () => {
  const content = await readFile(workflowPath, "utf8");

  assert.match(content, /publish_marketplace=true/);
  assert.match(
    content,
    /if: steps\.tag_policy\.outputs\.publish_marketplace == 'true'/,
  );
  assert.match(content, /VSCE_PAT: \$\{\{ secrets\.VSCE_PAT \}\}/);
  assert.match(
    content,
    /node_modules\/\.bin\/vsce publish --packagePath "\$\{VSIX_PATH\}"/,
  );
  assert.doesNotMatch(content, /--pat\s/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
