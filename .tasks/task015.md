# Task 015. Backup Compare Command Exposure

## 1. Summary

- [x] Backup snapshot compare use case를 VSCode command와 Diagnostics remediation action에서 실행 가능하게 만든다.
- [x] Backup compare는 read-only 작업으로 유지하고 target/source mutation, restore, delete를 수행하지 않는다.
- [x] Backup item context menu와 diagnostic action router가 동일한 compare command contract를 사용하게 만든다.

## 2. Scope

### Included

- [x] `sponzeySkills.compareSkillBackup` command descriptor, package contribution, use case mapping을 추가한다.
- [x] Backup tree item context menu에 Compare Backup command를 노출한다.
- [x] Input collector가 backup payload와 explicit reference path를 보존하고, 누락된 경우 folder picker로 입력을 받는다.
- [x] Diagnostic action router가 `compare-backup` action을 compare command로 위임한다.

### Excluded

- [x] Restore backup to target command는 이 태스크에서 노출하지 않는다.
- [x] Backup delete confirmation taxonomy는 변경하지 않는다.
- [x] 새 설정, 외부 policy file, 런타임 환경 재조회는 추가하지 않는다.

## 3. Related Plan Items

- [x] `.tasks/plan.md` section 7.004.4 Backup Compare, Restore, And Lifecycle Governance.
- [x] `.tasks/plan.md` section 7.004.7 Diagnostics Remediation Workflow.
- [x] `.tasks/plan.md` section 9 Logging Strategy.
- [x] `AGENTS.md` section 3 Dependency Direction.
- [x] `AGENTS.md` section 8 TDD Policy.

## 4. Dependencies

### Previous Tasks

- [x] Task 006. Backup Comparison Summary Use Case.
- [x] Task 010. Diagnostics Action Presentation Mapping.
- [x] Task 011. Diagnostics Remediation Command Routing Contract.
- [x] Task 014. Confirmation-Gated Apply Remediation.

### Next Tasks

- [x] Backup restore command exposure with overwrite confirmation state machine.

## 5. Architecture Notes

- [x] Application use case `compareSkillBackup` already owns comparison behavior and calls `BackupComparisonPort`.
- [x] Presentation adds command registration, input collection, context menu exposure, and diagnostic routing only.
- [x] Infrastructure filesystem comparison remains behind `FileSystemBackupComparisonPort`.
- [x] Command handler receives explicit input DTO; it does not read settings or environment inside presentation routing.

## 6. Functional Requirements

- [x] Backup item context menu shows Compare Backup before Promote/Delete.
- [x] Compare command accepts `backup.backupPath` or `backupPath`.
- [x] Compare command accepts `referencePath`; if missing, it prompts user to select a reference folder.
- [x] Diagnostic `compare-backup` action delegates to `sponzeySkills.compareSkillBackup` when allowed.
- [x] Diagnostic `compare-backup` action passes diagnostic payload and any backup/reference payload through to the command.

## 7. Non-Functional Requirements

- [x] Compare command does not mutate source, target, backup, settings, or repository metadata.
- [x] Compare result uses existing Product Log event `skill.backup.compare.completed` from the Application use case.
- [x] No Product Log payload includes raw file content, skill body, secret, or stack trace.
- [x] Tests use fake window, fake command handlers, and fake comparison port instead of real VSCode or filesystem where possible.

## 8. Implementation Steps

- [x] Write failing command registry/package contribution test for `sponzeySkills.compareSkillBackup`.
- [x] Write failing input collector test for backup compare payload and reference folder selection.
- [x] Write failing router test for `compare-backup` delegation.
- [x] Write failing activation/use case wiring test proving compare command calls `compareSkillBackup`.
- [x] Implement minimal command descriptor, package contribution, use case mapping, input collector, and router changes.
- [x] Run focused tests, full test suite, build, and release gate.

## 9. TDD Checklist

- [x] Command registry contribution test fails before implementation.
- [x] Input collector compare backup test fails before implementation.
- [x] Diagnostic router compare backup test fails before implementation.
- [x] Activation test uses fake `backupComparisonPort` and verifies no mutation store call is required.
- [x] Existing backup compare Application tests remain unchanged and passing.

## 10. Validation Checklist

- [x] Domain layer does not import VSCode or filesystem APIs.
- [x] Presentation does not implement diff/hash policy.
- [x] External filesystem comparison remains in Infrastructure port.
- [x] Compare command requires explicit backup path and reference path before use case execution.
- [x] `compare-backup` is no longer reported as command unavailable when allowed and supported.

## 11. Logging Requirements

### Product Log

- [x] Use existing `skill.backup.compare.completed` and `skill.backup.compare.failed` events from Application.

### Field Debug Log

- [x] Do not add new Field Debug Log in this task.

### Development Log

- [x] Do not add new Development Log in this task.

## 12. State Machine Requirements

- [x] No new state machine is required because backup compare is read-only and already has explicit steps.
- [x] Existing compare steps `ValidatingInput`, `CheckingComparisonPort`, `ComparingBackup`, `MappingSummary`, `Completed` remain test-covered.
- [x] Restore/delete workflows stay out of scope because they require confirmation state machines.

## 13. Done Criteria

- [x] All implementation checklist items are complete.
- [x] Focused command registry/input collector/router/activation tests pass.
- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] `npm run release:gate` passes.
- [x] Remaining restore/delete risks and follow-up task are recorded.

## 14. Completion Report

- [x] 변경 사항:
  - `sponzeySkills.compareSkillBackup` command descriptor와 package contribution을 추가했다.
  - Backup snapshot context menu에 Compare Backup을 Promote/Delete 앞에 노출했다.
  - Command registry가 compare command를 기존 Application use case `compareSkillBackup`으로 위임하도록 연결했다.
  - Input collector가 backup path와 reference path를 명시 입력으로 수집하고 기존 backup payload를 보존하도록 추가했다.
  - Diagnostics remediation action `compare-backup`을 compare command로 라우팅했다.
  - `compare-backup`은 read-only action으로 유지했고 confirmation-required mutation 흐름에 넣지 않았다.
- [x] 수정한 파일:
  - `package.json`
  - `src/presentation/command-registry.js`
  - `src/presentation/command-input-collector.js`
  - `src/presentation/diagnostic-action-router.js`
  - `test/presentation/command-registry.test.mjs`
  - `test/presentation/command-input-collector.test.mjs`
  - `test/presentation/diagnostic-action-router.test.mjs`
  - `test/presentation/tree-view-model.test.mjs`
  - `test/extension-activation.test.mjs`
  - `.tasks/task015.md`
- [x] 실행한 검증:
  - `node --test test/presentation/command-registry.test.mjs test/presentation/diagnostic-action-router.test.mjs test/presentation/command-input-collector.test.mjs test/extension-activation.test.mjs`: 91 tests passed.
  - `node --test test/presentation/tree-view-model.test.mjs test/presentation/tree-data-provider.test.mjs test/presentation/command-result-renderer.test.mjs test/presentation/command-registry.test.mjs test/presentation/diagnostic-action-router.test.mjs test/presentation/command-input-collector.test.mjs test/extension-activation.test.mjs`: 120 tests passed.
  - `npm test`: 324 tests passed.
  - `npm run build`: architecture, manifest, build smoke passed.
  - `npm run release:gate`: tests, architecture, manifest, build, docs, smoke passed.
- [x] 남은 위험:
  - Restore backup은 target write가 있는 mutation이므로 별도 overwrite confirmation state machine과 audit 검증 후 노출해야 한다.
  - Delete backup은 기존 confirmation이 있지만 Diagnostics remediation으로 연결하려면 delete-specific action code와 Product Log/refresh 검증을 추가해야 한다.
  - Compare result는 현재 Product Log와 generic result rendering만 사용한다. 상세 diff UI는 후속 태스크에서 별도 read model 또는 detail rendering으로 다룬다.
- [x] 후속 태스크:
  - `.tasks/task016.md`에서 restore backup command exposure와 overwrite confirmation state machine을 분리해서 진행한다.
