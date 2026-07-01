# Task 014. Confirmation-Gated Apply Remediation

## 1. Summary

- [x] `apply-skill-to-target` diagnostic remediation action을 명시 확인 후에만 기존 apply command로 위임한다.
- [x] Confirmation-required remediation workflow를 명시적 상태 전이로 모델링한다.
- [x] Critical/blocked remediation action은 confirmation이 있어도 실행하지 않는다.

## 2. Scope

### Included

- [x] Application 계층에 순수 remediation action state machine을 추가한다.
- [x] Presentation router가 state machine 결과를 사용해 confirmation-required action을 차단 또는 위임한다.
- [x] Input collector가 confirmation-required supported action을 QuickPick에 표시하고 선택 후 확인을 요구한다.
- [x] `apply-skill-to-target`은 확인 후 `applySkillToGlobalTarget` 또는 명시된 project scope command로 위임한다.

### Excluded

- [x] Critical risk blocked action을 우회하지 않는다.
- [x] Backup restore, remove applied skill, delete source 같은 추가 mutating remediation action은 연결하지 않는다.
- [x] 새 설정, 외부 policy file, 환경 변수 조회를 추가하지 않는다.

## 3. Related Plan Items

- [x] `.tasks/plan.md` section 7.004.7 Diagnostics Remediation Workflow.
- [x] `.tasks/plan.md` section 10 State Machine Strategy.
- [x] `.tasks/plan.md` section 16 Prohibited Implementation Patterns.
- [x] `AGENTS.md` section 7 State Machine Policy.
- [x] `AGENTS.md` section 8 TDD Policy.

## 4. Dependencies

### Previous Tasks

- [x] Task 009. Analyzer Remediation Suggestion Contract.
- [x] Task 011. Diagnostics Remediation Command Routing Contract.
- [x] Task 012. Safe Diagnostics Remediation Command Exposure.
- [x] Task 013. Diagnostics Remediation Result Logging And Refresh.

### Next Tasks

- [x] Task 015. Backup/compare remediation command exposure 또는 release smoke hardening.

## 5. Architecture Notes

- [x] State machine은 Application 계층의 순수 함수로 둔다.
- [x] Router는 state machine 결과를 사용하지만 policy를 중복 구현하지 않는다.
- [x] Existing apply use case의 risk confirmation을 우회하지 않고 `confirmationProvided: true`를 명시 전달한다.
- [x] External I/O는 기존 apply command handler, analyzer, target store adapter 뒤에서만 발생한다.

## 6. Functional Requirements

- [x] Confirmation-required action은 `confirmationProvided !== true`이면 `diagnostic-action-confirmation-required`로 종료한다.
- [x] Confirmation-required action은 `confirmationProvided === true`이면 command delegation 가능 상태가 된다.
- [x] Blocked action은 confirmation 여부와 관계없이 `diagnostic-action-blocked`로 종료한다.
- [x] `apply-skill-to-target`은 global scope 기본값으로 `sponzeySkills.applySkillToGlobalTarget`에 위임한다.
- [x] `targetScope: "project"` 또는 project target payload가 있으면 `sponzeySkills.applySkillToProjectTarget`에 위임한다.

## 7. Non-Functional Requirements

- [x] 새 설정을 추가하지 않는다.
- [x] Runtime 중간 환경 값을 읽거나 변경하지 않는다.
- [x] Product Log payload에 raw path, skill body, secret, stack trace를 포함하지 않는다.
- [x] Confirmation prompt는 input collector에서만 수행하고 router는 입력 DTO만 평가한다.

## 8. Implementation Steps

- [x] 실패하는 state machine unit test를 먼저 작성한다.
- [x] 실패하는 router confirmation delegation test를 작성한다.
- [x] 실패하는 input collector confirmation prompt test를 작성한다.
- [x] 실패하는 activation delegation test를 작성한다.
- [x] 최소 구현으로 테스트를 통과시킨다.
- [x] 전체 테스트, build, release gate를 실행한다.

## 9. TDD Checklist

- [x] State machine transition tests.
- [x] Router tests for confirmed and unconfirmed action.
- [x] Input collector tests for confirmation-required action.
- [x] Activation test with fake analyzer and fake target store.
- [x] Regression test that blocked action still cannot delegate.

## 10. Validation Checklist

- [x] Confirmation 없는 mutating action은 실행되지 않는다.
- [x] Confirmation 있는 high-risk apply remediation은 기존 apply command로 위임된다.
- [x] Critical/blocked action은 confirmation이 있어도 실행되지 않는다.
- [x] Apply result refresh와 remediation Product Log가 기존 wrapper를 통해 유지된다.
- [x] Architecture guard가 통과한다.

## 11. Logging Requirements

### Product Log

- [x] 기존 `remediation.action.completed`, `remediation.action.failed`, `remediation.action.blocked` event를 사용한다.

### Field Debug Log

- [x] 새 Field Debug Log를 추가하지 않는다.

### Development Log

- [x] 새 Development Log를 추가하지 않는다.

## 12. State Machine Requirements

- [x] States: `ValidatingAction`, `CheckingBlockedPolicy`, `CheckingAllowedPolicy`, `CheckingConfirmation`, `ReadyToDelegate`, `Blocked`, `Rejected`.
- [x] Events: action requested, blocked action detected, action not allowed, confirmation missing, confirmation accepted, unsupported action.
- [x] Failure states: `Blocked`, `Rejected`.
- [x] Terminal state: `ReadyToDelegate`.
- [x] Transition tests must cover blocked, not allowed, missing confirmation, accepted confirmation, unsupported action.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] Focused state machine/router/input/activation tests가 통과한다.
- [x] `npm test`가 통과한다.
- [x] `npm run build`가 통과한다.
- [x] `npm run release:gate`가 통과한다.
- [x] 남은 위험과 후속 태스크가 기록되었다.

## 14. Completion Report

- [x] 변경 사항:
  - Application 계층에 `evaluateDiagnosticRemediationActionTransition` 순수 상태머신을 추가했다.
  - Diagnostic action router가 confirmation, blocked, allowed, supported action 판단을 상태머신 결과로 처리하도록 변경했다.
  - `apply-skill-to-target` action은 confirmation 후 global 또는 project apply command로 위임된다.
  - Input collector가 confirmation-required action을 선택지에 표시하고 실행 전 명시 확인을 받도록 변경했다.
  - Extension activation wrapper가 확인된 remediation input을 기존 command handler와 Product Log wrapper 흐름으로 전달하도록 검증했다.
- [x] 수정한 파일:
  - `src/application/diagnostics/remediation-action-state-machine.js`
  - `src/application/index.js`
  - `src/presentation/diagnostic-action-router.js`
  - `src/presentation/command-input-collector.js`
  - `src/extension.js`
  - `test/application/remediation-action-state-machine.test.mjs`
  - `test/presentation/diagnostic-action-router.test.mjs`
  - `test/presentation/command-input-collector.test.mjs`
  - `test/extension-activation.test.mjs`
  - `.tasks/task014.md`
- [x] 실행한 검증:
  - `node --test test/application/remediation-action-state-machine.test.mjs test/presentation/diagnostic-action-router.test.mjs test/presentation/command-input-collector.test.mjs test/extension-activation.test.mjs`: 85 tests passed.
  - `npm test`: 320 tests passed.
  - `npm run build`: architecture, manifest, build smoke passed.
  - `npm run release:gate`: tests, architecture, manifest, build, docs, smoke passed.
- [x] 남은 위험:
  - Backup compare/restore remediation action은 아직 diagnostic action router에 노출하지 않았다.
  - Remove applied, delete source 같은 destructive remediation은 별도 confirmation taxonomy와 상태머신 확장이 필요하다.
  - Extension Development Host에서 실제 QuickPick confirmation과 apply target 선택 UX는 수동 smoke로 추가 확인해야 한다.
- [x] 후속 태스크:
  - `.tasks/task015.md`에서 backup/compare remediation command exposure 또는 Phase 004 release smoke hardening 중 plan 우선순위에 맞는 항목을 진행한다.
