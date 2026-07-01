# Task 010. Apply Target Compatibility Choice Labels

## 1. Task Purpose

- [x] Apply command의 target 선택 단계에서 source skill과 target client의 compatibility 상태를 표시한다.
- [x] Codex-only 또는 Claude-only diagnostic이 있는 source를 반대 client target에 적용하려 할 때 quick pick description에 warning을 표시한다.
- [x] custom 또는 unknown client target은 compatibility unknown으로 표시한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.4의 compatibility warning in apply target selection 범위를 수행한다.

## 2. Current Context

- [x] Task 009는 project-over-global shadowing diagnostic을 read model에 추가했다.
- [x] 현재 `collectApplySkillInput`은 source를 먼저 선택한 뒤 target을 선택한다.
- [x] 현재 `targetChoices`는 선택된 source를 받지 않으므로 compatibility 상태를 표시하지 못한다.
- [x] source read model은 `compatibility` 객체와 analysis `diagnostics`를 보존할 수 있다.
- [x] apply 동작 자체는 application use case의 risk/conflict policy가 담당한다.

## 3. Scope

### Included

- [x] `targetChoices`가 선택된 source DTO를 입력으로 받도록 한다.
- [x] source `compatibility` 객체를 target client별 description suffix로 표시한다.
- [x] `codex-only-compatibility`, `claude-only-compatibility` diagnostic을 target client warning으로 표시한다.
- [x] custom 또는 unknown target client는 `compatibility unknown`으로 표시한다.

### Excluded

- [x] Apply use case의 block/allow 정책은 변경하지 않는다.
- [x] Analyzer compatibility rule을 변경하지 않는다.
- [x] Read model schema를 변경하지 않는다.
- [x] 새 설정을 추가하지 않는다.
- [x] Webview 또는 별도 detail panel은 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] Explicit compatibility object를 target choice description에 반영한다.
- [x] 입력: source compatibility `{ codex: "compatible", claude: "unknown" }`.
- [x] 출력: target description suffix `compatible`, `compatibility unknown`.
- [x] 성공 조건: apply target quick pick에서 target별 compatibility 상태가 보인다.
- [x] 실패 조건: 사용자가 target을 고르기 전 compatibility 차이를 알 수 없다.

### Functional Unit 2

- [x] Analyzer compatibility diagnostics를 target choice warning으로 반영한다.
- [x] 입력: `codex-only-compatibility` 또는 `claude-only-compatibility` diagnostic.
- [x] 출력: 반대 client target description suffix `compatibility warning`.
- [x] 성공 조건: Codex-only source를 Claude target에 적용하려 할 때 warning이 보인다.
- [x] 실패 조건: warning diagnostic이 Diagnostics에만 있고 apply target 선택에는 보이지 않는다.

### Functional Unit 3

- [x] Custom/unknown client target에 unknown compatibility 표시를 추가한다.
- [x] 입력: target `clientType: "custom"` 또는 missing clientType.
- [x] 출력: target description suffix `compatibility unknown`.
- [x] 성공 조건: custom target에 대한 호환성 불확실성이 선택 전에 보인다.
- [x] 실패 조건: custom target이 known compatible처럼 보인다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Presentation`, `Tests`, `Task documentation`.
- [x] Domain/Application 정책은 변경하지 않는다. 이번 태스크는 선택 UI label 보강이다.
- [x] Presentation은 read model DTO에 포함된 compatibility/diagnostics만 해석한다.
- [x] 외부 파일 읽기, filesystem access, settings access를 추가하지 않는다.
- [x] notification/log에는 full path나 skill body를 추가하지 않는다.

Changed layers:

- [x] Presentation
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] None.

RuntimeContext fields used:

- [x] None.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] 새 설정을 추가하지 않는다.
- [x] client compatibility policy를 외부 설정 파일로 만들지 않는다.
- [x] 환경 값은 읽지 않는다.
- [x] 런타임 중간 설정 변경을 추가하지 않는다.
- [x] Compatibility label은 function input DTO에서만 계산한다.

## 7. Logging Requirements

### Product Log

- [x] Compatibility label 표시는 Product Log를 추가하지 않는다.
- [x] Apply command 실행 결과의 기존 Product Log는 변경하지 않는다.

### Field Debug Log

- [x] Field Debug Log를 추가하지 않는다.
- [x] Compatibility label 계산 detail을 로그로 남기지 않는다.

### Development Log

- [x] 테스트 실행 output만 Development Log 성격으로 취급한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 추가하지 않는다.

Product Log events:

- [x] None.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] Runtime state machine은 추가하지 않는다.
- [x] Apply command input collection의 기존 순서 `SelectSource -> SelectTarget -> SelectApplyMode`를 유지한다.
- [x] Compatibility label 계산은 pure helper로 둔다.
- [x] 상태 플래그 조합을 만들지 않는다.

State machine required:

- [x] No new state machine.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: explicit compatibility object target description suffix.
- [x] 테스트 대상: codex-only diagnostic causes Claude target compatibility warning.
- [x] 테스트 대상: custom target description uses compatibility unknown.
- [x] 외부 의존성은 fake read model과 fake quick pick window로 대체한다.
- [x] 설정 값 전달 방식 테스트는 새 설정이 없음을 build/manifest validation으로 검증한다.
- [x] 로그 정책 검증은 event/result가 변경되지 않음을 existing tests와 focused assertions로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 helper 이름과 branch 중복을 정리한다.

First failing tests:

- [x] `test/presentation/command-input-collector.test.mjs` should fail because target choices do not include compatibility suffixes.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 Codex-only/Claude-only source apply target labels를 확인한다.

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
- [x] 최소 구현으로 `targetChoices`에 source input을 전달한다.
- [x] 최소 구현으로 explicit compatibility suffix helper를 추가한다.
- [x] 최소 구현으로 analyzer diagnostic 기반 warning helper를 추가한다.
- [x] 최소 구현으로 custom/unknown client unknown suffix를 추가한다.
- [x] Product Log 또는 Field Debug Log가 추가되지 않았는지 확인한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 추가되지 않았는지 확인한다.
- [x] 설정 값 전달 방식이 변경되지 않았는지 확인한다.
- [x] 모든 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 도메인 계층이 외부 프레임워크에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 I/O가 추가되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 유지되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 플래그 조합이 아니라 pure helper로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.
- [x] 생성하거나 수정한 파일을 기록한다.
- [x] 실행한 테스트 명령과 결과를 기록한다.
- [x] 검증한 항목을 기록한다.
- [x] 남은 위험 요소를 기록한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.

Completion notes:

- Apply target quick pick choices now receive the selected source DTO.
- Explicit source compatibility values render as target description suffixes.
- `codex-only-compatibility` and `claude-only-compatibility` diagnostics render warning suffixes for opposite client targets.
- Custom or missing client targets render `compatibility unknown`.
- Apply input DTOs and Application use cases are unchanged.

Commands run:

- `node --test test/presentation/command-input-collector.test.mjs` failed before implementation and passed after implementation.
- `npm test` passed with 238 tests.
- `npm run build` passed.

Files changed:

- `.tasks/task010.md`
- `src/presentation/command-input-collector.js`
- `test/presentation/command-input-collector.test.mjs`

Residual risks:

- [x] Apply preflight blocking is unchanged and remains application use case responsibility.
- [x] Source/main repository name conflict remains for a later task.
- [x] Manual Extension Host smoke for compatibility labels is still pending for release readiness.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 011 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.
