import { checkArchitecture } from "./architecture-rules.mjs";

const rootDir = process.argv[2] ?? "src";
const result = await checkArchitecture({ rootDir });

if (result.violations.length > 0) {
  for (const violation of result.violations) {
    console.error(
      `${violation.code}: ${violation.filePath} imports ${violation.specifier}`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(`architecture ok (${result.files.length} source files checked)`);
}
