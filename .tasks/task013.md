# Task 013. Diagnostics Remediation Result Logging And Refresh

## 1. Summary

- [x] Diagnostics remediation command 결과를 Product Log로 분류한다.
- [x] 안전 remediation action이 기존 refresh wrapper를 우회하지 않도록 검증한다.
- [x] 차단된 remediation action은 delegated command를 실행하지 않고 terminal blocked result와 Product Log event를 반환한다.

## 2. Scope

### Included

- [x] `sponzeySkills.runDiagnosticAction` 결과에 `remediation.action.completed`, `remediation.action.failed`, `remediation.action.blocked` Product Log event를 추가한다.
- [x] `analyze-again` action이 기존 `analyzeAllSkills` handler로 위임되어 Diagnostics tree refresh를 발생시키는지 검증한다.
- [x] Product Log payload가 raw path, skill body, stack trace를 포함하지 않는지 검증한다.

### Excluded

- [x] Mutating remediation confirmation state machine은 구현하지 않는다.
- [x] Backup compare/restore remediation command는 새로 연결하지 않는다.
- [x] 외부 설정이나 사용자 설정 항목을 추가하지 않는다.

## 3. Related Plan Items

- [x] `.tasks/plan.md` section 7.0 Phase Dependency Map.
- [x] `.tasks/plan.md` section 7.004.7 Diagnostics Remediation Workflow.
- [x] `.tasks/plan.md` section 9 Logging Strategy.
- [x] `AGENTS.md` section 6 Logging Policy.
- [x] `AGENTS.md` section 7 State Machine Policy.

## 4. Dependencies

### Previous Tasks

- [x] Task 009. Analyzer Remediation Suggestion Contract.
- [x] Task 010. Diagnostics Action Presentation Mapping.
- [x] Task 011. Diagnostics Remediation Command Routing Contract.
- [x] Task 012. Safe Diagnostics Remediation Command Exposure.

### Next Tasks

- [x] Task 014. Mutating Diagnostics Remediation Confirmation State Machine 또는 release smoke hardening.

## 5. Architecture Notes

- [x] 변경 계층은 Extension composition boundary와 activation test다.
- [x] Domain/Application policy는 변경하지 않는다.
- [x] Remediation action routing은 Presentation pure router 결과를 사용한다.
- [x] Refresh는 기존 delegated command wrapper가 수행하며 별도 중복 refresh 구현을 추가하지 않는다.
- [x] Product Log event는 Application log router가 처리할 수 있도록 result `events`에 포함한다.

## 6. Functional Requirements

- [x] Safe remediation action 성공 시 result에 `remediation.action.completed` Product Log event를 추가한다.
- [x] Safe remediation action 실패 시 result에 `remediation.action.failed` Product Log event를 추가한다.
- [x] Blocked/confirmation-required/unsupported action은 result에 `remediation.action.blocked` Product Log event를 추가한다.
- [x] `analyze-again` action은 Diagnostics tree provider cache를 갱신한다.

## 7. Non-Functional Requirements

- [x] 새 설정을 추가하지 않는다.
- [x] 로그 payload는 action code, delegated command id, diagnostic code, source id/name 같은 안전한 식별자만 포함한다.
- [x] 로그 payload는 raw path, skill body, secret, stack trace를 포함하지 않는다.
- [x] 외부 I/O는 기존 delegated command handler와 adapter 뒤에서만 수행한다.

## 8. Implementation Steps

- [x] 실패하는 activation test를 먼저 작성한다.
- [x] `runDiagnosticAction` wrapper가 routing failure에 blocked Product Log event를 붙이도록 최소 구현한다.
- [x] Delegated result에 completed/failed Product Log event를 병합한다.
- [x] `analyze-again` action이 tree refresh를 유지하는지 focused test로 검증한다.
- [x] 전체 테스트, build, release gate를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 Product Log event test를 작성한다.
- [x] 실패하는 blocked remediation Product Log test를 작성한다.
- [x] 실패하는 delegated refresh test를 작성한다.
- [x] 외부 dependency는 fake adapter와 fake VSCode API로 대체한다.
- [x] 설정 값 재조회가 추가되지 않았는지 기존 runtime context test를 통과시킨다.

## 10. Validation Checklist

- [x] Safe remediation completed event가 Product Log로 routed 된다.
- [x] Blocked remediation blocked event가 Product Log로 routed 된다.
- [x] `analyze-again` remediation action 후 Diagnostics view가 갱신된다.
- [x] 로그 payload에 `/repo`, `SKILL.md` body, secret, stack trace가 포함되지 않는다.
- [x] 새 설정과 새 환경 조회가 없다.
- [x] Mutating action은 confirmation 없이 실행되지 않는다.

## 11. Logging Requirements

### Product Log

- [x] `remediation.action.completed`: actionCode, commandId, diagnosticCode, sourceId, sourceName.
- [x] `remediation.action.failed`: actionCode, commandId, diagnosticCode, sourceId, sourceName, reason.
- [x] `remediation.action.blocked`: actionCode, diagnosticCode, sourceId, sourceName, reason.

### Field Debug Log

- [x] 이번 태스크에서는 Field Debug Log를 추가하지 않는다.

### Development Log

- [x] 이번 태스크에서는 Development Log를 추가하지 않는다.

## 12. State Machine Requirements

- [x] 이번 태스크는 safe delegation result logging만 추가하므로 새 상태머신을 만들지 않는다.
- [x] Blocked routing result는 terminal blocked state로 취급하고 Product Log event를 반환한다.
- [x] Mutating remediation state machine은 후속 태스크로 남긴다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] Focused remediation activation tests가 통과한다.
- [x] `npm test`가 통과한다.
- [x] `npm run build`가 통과한다.
- [x] `npm run release:gate`가 통과한다.
- [x] 남은 위험과 후속 태스크가 기록되었다.

## 14. Completion Report

- [x] 변경 사항:
  - `runDiagnosticAction` wrapper가 safe action result에 `remediation.action.completed` 또는 `remediation.action.failed` Product Log event를 병합한다.
  - routing 단계에서 blocked/confirmation-required/unsupported result에 `remediation.action.blocked` Product Log event를 병합한다.
  - Product Log payload는 raw path가 아닌 action code, delegated command id, diagnostic code, source id/name, reason만 포함한다.
  - `analyze-again` remediation action이 기존 `analyzeAllSkills` wrapper를 통과해 Diagnostics tree를 refresh하는지 검증했다.
- [x] 수정한 파일:
  - `src/extension.js`
  - `test/extension-activation.test.mjs`
  - `.tasks/task013.md`
- [x] 실행한 검증:
  - `node --test test/extension-activation.test.mjs`: 30 tests passed.
  - `node --test test/presentation/diagnostic-action-router.test.mjs test/presentation/command-input-collector.test.mjs test/presentation/command-registry.test.mjs test/presentation/tree-view-model.test.mjs test/presentation/tree-data-provider.test.mjs test/extension-activation.test.mjs`: 101 tests passed.
  - `npm test`: 313 tests passed.
  - `npm run build`: architecture, manifest, build smoke passed.
  - `npm run release:gate`: tests, architecture, manifest, build, docs, smoke passed.
- [x] 남은 위험:
  - Mutating remediation action은 아직 confirmation/state machine 없이 실행하지 않는다.
  - Backup compare/restore action은 safe command로 연결되어 있지 않으며 후속 태스크에서 별도 command routing과 confirmation을 다룬다.
- [x] 후속 태스크:
  - `.tasks/task014.md`에서 mutating diagnostics remediation confirmation state machine 또는 release smoke hardening 중 plan 우선순위에 맞는 항목을 진행한다.
