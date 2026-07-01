# Task 019. Extension Host Smoke Evidence Template

## 1. Summary

- [x] Phase 004 Extension Development Host 수동 검증 결과를 기록할 evidence template을 추가한다.
- [x] Release gate는 smoke checklist뿐 아니라 evidence template의 존재와 필수 섹션을 검증한다.
- [x] 이 작업은 product runtime을 변경하지 않고 Scripts/Test/Docs 범위에서만 수행한다.

## 2. Scope

### Included

- [x] `.tasks/extension-host-smoke-evidence.md` template을 추가한다.
- [x] Template은 environment, commands, result summary, failed items, evidence notes, blocker 기록 섹션을 포함한다.
- [x] `scripts/release-gate.mjs`가 evidence template 존재와 필수 marker를 검증한다.
- [x] Script tests가 missing/invalid evidence template failure를 검증한다.
- [x] Smoke checklist tests가 evidence template 필수 섹션을 검증한다.

### Excluded

- [x] VSIX 생성 스크립트를 추가하지 않는다.
- [x] Extension Host GUI를 자동 실행하지 않는다.
- [x] Network install, global tool install, publish workflow를 추가하지 않는다.
- [x] Product runtime, Domain, Application, Infrastructure, Presentation 코드를 변경하지 않는다.

## 3. Related Plan Items

- [x] `.tasks/plan.md` section 7.004.8 Release Candidate Packaging And Smoke Evidence.
- [x] `.tasks/plan.md` section 8.4 Manual Smoke Requirements.
- [x] `.tasks/plan.md` section 15.1 Required Verification Evidence.
- [x] `AGENTS.md` section 8 TDD Policy.
- [x] `AGENTS.md` section 9 Tidy First Policy.

## 4. Dependencies

### Previous Tasks

- [x] Task 018. Backup Lifecycle Result Rendering.

### Next Tasks

- [x] VSIX local candidate script decision or Phase 004 archive readiness.

## 5. Architecture Notes

- [x] Changes are limited to Scripts, Tests, and `.tasks` documentation.
- [x] Product runtime code must not read release evidence files.
- [x] Release gate script validates static files and does not mutate environment.
- [x] No external command is added beyond existing release gate checks.

## 6. Functional Requirements

- [x] Evidence template records exact command used to open Extension Development Host.
- [x] Evidence template records VSCode version, extension host launch result, checklist result summary, failed items, and blockers.
- [x] Evidence template records whether manual smoke was completed, skipped, or blocked.
- [x] Release gate fails with `DocsFailed` when evidence template is missing.
- [x] Release gate fails with `SmokeMissing` when evidence template lacks required markers.

## 7. Non-Functional Requirements

- [x] No new settings are added.
- [x] No runtime environment values are read by product code.
- [x] Release gate does not execute network install or VSIX publish commands.
- [x] Evidence template must not request secrets, tokens, raw user file content, or full stack traces.

## 8. Implementation Steps

- [x] Write failing smoke evidence template test.
- [x] Write failing release gate tests for missing and invalid evidence template.
- [x] Add evidence template.
- [x] Update release gate static validation.
- [x] Run focused script tests, full test suite, build, and release gate.

## 9. TDD Checklist

- [x] Evidence template test fails before the file exists.
- [x] Release gate test fails before the script checks evidence template.
- [x] Tests use fake file readers and do not depend on local VSCode.
- [x] Release gate test covers missing file and invalid content.

## 10. Validation Checklist

- [x] Product runtime files are unchanged.
- [x] Release gate remains deterministic.
- [x] Missing evidence template produces machine-readable failure.
- [x] Invalid evidence template produces machine-readable failure.
- [x] Current valid evidence template passes release gate.

## 11. Logging Requirements

### Product Log

- [x] Do not add Product Log events in this task.

### Field Debug Log

- [x] Do not add Field Debug Log in this task.

### Development Log

- [x] Release script stdout remains the only script output.

## 12. State Machine Requirements

- [x] No product state machine is needed.
- [x] Release evidence status is recorded as checklist text: `completed`, `blocked`, or `skipped`.

## 13. Done Criteria

- [x] All implementation checklist items are complete.
- [x] Focused script tests pass.
- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] `npm run release:gate` passes.
- [x] Remaining packaging decision risks are recorded.

## 14. Completion Report

- [x] Added `.tasks/extension-host-smoke-evidence.md` as the manual Extension Development Host evidence template.
- [x] Updated `scripts/release-gate.mjs` to validate release smoke checklist and Extension Host smoke evidence markers.
- [x] Added release gate tests for missing and invalid evidence template content.
- [x] Added smoke checklist coverage for required evidence template sections.
- [x] Focused verification passed: `node --test test/scripts/release-gate.test.mjs test/scripts/release-smoke-checklist.test.mjs` with 8 passing tests.
- [x] Full verification passed: `npm test` with 335 passing tests.
- [x] Build verification passed: `npm run build`.
- [x] Release verification passed: `npm run release:gate` with `tests, architecture, manifest, build, docs, smoke, evidence`.
- [x] Remaining risk: actual manual Extension Host execution evidence must still be filled during release candidate validation.
