# Task 017. Backup Delete Diagnostics Remediation Exposure

## 1. Summary

- [x] `delete-backup` diagnostic remediation action을 명시 확인 후 기존 `sponzeySkills.deleteBackup` command로 위임한다.
- [x] Backup delete는 backup snapshot만 삭제하며 source skill, promoted source, target entry를 변경하지 않는 기존 Application use case를 우회하지 않는다.
- [x] Diagnostics action confirmation과 delete backup command confirmation을 모두 유지하여 remediation action이 destructive command를 직접 실행하지 못하게 한다.

## 2. Scope

### Included

- [x] Diagnostic action router가 `delete-backup`을 지원 action으로 인식한다.
- [x] `delete-backup`은 confirmation-required action일 때 confirmation 없이는 command로 위임되지 않는다.
- [x] Confirmation이 제공되면 router는 `sponzeySkills.deleteBackup`과 backup payload를 반환한다.
- [x] Input collector가 `delete-backup`을 supported diagnostic action QuickPick 후보에 표시한다.
- [x] Input collector의 diagnostic confirmation prompt는 apply 전용 문구가 아니라 action별 목적을 표시한다.
- [x] Extension activation test가 diagnostic action wrapper를 통해 delete backup command로 위임되는지 검증한다.

### Excluded

- [x] `deleteBackup` Application use case policy를 변경하지 않는다.
- [x] `FileSystemSkillRepository.deleteBackup` 구현을 변경하지 않는다.
- [x] Backup retention 설정, 외부 policy file, 환경 변수 조회를 추가하지 않는다.
- [x] Backup restore, promote, compare behavior를 변경하지 않는다.

## 3. Related Plan Items

- [x] `.tasks/plan.md` section 7.004.4 Backup Compare, Restore, And Lifecycle Governance.
- [x] `.tasks/plan.md` section 7.004.7 Diagnostics Remediation Workflow.
- [x] `.tasks/plan.md` section 10 Logging Strategy.
- [x] `.tasks/plan.md` section 11 State Machine Strategy.
- [x] `AGENTS.md` section 7 State Machine Policy.
- [x] `AGENTS.md` section 8 TDD Policy.

## 4. Dependencies

### Previous Tasks

- [x] Task 012. Safe Diagnostics Remediation Command Exposure.
- [x] Task 013. Diagnostics Remediation Result Logging And Refresh.
- [x] Task 014. Confirmation-Gated Apply Remediation.
- [x] Task 015. Backup Compare Command Exposure.
- [x] Task 016. Backup Restore Command Exposure.

### Next Tasks

- [x] Backup restore/delete result detail rendering or Extension Host smoke evidence hardening.

## 5. Architecture Notes

- [x] Presentation router maps an already allowed and confirmed diagnostic action to an existing command; it does not delete files.
- [x] Application `deleteBackup` use case remains responsible for confirmation taxonomy, repository port invocation, and Product Log events.
- [x] Infrastructure remains the only layer that deletes backup filesystem entries.
- [x] Extension wrapper keeps existing remediation Product Log event merge and mutation refresh behavior.
- [x] Domain and Application policies are not duplicated in command handlers.

## 6. Functional Requirements

- [x] `delete-backup` appears as a selectable diagnostic action when the diagnostic payload allows it.
- [x] `delete-backup` does not appear when blocked by diagnostic policy.
- [x] `delete-backup` cannot route without remediation confirmation.
- [x] Confirmed `delete-backup` routes to `sponzeySkills.deleteBackup`.
- [x] Router passes `backup` and `diagnostic` payloads through to the command input.
- [x] Delete backup command input collection still requires delete confirmation before the use case executes if explicit DTO confirmation is missing.

## 7. Non-Functional Requirements

- [x] No new setting is added.
- [x] No runtime environment value is read during diagnostic action routing.
- [x] No raw backup path, skill body, secret, or stack trace is added to Product Log payloads.
- [x] Tests use fake command handlers and fake VSCode windows instead of deleting real backup directories.

## 8. Implementation Steps

- [x] Write failing diagnostic router tests for unconfirmed and confirmed `delete-backup`.
- [x] Write failing input collector tests for `delete-backup` action selection and action-specific confirmation text.
- [x] Write failing extension activation test for diagnostic delete backup delegation.
- [x] Implement minimal router support, supported action choice, and confirmation label mapping.
- [x] Run focused tests, full test suite, build, and release gate.

## 9. TDD Checklist

- [x] Router test fails before `delete-backup` is added to supported action codes.
- [x] Input collector test fails before `delete-backup` is added to supported diagnostic action choices.
- [x] Activation test fails before router delegates to `sponzeySkills.deleteBackup`.
- [x] External dependencies are replaced by fake command handlers and fake windows.
- [x] Existing `deleteBackup` Application tests remain unchanged and passing.

## 10. Validation Checklist

- [x] Domain layer does not import VSCode, filesystem, process, or logger APIs.
- [x] Presentation does not implement backup deletion policy or filesystem deletion.
- [x] Confirmation missing returns `diagnostic-action-confirmation-required`.
- [x] Confirmed action delegates to the existing delete backup command.
- [x] Existing command input collector still prompts delete confirmation for direct delete backup command execution.
- [x] Mutation refresh and Product Log event handling remain in the existing extension wrapper.

## 11. Logging Requirements

### Product Log

- [x] Use existing `remediation.action.completed`, `.blocked`, and `.failed` events for diagnostic action wrapper.
- [x] Use existing `skill.backup.delete.*` or current deleteBackup use case events from Application; do not add duplicate Product Log events in Presentation.

### Field Debug Log

- [x] Do not add new Field Debug Log in this task.

### Development Log

- [x] Do not add new Development Log in this task.

## 12. State Machine Requirements

- [x] Diagnostic route uses existing remediation action state machine.
- [x] `delete-backup` remains a confirmation-required action controlled by diagnostic payload.
- [x] Delete backup command confirmation remains separate from diagnostic remediation confirmation.
- [x] No new filesystem side effect can occur before both routing and command input confirmation have succeeded.

## 13. Done Criteria

- [x] All implementation checklist items are complete.
- [x] Focused router/input collector/activation tests pass.
- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] `npm run release:gate` passes.
- [x] Remaining UX or manual smoke risks are recorded.

## 14. Completion Report

- Implemented `delete-backup` Diagnostics remediation routing in Presentation without changing the `deleteBackup` Application use case or filesystem adapter.
- Added `delete-backup` to supported diagnostic action choices with action-specific confirmation text: `Confirm Delete Backup`.
- Added router support so unconfirmed delete backup diagnostics return `diagnostic-action-confirmation-required`, while confirmed diagnostics delegate to `sponzeySkills.deleteBackup` with backup and diagnostic payloads.
- Preserved the second delete confirmation at the command input collector boundary; diagnostic remediation confirmation and delete command confirmation remain separate.
- Added activation coverage that proves the diagnostic action wrapper delegates through the existing delete backup command handler, uses fake repository ports, and records `remediation.action.completed`.
- Verification completed:
  - Focused router/input collector/activation tests passed: 91 tests.
  - `npm test` passed: 331 tests, 331 passed, 0 failed.
  - `npm run build` passed: architecture check, manifest check, and build smoke all passed.
  - `npm run release:gate` passed: tests, architecture, manifest, build, docs, and smoke checklist all passed.
- Remaining risks:
  - Extension Development Host manual smoke is still required to verify actual QuickPick wording and Diagnostics context menu discoverability.
  - Backup restore/delete result notifications are still generic and may need a later UX detail-rendering pass.
