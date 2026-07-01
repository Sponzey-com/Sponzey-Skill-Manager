# Task 018. Backup Lifecycle Result Rendering

## 1. Summary

- [x] Backup compare, restore, delete 성공 결과를 사용자에게 이해 가능한 notification으로 표시한다.
- [x] Result renderer는 raw backup path, target path, skill body, secret, stack trace를 표시하지 않는다.
- [x] Presentation renderer만 변경하고 Application use case, repository adapter, command routing은 변경하지 않는다.

## 2. Scope

### Included

- [x] `skill.backup.compare.completed` 결과를 in-sync 또는 difference summary로 표시한다.
- [x] `skill.backup.restore.completed` 결과를 restored skill name과 snapshot id 중심으로 표시한다.
- [x] `skill.backup.delete.completed` 결과를 backup snapshot deletion으로 표시한다.
- [x] Renderer tests가 raw path 누출을 검증한다.

### Excluded

- [x] Custom diff UI, webview, file-level compare detail view를 만들지 않는다.
- [x] Backup compare/restore/delete use case result schema를 변경하지 않는다.
- [x] 새 설정, 외부 policy file, 환경 변수 조회를 추가하지 않는다.
- [x] Product Log event schema를 변경하지 않는다.

## 3. Related Plan Items

- [x] `.tasks/plan.md` section 7.004.4 Backup Compare, Restore, And Lifecycle Governance.
- [x] `.tasks/plan.md` section 7.004.8 Release Candidate Packaging And Smoke Evidence.
- [x] `.tasks/plan.md` section 10 Logging Strategy.
- [x] `AGENTS.md` section 6 Logging Policy.
- [x] `AGENTS.md` section 9 Tidy First Policy.

## 4. Dependencies

### Previous Tasks

- [x] Task 015. Backup Compare Command Exposure.
- [x] Task 016. Backup Restore Command Exposure.
- [x] Task 017. Backup Delete Diagnostics Remediation Exposure.

### Next Tasks

- [x] Extension Host smoke evidence hardening or Phase 004 release candidate packaging decision.

## 5. Architecture Notes

- [x] Presentation renderer formats already returned result DTOs only.
- [x] Renderer must not inspect filesystem, settings, environment, VSCode workspace, or repository adapters.
- [x] Application use cases remain responsible for result event codes and lifecycle policy.
- [x] Product Log events remain machine-readable; renderer messages are user-facing summaries.

## 6. Functional Requirements

- [x] Compare in-sync result says backup is in sync with the reference.
- [x] Compare different result includes backup-only, reference-only, and modified counts.
- [x] Restore result says which skill and snapshot were restored without showing target path.
- [x] Delete result says backup snapshot was deleted without showing backup path.
- [x] Failed results still use existing diagnostic/error rendering.

## 7. Non-Functional Requirements

- [x] No new runtime setting is added.
- [x] No external I/O is added.
- [x] Notification messages do not include `/secret`, backupPath, targetPath, full diff body, skill body, secret, or stack trace.
- [x] Tests assert behavior at renderer boundary with fake window only.

## 8. Implementation Steps

- [x] Write failing renderer tests for backup compare/restore/delete success messages.
- [x] Implement minimal event-specific rendering in `command-result-renderer`.
- [x] Keep generic event rendering for unrelated events unchanged.
- [x] Run focused renderer tests, full test suite, build, and release gate.

## 9. TDD Checklist

- [x] Renderer test fails before event-specific backup messages are implemented.
- [x] Renderer test covers compare difference counts.
- [x] Renderer test covers restore/delete path redaction.
- [x] Existing generic rendering tests remain passing.

## 10. Validation Checklist

- [x] Domain/Application code is unchanged.
- [x] Presentation renderer does not implement backup lifecycle policy.
- [x] Product Log payload remains unchanged.
- [x] Message strings are concise and user-facing.
- [x] No path-like test value appears in rendered messages.

## 11. Logging Requirements

### Product Log

- [x] Do not add Product Log events in this task.
- [x] Use existing backup lifecycle Product Log event codes as renderer input.

### Field Debug Log

- [x] Do not add Field Debug Log in this task.

### Development Log

- [x] Do not add Development Log in this task.

## 12. State Machine Requirements

- [x] No new state machine is needed because this task formats terminal use case results only.
- [x] Backup lifecycle state machines/use case steps remain unchanged.

## 13. Done Criteria

- [x] All implementation checklist items are complete.
- [x] Focused renderer tests pass.
- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] `npm run release:gate` passes.
- [x] Remaining manual smoke risks are recorded.

## 14. Completion Report

- Implemented Presentation-only result rendering for backup lifecycle success events:
  - `skill.backup.compare.completed` now shows either in-sync status or backup-only/reference-only/modified file counts.
  - `skill.backup.restore.completed` now shows restored skill name and snapshot id without target path exposure.
  - `skill.backup.delete.completed` now shows backup snapshot deletion without backup path exposure.
- Preserved existing Application use case outputs, Product Log events, command routing, and filesystem adapters.
- Added renderer tests covering in-sync compare, different compare, restore, delete, and `/secret` path redaction.
- Verification completed:
  - Focused renderer tests passed: 11 tests.
  - Related Presentation/Extension tests passed: 102 tests.
  - `npm test` passed: 332 tests, 332 passed, 0 failed.
  - `npm run build` passed: architecture check, manifest check, and build smoke all passed.
  - `npm run release:gate` passed: tests, architecture, manifest, build, docs, and smoke checklist all passed.
- Remaining risks:
  - Extension Development Host manual smoke is still required to confirm notification copy in the real VSCode notification UI.
  - File-level compare details remain intentionally out of scope; future work may add a safe detail view without exposing full paths by default.
