# Task 020. Local VSIX Candidate Packaging Check

## 1. Summary

- [x] Phase 004 release candidate가 VSIX publishing 없이도 local packaging readiness를 판단할 수 있게 한다.
- [x] Local `node_modules/.bin/vsce`가 없을 때 network install, `npx`, global tool fallback을 시도하지 않고 `PackagingToolMissing` skip 결과를 반환한다.
- [x] Release gate는 packaging capability를 검사하고, 도구 부재는 제품 실패가 아니라 actionable skip evidence로 기록한다.

## 2. Scope

### Included

- [x] `scripts/package-vsix-candidate.mjs`를 추가한다.
- [x] `npm run check:vsix-candidate`와 `npm run package:vsix-candidate`를 추가한다.
- [x] `scripts/release-gate.mjs`에 packaging capability check를 연결한다.
- [x] Missing local packaging tool, available local tool, package success, package failure를 script test로 검증한다.
- [x] README, release smoke checklist, Extension Host smoke evidence template에 local VSIX candidate 흐름을 문서화한다.

### Excluded

- [x] VSIX publish workflow를 추가하지 않는다.
- [x] `@vscode/vsce`를 설치하거나 dependency로 추가하지 않는다.
- [x] `npx`, network install, global `vsce` fallback을 사용하지 않는다.
- [x] Product runtime, Domain, Application, Infrastructure, Presentation 코드를 변경하지 않는다.

## 3. Related Plan Items

- [x] `.tasks/plan.md` section 7.004.8 Release Candidate Packaging And Smoke Evidence.
- [x] `.tasks/plan.md` section 7.0.2 Phase Exit Gates.
- [x] `.tasks/plan.md` section 13 Definition Of Done.
- [x] `AGENTS.md` section 4 Configuration Policy.
- [x] `AGENTS.md` section 8 TDD Policy.
- [x] `AGENTS.md` section 9 Tidy First Policy.

## 4. Dependencies

### Previous Tasks

- [x] Task 019. Extension Host Smoke Evidence Template.

### Next Tasks

- [x] Phase 004 archive readiness or final Extension Development Host manual smoke evidence capture.

## 5. Architecture Notes

- [x] Changes are limited to Scripts, Tests, Documentation, and `.tasks`.
- [x] Packaging capability is release-time behavior and does not enter product runtime.
- [x] The script uses explicit command-line mode: `check` by default, `package` only with `--package`.
- [x] The script accepts injected file and command functions for deterministic tests.
- [x] Release gate calls packaging in `check` mode only and does not create `.vsix` output.

## 6. Functional Requirements

- [x] `npm run check:vsix-candidate` checks for local `node_modules/.bin/vsce`.
- [x] If local `vsce` is missing, the script returns `ok: true`, `status: skipped`, `code: PackagingToolMissing` in check mode.
- [x] If local `vsce` exists, check mode returns `PackagingToolAvailable` without running a package command.
- [x] `npm run package:vsix-candidate` writes `.dist/<name>-<version>.vsix` only when local `vsce` exists.
- [x] Package command failure returns `PackageFailed` with machine-readable status.
- [x] Release gate includes `packaging` in checked items and reports skipped packaging reason when `vsce` is absent.

## 7. Non-Functional Requirements

- [x] No new product setting is added.
- [x] No runtime environment value is read by product code.
- [x] No network command is executed for packaging readiness.
- [x] `.dist/` is git-ignored as a local artifact directory.
- [x] Script output is concise and safe for release evidence.

## 8. Implementation Steps

- [x] Write failing `package-vsix-candidate` script tests.
- [x] Write failing release gate tests for packaging available, skipped, and failed states.
- [x] Implement local-only VSIX candidate script.
- [x] Wire release gate to packaging capability check.
- [x] Add npm scripts and ignore `.dist/`.
- [x] Update README, release smoke checklist, and Extension Host smoke evidence template.
- [x] Run focused tests, packaging check, full test suite, build, and release gate.

## 9. TDD Checklist

- [x] Missing script import failed before implementation.
- [x] Release gate packaging checks failed before gate wiring.
- [x] Missing local `vsce` path test verifies no command execution.
- [x] Package command test verifies local binary path and deterministic `.dist/` output.
- [x] Package failure test verifies `PackageFailed`.
- [x] Documentation tests fail before README and smoke checklist updates.

## 10. Validation Checklist

- [x] Product runtime files are unchanged.
- [x] Release gate remains deterministic.
- [x] Missing packaging tool does not fail release gate.
- [x] Missing packaging tool does not trigger network install.
- [x] Packaging command uses only local `node_modules/.bin/vsce`.
- [x] Release gate output includes `packaging` and skipped `PackagingToolMissing`.
- [x] README and smoke checklist describe the local-only packaging behavior.

## 11. Logging Requirements

### Product Log

- [x] Do not add Product Log events in this task.

### Field Debug Log

- [x] Do not add Field Debug Log in this task.

### Development Log

- [x] Script stdout is the only Development Log style output.
- [x] Do not write secrets, tokens, full stack traces, or private paths to release script output.

## 12. State Machine Requirements

- [x] Product state machine is not needed.
- [x] Release validation state is represented by release gate checked/skipped/failure result:
  - [x] `CheckingPackagingCapability`
  - [x] `SkippedPackaging`
  - [x] `Completed`
  - [x] `Failed`

## 13. Done Criteria

- [x] All implementation checklist items are complete.
- [x] Focused script tests pass.
- [x] `npm run check:vsix-candidate` passes and reports `PackagingToolMissing` skip in the current environment.
- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] `npm run release:gate` passes.
- [x] Remaining manual smoke evidence requirement is recorded.

## 14. Completion Report

- [x] Added `scripts/package-vsix-candidate.mjs` with `check` and `package` modes.
- [x] Added `check:vsix-candidate` and `package:vsix-candidate` npm scripts.
- [x] Added `.dist/` to `.gitignore`.
- [x] Updated release gate to include packaging capability and report `PackagingToolMissing` as a skip.
- [x] Updated README, release smoke checklist, and Extension Host smoke evidence template.
- [x] Focused verification passed: 17 script/documentation tests.
- [x] `npm run check:vsix-candidate` passed with `vsix-candidate skipped: ... PackagingToolMissing`.
- [x] Full verification passed: `npm test` with 342 passing tests.
- [x] Build verification passed: `npm run build`.
- [x] Release verification passed: `npm run release:gate` with `tests, architecture, manifest, build, docs, smoke, evidence, packaging` and skipped `PackagingToolMissing`.
- [x] Remaining risk: actual Extension Development Host manual smoke evidence still needs to be captured before declaring a human-verified release candidate.
