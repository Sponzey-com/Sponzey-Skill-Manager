# Task 002. Diagnostics DTO And Tree Payload Tidy First

## 1. Task Purpose

- [x] Diagnostics persistence를 구현하기 전에 Diagnostics read model과 tree item mapper가 핵심 DTO 필드를 잃지 않도록 정리한다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 003.2-A "Diagnostics DTO/read model Tidy First cleanup"에 기여한다.
- [x] 완료 후 Diagnostics tree item은 `sourceId`, `targetId`, `category`, `severity`, `recommendation`, `message`, `code`를 command/detail 후속 작업에서 사용할 수 있는 payload로 보존해야 한다.

## 2. Current Context

- [x] Task 001은 Phase 003 release smoke checklist와 검증 테스트를 생성했고, `npm test`, `npm run build`, `npm run release:gate`를 통과했다.
- [x] 현재 `refreshSkills`는 target diagnostics를 read model에 spread하고 `targetId`, `targetPath`를 추가한다.
- [x] 현재 `mapSkillsReadModelToTreeItems`는 diagnostics를 tree item으로 표시하지만 diagnostic payload 자체를 tree item에 보존하지 않는다.
- [x] Phase 003.2-B persistence와 Phase 003.2-C grouping/detail/open action은 아직 시작하지 않는다.
- [x] 이번 태스크는 Tidy First 성격이며 persistence schema, metadata store, grouping UI는 제외한다.
- [x] 현재 확인된 제약 사항: Diagnostics detail command가 아직 별도 payload를 사용하지 않더라도 후속 task가 사용할 수 있게 mapper payload만 보존한다.

## 3. Scope

### Included

- [x] Diagnostics tree item이 diagnostic DTO payload를 보존하는 실패 테스트를 먼저 작성한다.
- [x] Presentation tree mapper에 diagnostic payload 전달을 추가한다.
- [x] refresh read model이 diagnostic `category`와 `recommendation`을 보존하는 회귀 테스트를 보강한다.

### Excluded

- [x] Analysis metadata persistence를 구현하지 않는다.
- [x] Diagnostics grouping by severity/category를 구현하지 않는다.
- [x] Diagnostics detail/open command를 구현하지 않는다.
- [x] Product runtime 로그를 추가하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] Diagnostics tree item payload 보존을 구현한다.
- [x] 입력: `readModel.diagnostics[]` item.
- [x] 출력: `tree[diagnostics].children[].diagnostic` payload.
- [x] 성공 조건: tree item payload가 diagnostic code, severity, category, message, recommendation, sourceId, targetId를 보존한다.
- [x] 실패 조건: tree mapper가 label/detail/description만 만들고 원본 diagnostic DTO를 잃는다.

### Functional Unit 2

- [x] refresh read model의 diagnostic field preservation 회귀 테스트를 보강한다.
- [x] 입력: targetStore scan diagnostic with `category` and `recommendation`.
- [x] 출력: `result.readModel.diagnostics[]`에 target context와 원본 diagnostic fields가 모두 포함된다.
- [x] 성공 조건: target diagnostic field가 `targetId`, `targetPath` 추가 후에도 유지된다.
- [x] 실패 조건: refresh mapper가 diagnostic을 재구성하면서 category/recommendation을 삭제한다.

### Functional Unit 3

- [x] 자동 검증을 실행하고 Task 002 Completion Report에 기록한다.
- [x] 입력: focused tests, `npm test`, `npm run build`.
- [x] 출력: 검증 결과와 남은 위험 기록.
- [x] 성공 조건: focused tests, 전체 tests, build가 통과한다.
- [x] 실패 조건: mapper regression, architecture violation, manifest/build failure가 발생한다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Presentation`, `Application tests`, `Task documentation`.
- [x] Domain 계층은 변경하지 않는다.
- [x] Application runtime behavior는 변경하지 않고 read model preservation test만 보강한다.
- [x] Infrastructure는 변경하지 않는다.
- [x] Presentation은 read model DTO를 tree item payload로 전달만 하고 diagnostic policy를 재구현하지 않는다.
- [x] 외부 시스템 접근은 없다.
- [x] 새 인터페이스, 포트, 어댑터는 필요하지 않다.
- [x] 전역 상태, 숨겨진 I/O, 암묵적 설정 접근을 추가하지 않는다.

Changed layers:

- [x] Presentation
- [x] Application tests
- [x] Task documentation

External I/O boundary:

- [x] None in product runtime. Tests use in-memory data only.

RuntimeContext fields used:

- [x] None.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 환경 값은 프로그램 시작 시 최초 1회만 수신한다는 기존 원칙을 변경하지 않는다.
- [x] 최초 수신 이후에는 환경 값을 전역 상수처럼 사용하지 않는다.
- [x] 환경 값은 명시적 인자, 생성자 인자, 컨텍스트 객체, 의존성 주입으로 전달한다는 기존 구조를 유지한다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 추가하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] Product Log는 추가하지 않는다.
- [x] 성공 경로 로그는 필요하지 않다.
- [x] 민감 정보와 과도한 내부 상태를 기록하지 않는다.

### Field Debug Log

- [x] Field Debug Log는 추가하지 않는다.
- [x] 활성화 조건 변경은 없다.
- [x] 민감 정보 마스킹 기준 변경은 없다.
- [x] 보존 범위와 사용 범위 변경은 없다.

### Development Log

- [x] 테스트 실행 output만 Development Log 성격으로 취급한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 추가하지 않는다.
- [x] 테스트 전용 output은 Node test와 script 실행 결과에만 남긴다.

Product Log events:

- [x] None.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] runtime 상태머신은 필요하지 않다.
- [x] 이 태스크는 단일 mapper payload preservation 작업이다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록은 해당 없음이다.
- [x] 이벤트 목록은 해당 없음이다.
- [x] 전이 조건은 해당 없음이다.
- [x] 실패 상태와 종료 상태는 테스트 pass/fail로만 표현한다.
- [x] 상태 전이를 테스트 가능하게 만들 필요가 없다.

State machine required:

- [x] No state machine; single-step read model mapping only.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: `mapSkillsReadModelToTreeItems` diagnostic payload preservation.
- [x] 정상 케이스 테스트를 작성한다.
- [x] 실패 케이스 테스트는 current mapper가 `diagnostic` payload를 제공하지 않는 것으로 확인한다.
- [x] 경계값 테스트는 sourceId와 targetId가 동시에 존재하는 diagnostic을 사용한다.
- [x] 외부 의존성은 테스트 더블 없이 in-memory read model로 대체한다.
- [x] 설정 값 전달 방식 테스트는 해당 없음으로 기록한다.
- [x] 로그 정책 검증 테스트는 해당 없음으로 기록한다.
- [x] 상태 전이가 없으므로 상태 전이 테스트는 해당 없음으로 기록한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

First failing tests:

- [x] `test/presentation/tree-view-model.test.mjs` failed because diagnostic tree items did not preserve a `diagnostic` payload.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] `.tasks/release-smoke.md`의 Diagnostics item inspection은 후속 Phase 003.2-C에서 수행한다.

AGENTS.md rules checked:

- [x] Layered Architecture
- [x] Clean Architecture
- [x] Tidy First
- [x] TDD
- [x] Configuration Policy
- [x] Logging Policy
- [x] State Machine Policy

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 수정한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현으로 diagnostic payload preservation을 추가한다.
- [x] refresh read model diagnostic field preservation 테스트를 보강한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] 필요한 로그를 정책에 맞게 추가한다.
- [x] 상태 관리가 필요한 경우 명시적 상태 전이로 구현한다.
- [x] 중복과 구조 문제를 정리한다.
- [x] 모든 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 도메인 계층이 외부 프레임워크에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 환경 값이 전역 상수처럼 사용되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 플래그 조합이 아니라 명시적 상태로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.

  - Added diagnostic payload preservation to Diagnostics tree items.
  - Added presentation mapper test that first failed without the payload.
  - Added refresh read model regression coverage for diagnostic `category` and `recommendation`.
- [x] 생성하거나 수정한 파일을 기록한다.

  - Created `.tasks/task002.md`.
  - Updated `src/presentation/tree-view-model.js`.
  - Updated `test/presentation/tree-view-model.test.mjs`.
  - Updated `test/application/refresh-skills.test.mjs`.
- [x] 실행한 테스트 명령과 결과를 기록한다.

  - `node --test test/presentation/tree-view-model.test.mjs` failed first because `diagnosticItem.diagnostic` was `undefined`.
  - `node --test test/presentation/tree-view-model.test.mjs` passed after mapper change.
  - `node --test test/application/refresh-skills.test.mjs` passed.
  - `npm test` passed: 216 tests, 0 failures.
  - `npm run build` passed: architecture ok, extension manifest ok, build smoke ok.
- [x] 검증한 항목을 기록한다.

  - Diagnostics tree item preserves diagnostic DTO payload for follow-up detail/open commands.
  - Refresh read model preserves target diagnostic `category` and `recommendation` while adding `targetId` and `targetPath`.
  - No new settings, logs, state machines, ports, or infrastructure adapters were added.
- [x] 남은 위험 요소를 기록한다.

  - Diagnostics persistence is still missing.
  - Diagnostics grouping by severity/category is still missing.
  - Diagnostics detail/open action is still missing.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.

  - Next task should implement Phase 003.2-B analysis metadata port/store and persistence.
  - Next task must define `.sponzey/analysis/` schema with `schemaVersion` and `sourceHash`.
  - Next task must handle unsupported or malformed metadata as diagnostics, not activation failure.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.
- [x] 도달했다면 추가 태스크를 생성하지 않는다.
- [x] 도달하지 못했다면 남은 목표를 정리한다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
- [x] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작한다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [ ] `plan.md`의 최종 목표에 도달했다.
- [ ] 필수 요구사항이 불명확하여 더 이상 안전하게 진행할 수 없다.
- [ ] 외부 정보, 권한, 비밀값, 접근 권한이 없어 진행할 수 없다.
- [ ] `AGENTS.md` 원칙과 충돌하는 요구사항이 발견되었다.
- [ ] 테스트 또는 검증 환경이 없어 완료 여부를 판단할 수 없다.
- [ ] 코드베이스 구조가 계획과 크게 달라 태스크 재설계가 필요하다.
- [ ] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.