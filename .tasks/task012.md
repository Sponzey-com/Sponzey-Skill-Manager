# Task 012. Safe Diagnostics Remediation Command Exposure

## 1. Task Purpose

- [x] Safe diagnostic remediation action을 VSCode command로 노출한다.
- [x] Diagnostics tree item에서 실행할 action을 선택하고 기존 command handler로 위임한다.
- [x] Mutating, blocked, unsupported action은 실행하지 않는다.

## 2. Current Context

- [x] Task 009에서 diagnostic action policy가 구현되었다.
- [x] Task 010에서 Diagnostics tree item에 `diagnosticActions` payload가 추가되었다.
- [x] Task 011에서 pure router가 safe action을 기존 command id로 해석하도록 구현되었다.
- [x] 현재 UI command contribution은 아직 action router를 호출하지 않는다.

## 3. Scope

### Included

- [x] `sponzeySkills.runDiagnosticAction` command descriptor와 package contribution을 추가한다.
- [x] Diagnostics tree context menu에 Run Diagnostic Action을 노출한다.
- [x] Input collector가 지원 가능한 safe action만 QuickPick으로 선택하게 한다.
- [x] Extension command wrapper가 `resolveDiagnosticActionCommand` 결과를 기존 command handler로 위임한다.

### Excluded

- [x] Mutating action execution state machine은 구현하지 않는다.
- [x] `compare-backup` command contribution은 추가하지 않는다.
- [x] Domain/Application policy를 재계산하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] Command registry와 package manifest에 safe action entry를 추가한다.
- [x] 입력: Diagnostics tree item.
- [x] 출력: context menu command availability.
- [x] 성공 조건: package command contribution과 `SPONZEY_COMMANDS`가 일치한다.

### Functional Unit 2

- [x] Input collector가 safe supported action만 선택하게 한다.
- [x] 입력: item payload with `diagnosticActions`.
- [x] 출력: `actionCode` 포함 input.
- [x] 성공 조건: confirmation-required, blocked, unsupported action은 QuickPick 후보에서 제외된다.

### Functional Unit 3

- [x] Extension wrapper가 router 결과를 기존 command handler로 위임한다.
- [x] 입력: `actionCode`와 diagnostic item payload.
- [x] 출력: delegated command result or blocked diagnostic result.
- [x] 성공 조건: safe action은 기존 command result를 반환하고 blocked action은 실행하지 않는다.

## 5. Architecture Notes

- [x] 변경 계층은 Presentation과 Extension composition boundary다.
- [x] Domain/Application policy는 재계산하지 않는다.
- [x] Router는 Presentation pure function으로 유지한다.
- [x] Extension wrapper는 기존 command handler를 호출할 뿐 외부 I/O 정책을 구현하지 않는다.

## 6. Configuration Rules

- [x] 새 설정을 추가하지 않는다.
- [x] action visibility를 외부 파일, 환경 변수, runtime 중간 변경으로 제어하지 않는다.
- [x] input collector는 tree item payload만 읽는다.

## 7. Logging Requirements

### Product Log

- [x] 별도 Product Log event를 추가하지 않는다.
- [x] input cancellation/unavailable은 기존 input collector event 정책을 사용한다.

### Field Debug Log

- [x] 이번 태스크에서 Field Debug Log 출력 구현을 추가하지 않는다.

### Development Log

- [x] test assertion 외 개발용 로그를 추가하지 않는다.

## 8. State Machine Requirements

- [x] 이번 태스크는 safe action delegation만 수행하므로 mutation execution state machine을 추가하지 않는다.
- [x] blocked/confirmation-required action은 router 단계에서 terminal blocked result로 종료한다.

## 9. TDD Plan

- [x] 실패하는 command registry/package manifest 테스트를 먼저 작성한다.
- [x] 실패하는 input collector safe action 선택 테스트를 먼저 작성한다.
- [x] 실패하는 extension wrapper delegation 테스트를 먼저 작성한다.
- [x] 최소 구현으로 테스트를 통과시킨다.
- [x] 전체 테스트와 release gate를 실행한다.

## 10. Implementation Checklist

- [x] 실패 테스트를 작성한다.
- [x] command registry와 package manifest를 갱신한다.
- [x] input collector branch를 추가한다.
- [x] extension wrapper를 추가한다.
- [x] mutating action을 실행하지 않는지 확인한다.
- [x] 전체 검증을 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] safe action만 UI 선택 후보로 나온다.
- [x] blocked/mutating/unsupported action은 command id로 위임되지 않는다.
- [x] 설정 값을 런타임 중간에 재조회하지 않는다.
- [x] 새 로그가 추가되지 않았다.

## 12. Completion Report

- [x] 수행한 변경 사항을 요약한다.
  - `sponzeySkills.runDiagnosticAction` command를 추가하고 Diagnostics tree context menu에서 safe remediation action을 실행할 수 있게 했다.
  - Input collector는 `diagnosticActions.allowedActionCodes` 중 지원 가능하고 blocked/confirmation-required가 아닌 action만 QuickPick에 표시한다.
  - Extension composition boundary에서 router 결과를 기존 command handler로 위임하고 blocked/mutating action은 실행하지 않게 했다.
  - `open-skill-md` action은 `openKind: "skillMd"`를 전달하여 현재 VSCode 인스턴스의 editor tab에서 `SKILL.md`를 열도록 보장했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 수정: `package.json`
  - 수정: `src/extension.js`
  - 수정: `src/presentation/command-registry.js`
  - 수정: `src/presentation/command-input-collector.js`
  - 수정: `src/presentation/diagnostic-action-router.js`
  - 수정: `test/extension-activation.test.mjs`
  - 수정: `test/presentation/command-input-collector.test.mjs`
  - 수정: `test/presentation/command-registry.test.mjs`
  - 수정: `test/presentation/diagnostic-action-router.test.mjs`
  - 수정: `test/presentation/tree-view-model.test.mjs`
  - 생성: `.tasks/task012.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `node --test test/presentation/diagnostic-action-router.test.mjs test/presentation/command-input-collector.test.mjs test/presentation/command-registry.test.mjs test/presentation/tree-view-model.test.mjs test/extension-activation.test.mjs`: 90 tests passed.
  - `npm test`: 309 tests passed.
  - `npm run build`: architecture, manifest, build smoke passed.
  - `npm run release:gate`: tests, architecture, manifest, build, docs, smoke passed.
- [x] 검증한 항목을 기록한다.
  - Command registry와 package command contribution이 일치한다.
  - Diagnostics tree context menu가 `sponzeySkills.runDiagnosticAction`을 노출한다.
  - Safe action만 input collector 후보로 표시된다.
  - Blocked, confirmation-required, unsupported action은 위임되지 않는다.
  - 새 설정, 환경 재조회, 신규 로그 출력이 추가되지 않았다.
- [x] 남은 위험 요소를 기록한다.
  - Mutating remediation action 실행은 아직 의도적으로 차단되어 있으며 후속 태스크에서 confirmation/state machine 기반으로 별도 구현해야 한다.
  - `compare-backup` 등 아직 command로 연결되지 않은 allowed action은 router에서 unavailable result로 종료된다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - Task 013은 remediation action 결과 rendering 또는 mutating action confirmation/state machine 중 plan 우선순위에 따라 선택한다.

## 13. Next Task Decision Hook

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.
- [x] 도달하지 못했다면 남은 목표를 정리한다.
- [x] 다음 우선순위 태스크를 결정한다.
- [x] 다음 태스크 파일명을 결정한다.

다음 태스크는 `.tasks/task013.md`로 생성한다. 우선순위는 safe remediation 결과 UX 정리 또는 mutating remediation confirmation/state machine 구현 중 `plan.md` 순서를 기준으로 결정한다.

## 14. Stop Conditions

- [ ] `plan.md`의 최종 목표에 도달했다.
- [ ] 필수 요구사항이 불명확하여 더 이상 안전하게 진행할 수 없다.
- [ ] 외부 정보, 권한, 비밀값, 접근 권한이 없어 진행할 수 없다.
