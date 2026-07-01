# Task 016. Backup Restore Command Exposure

## 1. Summary

- [x] Backup snapshot restore use case를 VSCode command와 Diagnostics remediation action에서 실행 가능하게 만든다.
- [x] Restore는 target write가 있는 mutation이므로 target 선택과 overwrite confirmation을 명시적으로 요구한다.
- [x] Restore command는 기존 `restoreBackupToTarget` Application use case와 target/audit ports를 우회하지 않는다.

## 2. Scope

### Included

- [x] `sponzeySkills.restoreBackupToTarget` command descriptor, package contribution, use case mapping을 추가한다.
- [x] Backup tree item context menu에 Restore Backup command를 노출한다.
- [x] Input collector가 backup payload, target, overwrite confirmation을 명시적으로 수집한다.
- [x] Diagnostic action router가 confirmation-protected `restore-backup` action을 restore command로 위임한다.
- [x] Restore command 실행 후 기존 mutation refresh wrapper가 tree read model을 갱신한다.

### Excluded

- [x] Backup delete remediation은 이 태스크에서 연결하지 않는다.
- [x] Custom diff UI 또는 restore preview webview를 만들지 않는다.
- [x] 새 설정, 외부 policy file, 환경 변수 조회를 추가하지 않는다.

## 3. Related Plan Items

- [x] `.tasks/plan.md` section 7.004.4 Backup Compare, Restore, And Lifecycle Governance.
- [x] `.tasks/plan.md` section 7.004.7 Diagnostics Remediation Workflow.
- [x] `.tasks/plan.md` section 10 State Machine Strategy.
- [x] `AGENTS.md` section 7 State Machine Policy.
- [x] `AGENTS.md` section 8 TDD Policy.

## 4. Dependencies

### Previous Tasks

- [x] Task 006. Backup Comparison Summary Use Case.
- [x] Task 007. Backup Restore Lifecycle Use Case.
- [x] Task 014. Confirmation-Gated Apply Remediation.
- [x] Task 015. Backup Compare Command Exposure.

### Next Tasks

- [x] Backup restore result detail rendering or delete backup diagnostics remediation.

## 5. Architecture Notes

- [x] Application use case `restoreBackupToTarget` owns restore validation, target write, audit write, Product Log event, and explicit steps.
- [x] Presentation only collects input and routes command/action DTOs.
- [x] Infrastructure target filesystem writes remain in `FileSystemTargetStore`.
- [x] Audit writes remain behind the audit store port.
- [x] Restore action does not mutate Main Repository source or backup snapshot.

## 6. Functional Requirements

- [x] Backup context menu shows Restore Backup after Compare Backup and before Promote/Delete.
- [x] Restore command accepts `backup.backupPath` or `backupPath`.
- [x] Restore command selects a Global or Project target from current read model when target is missing.
- [x] Restore command requires overwrite confirmation before delegating to use case.
- [x] Diagnostic `restore-backup` action requires confirmation before command delegation.
- [x] Diagnostic `restore-backup` action passes backup, target, diagnostic payload through without setting overwrite confirmation.

## 7. Non-Functional Requirements

- [x] No restore path reads settings or environment during command execution.
- [x] Tests use fake target store and fake audit store instead of real filesystem writes.
- [x] Restore Product Log event does not include raw backup path, target path, skill body, secret, or stack trace.
- [x] Restore is included in mutation refresh flow because it changes target state.

## 8. Implementation Steps

- [x] Write failing command registry/use case mapping test for `sponzeySkills.restoreBackupToTarget`.
- [x] Write failing input collector test for target selection and overwrite confirmation.
- [x] Write failing diagnostic router test for confirmed and unconfirmed `restore-backup`.
- [x] Write failing activation test with fake target store and audit store.
- [x] Implement minimal command descriptor, package contribution, collector, router, mutation refresh, and audit operation mapping.
- [x] Run focused tests, full test suite, build, and release gate.

## 9. TDD Checklist

- [x] Command registry restore mapping test fails before implementation.
- [x] Input collector restore confirmation test fails before implementation.
- [x] Diagnostic router restore confirmation test fails before implementation.
- [x] Activation test verifies target store restore input and audit record.
- [x] Existing restore Application tests remain unchanged and passing.

## 10. Validation Checklist

- [x] Domain layer does not import VSCode, filesystem, or logger APIs.
- [x] Presentation does not implement restore policy or filesystem writes.
- [x] Restore command cannot run from diagnostic action without remediation confirmation.
- [x] Restore command cannot delegate without overwrite confirmation from collector or explicit DTO.
- [x] Restore command appears in package command contribution and backup context menu.

## 11. Logging Requirements

### Product Log

- [x] Use existing `skill.backup.restore.completed`, `.blocked`, and `.failed` events from Application.
- [x] Use existing `remediation.action.completed`, `.blocked`, and `.failed` events for diagnostic action wrapper.

### Field Debug Log

- [x] Do not add new Field Debug Log in this task.

### Development Log

- [x] Do not add new Development Log in this task.

## 12. State Machine Requirements

- [x] Restore use case keeps explicit steps: `ValidatingInput`, `CheckingPorts`, `CheckingConflict`, `WritingTarget`, `WritingAudit`, `Completed`.
- [x] Diagnostic route uses the existing remediation action state machine.
- [x] Input collector confirmation is separate from diagnostic remediation confirmation.
- [x] Restore/delete workflows stay separate; delete remains out of scope.

## 13. Done Criteria

- [x] All implementation checklist items are complete.
- [x] Focused command registry/input collector/router/activation tests pass.
- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] `npm run release:gate` passes.
- [x] Remaining restore UI/detail or delete remediation risks are recorded.

## 14. Completion Report

- Implemented `sponzeySkills.restoreBackupToTarget` as a contributed VSCode command with command registry mapping to the existing `restoreBackupToTarget` Application use case.
- Added Backup tree context menu exposure with `$(debug-restart)` icon between Compare Backup and Promote/Delete Backup lifecycle actions.
- Added Presentation input collection for backup selection, target selection, restored skill name fallback, and explicit overwrite confirmation without reading settings or environment during command execution.
- Added Diagnostics remediation routing for `restore-backup` through the existing remediation action state machine, with confirmation required before command delegation.
- Added restore to mutation refresh handling and audit operation mapping so target mutations refresh tree read models after execution.
- Preserved Clean Architecture boundaries: restore validation, target write, audit write, Product Log event, and lifecycle steps remain in Application; Presentation only collects DTOs and delegates; filesystem writes remain behind target store ports.
- Verification completed:
  - Focused command registry, input collector, diagnostic router, and activation tests passed: 95 tests.
  - Related Presentation and Extension activation tests passed: 124 tests.
  - `npm test` passed: 328 tests, 328 passed, 0 failed.
  - `npm run build` passed: architecture check, manifest check, and build smoke all passed.
  - `npm run release:gate` passed: tests, architecture, manifest, build, docs, and smoke checklist all passed.
- Remaining risks:
  - Backup restore result detail rendering is still basic and should be refined in a later UI/detail task.
  - Backup delete remediation remains intentionally unconnected and must be handled as a separate confirmation-protected lifecycle task.
  - Extension Development Host manual smoke is still required to verify real VSCode context menu ordering and refresh behavior.
