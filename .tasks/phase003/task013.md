# Task 013. Destructive Prompt Text Disambiguation

## 1. Task Purpose

- [x] Remove/transfer command input prompts가 source delete와 target remove를 혼동하지 않도록 문구를 정리한다.
- [x] Move cleanup confirmation이 target cleanup의 의미를 명확하게 말하도록 한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.5의 command input collector prompt text consistency 범위를 수행한다.
- [x] 완료 후 사용자는 source 삭제, target 적용 해제, target backup/move/copy의 차이를 prompt에서 즉시 구분해야 한다.

## 2. Current Context

- [x] 현재 remove applied skill prompt는 `Select target`, `Select applied skill`처럼 generic하다.
- [x] 현재 transfer prompt도 copy/backup/move 의도를 충분히 드러내지 않는다.
- [x] 현재 move cleanup prompt는 `Confirm target cleanup`으로 target cleanup이 적용 삭제임을 충분히 설명하지 않는다.
- [x] Application use case confirmation policy는 이미 explicit input을 요구한다.
- [x] 이번 태스크는 Presentation prompt text만 변경한다.

## 3. Scope

### Included

- [x] `removeAppliedSkill` target selection placeholder를 target-only remove wording으로 변경한다.
- [x] transfer command target/applied skill selection placeholder를 copy/backup/move wording으로 변경한다.
- [x] move cleanup confirmation label/placeHolder를 target cleanup 결과가 명확한 wording으로 변경한다.
- [x] prompt text behavior tests를 갱신한다.

### Excluded

- [x] Application use case confirmation 정책은 변경하지 않는다.
- [x] 새로운 confirmation field를 추가하지 않는다.
- [x] Audit trail payload는 변경하지 않는다.
- [x] 새 설정을 추가하지 않는다.
- [x] Webview 또는 modal UI를 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] Remove applied skill prompt text를 명확히 한다.
- [x] 입력: `sponzeySkills.removeAppliedSkill`.
- [x] 출력: target remove wording placeholders.
- [x] 성공 조건: prompt가 source 삭제가 아니라 target에서 적용 해제임을 나타낸다.
- [x] 실패 조건: prompt text가 source delete와 혼동될 수 있다.

### Functional Unit 2

- [x] Transfer prompt text를 command별로 명확히 한다.
- [x] 입력: copy/backup/move applied skill commands.
- [x] 출력: copy from target, backup from target, move from target wording.
- [x] 성공 조건: transfer prompt가 Main Repository로 가져오는 작업임을 나타낸다.
- [x] 실패 조건: prompt가 일반 remove/apply selection처럼 보인다.

### Functional Unit 3

- [x] Move cleanup confirmation text를 명확히 한다.
- [x] 입력: move command without `cleanupConfirmed`.
- [x] 출력: existing target entry removal wording.
- [x] 성공 조건: cleanup confirmation이 target entry 제거를 의미한다는 점이 보인다.
- [x] 실패 조건: cleanup이 source 삭제인지 target 삭제인지 모호하다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Presentation`, `Tests`, `Task documentation`.
- [x] Domain/Application/Infrastructure는 변경하지 않는다.
- [x] Prompt text는 command input collection의 user-facing presentation 책임이다.
- [x] 외부 I/O를 추가하지 않는다.
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

- [x] prompt wording을 설정 파일로 제어하지 않는다.
- [x] 환경 값은 읽지 않는다.
- [x] 런타임 중간 설정 변경을 추가하지 않는다.
- [x] Prompt text는 commandId와 input DTO만 사용한다.

## 7. Logging Requirements

### Product Log

- [x] Prompt text 변경은 Product Log를 추가하지 않는다.
- [x] Existing command result events는 변경하지 않는다.

### Field Debug Log

- [x] Field Debug Log를 추가하지 않는다.
- [x] Prompt 선택 결과를 로그로 남기지 않는다.

### Development Log

- [x] 테스트 fixture에 prompt text가 포함된다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 추가하지 않는다.

Product Log events:

- [x] None.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] Runtime state machine은 추가하지 않는다.
- [x] Existing prompt order를 유지한다.
- [x] Prompt text helper는 pure branch로 둔다.
- [x] 상태 플래그 조합을 만들지 않는다.

State machine required:

- [x] No new state machine.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: remove applied skill prompt placeholders.
- [x] 테스트 대상: backup and move transfer prompt placeholders.
- [x] 테스트 대상: move cleanup quick pick label and placeholder.
- [x] 외부 의존성은 fake quick pick window로 대체한다.
- [x] 설정 값 전달 방식 테스트는 새 설정이 없음을 build/manifest validation으로 검증한다.
- [x] 로그 정책 검증은 events/result가 변경되지 않음을 existing tests로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 prompt helper 이름을 정리한다.

First failing tests:

- [x] `test/presentation/command-input-collector.test.mjs` should fail because prompt placeholders are still generic.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 remove/copy/backup/move prompts를 확인한다.

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
- [x] 최소 구현으로 remove prompt wording helper를 추가한다.
- [x] 최소 구현으로 transfer prompt wording helper를 추가한다.
- [x] 최소 구현으로 move cleanup wording을 변경한다.
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

- [x] Added command-specific applied skill selection prompt text for remove, copy, backup, and move commands.
- [x] Changed move cleanup confirmation text to explicitly describe removing or keeping the target entry after copy.
- [x] Kept the change inside Presentation input collection and tests; Application, Domain, Infrastructure, configuration, and logging behavior were not changed.

Commands run:

- [x] `node --test test/presentation/command-input-collector.test.mjs` failed before implementation and passed after implementation.
- [x] `npm test` initially exposed outdated Extension Host prompt expectations.
- [x] `node --test test/extension-activation.test.mjs` passed after updating the prompt expectations.
- [x] `node --test test/presentation/command-input-collector.test.mjs` passed after implementation.
- [x] `npm test` passed with 243 tests.
- [x] `npm run build` passed.

Files changed:

- [x] `.tasks/task013.md`
- [x] `src/presentation/command-input-collector.js`
- [x] `test/presentation/command-input-collector.test.mjs`
- [x] `test/extension-activation.test.mjs`

Residual risks:

- [x] Application confirmation taxonomy remains for later audit.
- [x] Manual Extension Host smoke for prompt wording is still pending for release readiness.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 014 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.