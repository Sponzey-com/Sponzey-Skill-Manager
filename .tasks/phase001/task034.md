# Task 034. Empty Command Choice Handling

## 1. Task Purpose

- [x] 이 태스크의 목적은 command palette 또는 tree context command 입력 수집 중 선택지가 없을 때 빈 quick pick을 띄우지 않고 typed unavailable result를 반환하는 것이다.
- [x] 이 태스크 완료 후 source/target/applied skill 선택지가 없는 상태는 취소와 구분되어 diagnostic으로 보고되어야 한다.

## 2. Scope

### Included

- [x] apply command에서 source skill 선택지가 없으면 unavailable result를 반환한다.
- [x] apply command에서 target 선택지가 없으면 unavailable result를 반환한다.
- [x] remove command에서 target 선택지가 없으면 unavailable result를 반환한다.
- [x] remove command에서 applied skill 선택지가 없으면 unavailable result를 반환한다.
- [x] transfer command에서 target 또는 applied skill 선택지가 없으면 unavailable result를 반환한다.
- [x] unavailable result 발생 시 use case handler를 호출하지 않는지 검증한다.

### Excluded

- [x] "Create skill" 또는 "Configure target" 같은 후속 action button은 구현하지 않는다.
- [x] VSCode notification 문구 개선은 구현하지 않는다.
- [x] empty state tree item UI는 구현하지 않는다.

## 3. Architecture Notes

- [x] 변경 계층은 presentation input collector에 한정한다.
- [x] 선택지 부재는 presentation 입력 수집 실패로 처리하고 domain/application policy로 넘기지 않는다.
- [x] input collector는 VSCode API를 import하지 않고 주입된 `window`와 `loadReadModel`만 사용한다.

## 4. Configuration Rules

- [x] 선택지 확인은 read model 기반으로만 수행한다.
- [x] 설정 또는 환경 변수를 새로 읽지 않는다.
- [x] unavailable result는 명시적인 typed result로 반환한다.

## 5. Logging Policy

- [x] unavailable result는 Product Log 수준의 event code만 포함한다.
- [x] skill body, file content, stack trace를 포함하지 않는다.

## 6. TDD Plan

- [x] 실패하는 input collector 테스트를 먼저 작성한다.
- [x] apply source choices empty 상태를 검증한다.
- [x] remove applied skill choices empty 상태를 검증한다.
- [x] transfer target choices empty 상태에서 handler가 호출되지 않는지 검증한다.

## 7. Completion Report

### Summary

- 동적 quick pick 선택지를 공통 `chooseRequiredQuickPick` helper로 수집하도록 변경했다.
- source/target/applied skill 선택지가 비어 있으면 VSCode quick pick을 호출하지 않고 `command-input-unavailable` result를 반환한다.
- unavailable result는 취소 result와 구분되고 use case handler를 호출하지 않는다.

### Changed Files

- `src/presentation/command-input-collector.js`
- `test/presentation/command-input-collector.test.mjs`
- `.tasks/task034.md`

### Test Results

- `npm test -- test/presentation/command-input-collector.test.mjs`: 21 tests passed.
- `npm test`: 124 tests passed.
- `npm run check:architecture`: architecture ok, 23 source files checked.
- `npm run build`: architecture ok, extension manifest ok, build smoke ok.

### Verified Items

- apply source choices empty 상태는 `command-input-unavailable`로 반환된다.
- selected target에 applied skill이 없으면 remove command는 quick pick을 띄우지 않는다.
- transfer target choices empty 상태에서는 wrapped handler가 호출되지 않는다.
- unavailable result에는 Product Log 수준의 `command.input.unavailable` event만 포함된다.
- input collector는 설정, 환경 변수, VSCode API import를 추가하지 않았다.

### Remaining Risks

- 사용자에게 다음 action을 제안하는 notification button은 아직 없다.
- tree view empty state item은 아직 없다.
- unavailable message는 typed diagnostic 수준이며, UX copy polishing은 별도 태스크로 분리한다.

### Follow-up Tasks

- empty state tree item 또는 next action command를 설계한다.
- VSCode extension host smoke에서 unavailable notification 표시를 확인한다.
- [x] 수행한 변경 사항을 요약한다.
- [x] 생성하거나 수정한 파일을 기록한다.
- [x] 실행한 테스트 명령과 결과를 기록한다.
- [x] 검증한 항목을 기록한다.
- [x] 남은 위험 요소를 기록한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.