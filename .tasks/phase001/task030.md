# Task 030. Remove Applied Skill Command Input Collection

## 1. Task Purpose

- [x] 이 태스크의 목적은 command palette에서 `sponzeySkills.removeAppliedSkill` 실행 시 필요한 target과 applied skill input DTO를 presentation 계층에서 수집하는 것이다.
- [x] 이 태스크 완료 후 사용자는 command palette만으로 global/project target에 적용된 managed skill을 제거할 수 있어야 한다.

## 2. Scope

### Included

- [x] `collectCommandInput`이 `sponzeySkills.removeAppliedSkill` input을 수집한다.
- [x] missing target은 read model의 global/project target group을 quick pick으로 표시해 수집한다.
- [x] missing applied skill은 선택된 target group의 `skills`를 quick pick으로 표시해 수집한다.
- [x] 이미 input DTO가 제공된 호출은 prompt 없이 그대로 통과시킨다.
- [x] input collection 취소 시 use case handler를 호출하지 않고 typed cancelled result를 반환한다.
- [x] activation에서 command palette remove 실행 시 prompt input이 remove use case로 전달되는지 검증한다.

### Excluded

- [x] external skill 강제 삭제 confirmation은 구현하지 않는다.
- [x] transfer command prompt는 구현하지 않는다.
- [x] tree item context menu command input mapping은 구현하지 않는다.
- [x] bulk remove는 구현하지 않는다.

## 3. Architecture Notes

- [x] 변경 계층은 presentation과 extension boundary에 한정한다.
- [x] input collector는 VSCode API를 import하지 않고 `window`와 `loadReadModel` dependency를 명시적으로 받는다.
- [x] input collector는 read model을 표시용 선택지로 변환하고 remove policy를 구현하지 않는다.
- [x] Domain/Application에는 prompt, window, command palette dependency를 추가하지 않는다.

## 4. Configuration Rules

- [x] input collection은 settings/environment를 직접 읽지 않는다.
- [x] read model loader는 activation composition에서 전달받는다.
- [x] 수집된 값은 명시적 input DTO로 use case handler에 전달한다.

## 5. Logging Policy

- [x] input collector는 skill body, file content, stack trace를 로그나 notification에 노출하지 않는다.
- [x] 취소 result는 diagnostic code/message 수준만 반환한다.
- [x] Product Log/Field Debug Log persistence는 구현하지 않는다.

## 6. TDD Plan

- [x] 실패하는 presentation input collector 테스트를 먼저 작성한다.
- [x] missing remove input이 target/applied skill quick pick으로 채워지는지 검증한다.
- [x] 기존 remove DTO가 있는 호출은 prompt와 read model load 없이 통과하는지 검증한다.
- [x] target 선택 취소 시 wrapped handler가 호출되지 않는지 검증한다.
- [x] activation에서 command palette remove 실행 시 prompt input이 remove use case로 전달되는지 검증한다.

## 7. Completion Report

### Summary

- `sponzeySkills.removeAppliedSkill` command palette 실행 시 target과 applied skill을 quick pick으로 수집하도록 presentation input collector를 확장했다.
- 기존 remove DTO가 이미 제공된 호출은 prompt와 read model load 없이 통과하도록 유지했다.
- target 선택 취소 시 typed cancelled result를 반환하고 use case handler를 호출하지 않도록 검증했다.
- activation 경로에서 VSCode window prompt 결과가 remove use case의 `removeTargetEntry` 입력으로 전달되는지 검증했다.

### Changed Files

- `src/presentation/command-input-collector.js`
- `test/presentation/command-input-collector.test.mjs`
- `test/extension-activation.test.mjs`
- `.tasks/task030.md`

### Test Results

- `npm test -- test/presentation/command-input-collector.test.mjs`: 12 tests passed.
- `npm test -- test/extension-activation.test.mjs`: 10 tests passed.
- `npm test`: 107 tests passed.
- `npm run check:architecture`: architecture ok, 23 source files checked.
- `npm run build`: architecture ok, build smoke ok.

### Verified Items

- remove command의 missing target prompt는 read model의 global/project target group을 사용한다.
- remove command의 missing applied skill prompt는 선택된 target group의 applied skill 목록을 사용한다.
- input collector는 VSCode API를 직접 import하지 않고 주입된 `window`와 `loadReadModel`만 사용한다.
- Domain/Application 계층에는 command palette 또는 prompt 의존성을 추가하지 않았다.
- 취소 이벤트는 Product Log 수준의 typed event만 반환하고 notification은 발생시키지 않는다.

### Remaining Risks

- command palette remove는 현재 managed target entry 제거 흐름만 다룬다. external skill 강제 삭제 confirmation은 별도 태스크로 분리해야 한다.
- tree item context menu에서 선택된 node를 remove DTO로 매핑하는 흐름은 아직 별도 태스크로 남아 있다.
- applied skill 목록이 비어 있는 target을 선택했을 때 빈 quick pick UX를 더 명확하게 처리하는 개선은 후속 태스크에서 검토한다.

### Follow-up Tasks

- transfer command palette input collection을 추가한다.
- tree item context menu command input mapping을 추가한다.
- empty applied skill quick pick에 대한 사용자 메시지 또는 unavailable result 처리를 설계한다.

- [x] 수행한 변경 사항을 요약한다.
- [x] 생성하거나 수정한 파일을 기록한다.
- [x] 실행한 테스트 명령과 결과를 기록한다.
- [x] 검증한 항목을 기록한다.
- [x] 남은 위험 요소를 기록한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
