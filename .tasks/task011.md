# Task 011. Diagnostics Remediation Command Routing Contract

## 1. Task Purpose

- [x] Diagnostic action code를 기존 Presentation command로 안전하게 해석하는 routing contract를 정의한다.
- [x] safe read-only/configuration action만 command id로 변환한다.
- [x] mutating action, blocked action, unsupported action은 실행하지 않고 machine-readable blocked result로 반환한다.

## 2. Current Context

- [x] Task 009에서 Domain/Application diagnostic action contract가 구현되었다.
- [x] Task 010에서 Diagnostics tree item에 `diagnosticActions` presentation payload가 추가되었다.
- [x] 현재 action code를 기존 VSCode command로 매핑하는 Presentation 계약은 없다.

## 3. Scope

### Included

- [x] Pure Presentation router를 추가한다.
- [x] `open-skill-md`, `analyze-again`, `set-main-repository`를 기존 command id로 매핑한다.
- [x] `apply-skill-to-target`처럼 mutating action은 confirmation execution workflow 전까지 block한다.
- [x] `compare-backup`처럼 아직 command가 없는 action은 unsupported로 block한다.

### Excluded

- [x] 새 VSCode command contribution을 추가하지 않는다.
- [x] 실제 command execution handler를 등록하지 않는다.
- [x] target write/delete mutation을 실행하지 않는다.
- [x] confirmation state machine은 이번 태스크에서 구현하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] Diagnostic action router가 allowed safe action을 command request로 변환한다.
- [x] 입력: tree item payload `{ diagnostic, source, diagnosticActions }`와 `actionCode`.
- [x] 출력: `{ ok: true, commandId, input }`.
- [x] 성공 조건: `open-skill-md`, `analyze-again`, `set-main-repository`가 deterministic command id를 반환한다.

### Functional Unit 2

- [x] Router가 blocked 또는 not allowed action을 차단한다.
- [x] 입력: blocked action code 또는 `allowedActionCodes`에 없는 action code.
- [x] 출력: `{ ok: false, code, diagnostics }`.
- [x] 성공 조건: blocked reason과 action code가 포함된다.

### Functional Unit 3

- [x] Router가 mutating/unsupported action을 실행 전 차단한다.
- [x] 입력: confirmation-required mutating allowed action 또는 command mapping이 없는 action.
- [x] 출력: confirmation-required 또는 unsupported diagnostic.
- [x] 성공 조건: command id가 반환되지 않고 side effect가 발생하지 않는다.

## 5. Architecture Notes

- [x] 변경 계층은 Presentation이다.
- [x] Router는 Domain policy를 재계산하지 않고 tree item payload만 읽는다.
- [x] Router는 VSCode API, filesystem, environment에 의존하지 않는다.
- [x] Application use case를 직접 호출하지 않는다.

## 6. Configuration Rules

- [x] 새 설정을 추가하지 않는다.
- [x] action routing table은 외부 파일이나 환경 변수에서 읽지 않는다.
- [x] runtime 중간 설정 변경을 사용하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] 이번 태스크에서 새 Product Log event를 추가하지 않는다.

### Field Debug Log

- [x] routing detail은 후속 execution workflow의 Field Debug Log 후보로 둔다.

### Development Log

- [x] test assertion 외 개발용 로그를 추가하지 않는다.

## 8. State Machine Requirements

- [x] 이번 태스크는 pure routing contract만 정의하므로 execution state machine을 추가하지 않는다.
- [x] mutating action execution은 후속 태스크에서 `ResolvingAllowedAction`, `CheckingRisk`, `RequiringConfirmation`, `ExecutingUseCase`, `Completed`, `Blocked`, `Failed` 상태로 구현해야 한다.

## 9. TDD Plan

- [x] 실패하는 safe action routing 테스트를 먼저 작성한다.
- [x] 실패하는 blocked action routing 테스트를 먼저 작성한다.
- [x] 실패하는 mutating/unsupported action block 테스트를 먼저 작성한다.
- [x] 최소 router 구현으로 테스트를 통과시킨다.
- [x] 전체 테스트와 release gate를 실행한다.

## 10. Implementation Checklist

- [x] 실패 테스트를 작성한다.
- [x] pure router 함수를 구현한다.
- [x] command registry 또는 package manifest를 변경하지 않는다.
- [x] mutating action을 command id로 반환하지 않는다.
- [x] 외부 설정, 로그, I/O를 추가하지 않는다.
- [x] 모든 관련 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] Presentation이 Domain policy를 재구현하지 않는다.
- [x] blocked action은 실행 가능한 command id를 반환하지 않는다.
- [x] unsupported action은 machine-readable diagnostic을 반환한다.
- [x] 설정 값이 런타임 중간에 재조회되지 않는다.
- [x] 로그 정책을 침범하지 않는다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.
  - Presentation 계층에 `resolveDiagnosticActionCommand` pure router를 추가했다.
  - `open-skill-md`, `analyze-again`, `set-main-repository` action을 기존 command id로 변환한다.
  - blocked action, not allowed action, source missing action, confirmation-required mutating action, unsupported action은 command id 없이 machine-readable diagnostic으로 반환한다.
  - `compare-backup`은 아직 등록된 command가 없으므로 unsupported로 차단한다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - `.tasks/task011.md`
  - `src/presentation/diagnostic-action-router.js`
  - `src/presentation/index.js`
  - `test/presentation/diagnostic-action-router.test.mjs`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `node --test test/presentation/diagnostic-action-router.test.mjs` 통과: 4 tests, 4 pass
  - `npm test` 통과: 304 tests, 304 pass
  - `npm run build` 통과: architecture ok, manifest ok, build smoke ok
  - `npm run release:gate` 통과: tests, architecture, manifest, build, docs, smoke
- [x] 검증한 항목을 기록한다.
  - Router는 VSCode API, filesystem, environment에 의존하지 않는다.
  - Router는 Domain risk policy를 재계산하지 않고 tree item payload만 읽는다.
  - blocked/mutating/unsupported action은 실행 가능한 command id를 반환하지 않는다.
  - 새 command contribution, 새 설정, 새 로그, 새 mutation workflow를 추가하지 않았다.
- [x] 남은 위험 요소를 기록한다.
  - 실제 Diagnostics context menu에서 action을 선택하는 command contribution은 아직 없다.
  - mutating remediation execution state machine은 아직 구현되지 않았다.
  - `compare-backup` action을 실제 command로 연결하려면 command registry/manifest/use case wiring이 필요하다.
  - `.gitignore`의 `.tasks/` ignore 변경 때문에 새 task 문서는 현재 git status에 표시되지 않는다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 작업은 safe remediation action을 실제 command contribution 또는 command palette entry로 노출하는 것이다.
  - mutating action은 후속 state machine 태스크에서 confirmation 흐름을 만든 뒤에만 연결해야 한다.
  - backup compare action은 command id와 input collector를 추가할 때 별도 테스트가 필요하다.

## 13. Next Task Decision Hook

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다. Phase 004 전체 목표에는 아직 도달하지 않았다.
- [x] 도달하지 못했다면 남은 목표를 정리한다. 남은 목표는 safe remediation command exposure, mutating action execution state machine, target profile governance, release candidate readiness다.
- [x] 다음 우선순위 태스크를 결정한다. 다음 우선순위는 safe remediation command exposure다.
- [x] 다음 태스크 파일명을 결정한다. 다음 파일은 `.tasks/task012.md`다.

## 14. Stop Conditions

- [x] 해당 없음: `plan.md`의 최종 목표에는 아직 도달하지 않았다.
- [x] 해당 없음: 필수 요구사항이 명확하여 진행을 계속할 수 있었다.
- [x] 해당 없음: 추가 외부 정보, 권한, 비밀값, 접근 권한 없이 검증 가능한 범위에서 진행했다.
