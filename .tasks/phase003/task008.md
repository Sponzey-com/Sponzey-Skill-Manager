# Task 008. Diagnostic Detail Input And Detail Result Messages

## 1. Task Purpose

- [x] Diagnostic item이 source payload 없이도 `Show Skill Detail` 흐름에서 detail DTO로 전달되도록 만든다.
- [x] `Show Skill Detail` 결과 notification이 generic `command completed`가 아니라 detail type별 next action 문구를 표시하도록 만든다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.3의 diagnostic detail input과 command result next-action message 범위를 수행한다.
- [x] 완료 후 source, applied, backup, diagnostic detail 결과는 사용자에게 다음 행동을 짧게 안내해야 한다.

## 2. Current Context

- [x] Task 006은 source/applied/diagnostic detail DTO를 보강했다.
- [x] Task 007은 backup detail DTO와 backup input collector를 보강했다.
- [x] 현재 `collectSkillDetailInput`은 source, applied skill, backup payload만 prompt 없이 통과시킨다.
- [x] 현재 diagnostic-only tree item은 `input.diagnostic`만 가진 경우 detail command에서 read model prompt로 돌아갈 수 있다.
- [x] 현재 `skillDetailChoices`는 source, applied, backup choices만 제공하고 diagnostics choices를 제공하지 않는다.
- [x] 현재 `renderCommandResult`는 detail success result를 generic `command completed`로 렌더링한다.

## 3. Scope

### Included

- [x] `collectCommandInput`이 valid diagnostic payload를 가진 `Show Skill Detail` input을 prompt 없이 통과시킨다.
- [x] `skillDetailChoices`가 read model diagnostics를 detail target choices에 포함한다.
- [x] `renderCommandResult`가 source/applied/backup/diagnostic detail success result를 type별 message로 렌더링한다.
- [x] diagnostic detail severity가 warning/error/critical이면 renderer level이 로그 정책에 맞게 warning/error를 선택한다.

### Excluded

- [x] Webview detail panel은 추가하지 않는다.
- [x] detail result에 Product Log event를 추가하지 않는다.
- [x] detail DTO schema를 application 계층에서 다시 변경하지 않는다.
- [x] analyzer rule 또는 diagnostic 생성 정책을 변경하지 않는다.
- [x] 새 설정을 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] Diagnostic detail input pass-through를 구현한다.
- [x] 입력: `{ diagnostic }` payload.
- [x] 출력: prompt 없이 동일 input을 반환한다.
- [x] 성공 조건: diagnostic-only item에서 `Show Skill Detail` 실행 시 `loadReadModel`이 호출되지 않는다.
- [x] 실패 조건: diagnostic-only item이 read model prompt 또는 unavailable result로 돌아간다.

### Functional Unit 2

- [x] Detail quick pick에 diagnostics choices를 추가한다.
- [x] 입력: refresh read model `diagnostics`.
- [x] 출력: diagnostic quick pick choice with `{ diagnostic }`.
- [x] 성공 조건: Command Palette 또는 empty input detail flow에서 diagnostic item을 선택할 수 있다.
- [x] 실패 조건: diagnostics view에만 diagnostic이 보이고 detail prompt에서는 선택할 수 없다.

### Functional Unit 3

- [x] Detail result renderer next-action 문구를 추가한다.
- [x] 입력: `result.detail.type`.
- [x] 출력: Product notification message without full path or skill body.
- [x] 성공 조건: source/applied/backup/diagnostic detail success result가 type별 message를 표시한다.
- [x] 실패 조건: `Show Skill Detail` 성공 시 `Sponzey Skills: command completed`만 표시된다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Presentation`, `Tests`, `Task documentation`.
- [x] Application use case DTO는 이미 충분하므로 이번 태스크에서 변경하지 않는다.
- [x] Presentation은 command input DTO와 renderer message만 만든다.
- [x] 외부 파일 읽기, filesystem metadata read, VSCode direct opener 호출을 추가하지 않는다.
- [x] renderer는 민감 정보와 full path를 notification에 포함하지 않는다.
- [x] settings/env/process global을 읽지 않는다.

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

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 새 configuration contribution을 추가하지 않는다.
- [x] 환경 값은 읽지 않는다.
- [x] 런타임 중간 설정 변경을 추가하지 않는다.
- [x] Detail message policy는 함수 입력인 result DTO만 사용한다.

## 7. Logging Requirements

### Product Log

- [x] Detail 조회 성공은 Product Log를 추가하지 않는다.
- [x] Detail success notification은 user-visible command result이며 Product Log payload가 아니다.
- [x] Detail 실패는 기존 failure result와 diagnostic renderer 흐름을 유지한다.

### Field Debug Log

- [x] Field Debug Log를 추가하지 않는다.
- [x] Detail mapping 또는 rendering 내부 상태를 로그로 남기지 않는다.

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
- [x] Detail use case의 기존 explicit steps contract를 유지한다.
- [x] Presentation input collector는 validation branch만 추가하고 상태 플래그 조합을 만들지 않는다.
- [x] Renderer는 detail type과 severity를 pure function branch로 매핑한다.

State machine required:

- [x] No new state machine.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: diagnostic detail input pass-through.
- [x] 테스트 대상: diagnostics detail quick pick choices.
- [x] 테스트 대상: detail result renderer source/applied/backup/diagnostic messages.
- [x] 테스트 대상: diagnostic detail severity에 따른 renderer level.
- [x] 외부 의존성은 사용하지 않는다.
- [x] 설정 값 전달 방식 테스트는 새 설정이 없음을 build/manifest validation으로 검증한다.
- [x] 로그 정책 검증은 runtime event 추가가 없고 renderer가 path/body를 표시하지 않음을 message assertion으로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 중복 helper를 정리한다.

First failing tests:

- [x] `test/presentation/command-input-collector.test.mjs` should fail because diagnostic-only detail inputs are not preserved.
- [x] `test/presentation/command-input-collector.test.mjs` should fail because diagnostics are not included in detail choices.
- [x] `test/presentation/command-result-renderer.test.mjs` should fail because detail success results render generic completion messages.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 Diagnostic item detail notification wording을 확인한다.

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
- [x] 최소 구현으로 diagnostic pass-through helper를 추가한다.
- [x] 최소 구현으로 diagnostic quick pick choices를 추가한다.
- [x] 최소 구현으로 detail result renderer branch를 추가한다.
- [x] detail notification에 full path, skill body, secret-like value가 포함되지 않는지 확인한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 추가되지 않았는지 확인한다.
- [x] 설정 값 전달 방식이 변경되지 않았는지 확인한다.
- [x] 로그가 추가되지 않았는지 확인한다.
- [x] 중복과 구조 문제를 정리한다.
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
- [x] 복잡한 흐름이 플래그 조합이 아니라 pure branch로 표현되었다.
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

- Added diagnostic-only detail input pass-through in `collectCommandInput`.
- Added diagnostics to `Show Skill Detail` quick pick choices.
- Added detail-specific notification rendering for source, applied, backup, and diagnostic detail results.
- Diagnostic detail notifications now use warning/error levels based on diagnostic severity.
- Detail notification messages avoid full filesystem paths and skill body content.

Commands run:

- `node --test test/presentation/command-input-collector.test.mjs` failed before implementation and passed after implementation.
- `node --test test/presentation/command-result-renderer.test.mjs` failed before implementation and passed after implementation.
- `npm test` passed with 233 tests.
- `npm run build` passed.

Files changed:

- `.tasks/task008.md`
- `src/presentation/command-input-collector.js`
- `src/presentation/command-result-renderer.js`
- `test/presentation/command-input-collector.test.mjs`
- `test/presentation/command-result-renderer.test.mjs`

Residual risks:

- [x] Manual Extension Host smoke for detail notifications is still pending for release readiness.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 009 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.
