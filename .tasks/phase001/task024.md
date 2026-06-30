# Task 024. Create Skill Command Input Collection

## 1. Task Purpose

- [x] 이 태스크의 목적은 command palette에서 `sponzeySkills.createSkill`을 실행할 때 필요한 input DTO를 presentation 계층에서 수집하는 것이다.
- [x] 이 태스크 완료 후 사용자는 command palette만으로 최소 `name`, `description`을 입력해 source skill 생성 command를 실행할 수 있어야 한다.

## 2. Scope

### Included

- [x] `collectCommandInput({ commandId, input, window })` helper를 구현한다.
- [x] `sponzeySkills.createSkill`에 대해 missing `name`, `description`을 `showInputBox`로 수집한다.
- [x] 이미 input DTO가 제공된 호출은 prompt 없이 그대로 통과시킨다.
- [x] input collection 취소 시 use case handler를 호출하지 않고 typed result를 반환한다.
- [x] `activate`에서 `showInputBox`가 있는 window runtime에만 input collection wrapper를 적용한다.

### Excluded

- [x] import/apply/remove/transfer command prompt는 구현하지 않는다.
- [x] rich multi-line editor 기반 skill body 입력은 구현하지 않는다.
- [x] tree item context menu command input mapping은 구현하지 않는다.
- [x] settings 변경 command는 구현하지 않는다.

## 3. Architecture Notes

- [x] 변경 계층은 presentation과 extension boundary에 한정한다.
- [x] input collector는 VSCode API를 import하지 않고 `window` dependency를 명시적으로 받는다.
- [x] Domain/Application에는 prompt, window, command palette dependency를 추가하지 않는다.
- [x] input collector는 DTO 수집만 수행하고 domain validation을 중복 구현하지 않는다.

## 4. Configuration Rules

- [x] input collection은 settings/environment를 읽지 않는다.
- [x] runtime 중간에 configuration을 삽입하거나 변경하지 않는다.
- [x] 수집된 값은 명시적 input DTO로 use case handler에 전달한다.

## 5. Logging Policy

- [x] input collector는 skill body, file content, stack trace를 로그나 notification에 노출하지 않는다.
- [x] 취소 result는 diagnostic code/message 수준만 반환한다.
- [x] Product Log/Field Debug Log persistence는 구현하지 않는다.

## 6. TDD Plan

- [x] 실패하는 presentation input collector 테스트를 먼저 작성한다.
- [x] missing create skill input이 `showInputBox` 호출로 채워지는지 검증한다.
- [x] 기존 DTO가 있는 create skill input은 prompt 없이 통과하는지 검증한다.
- [x] 취소 시 wrapped handler가 호출되지 않는지 검증한다.
- [x] activation에서 command palette createSkill 실행 시 prompt input이 use case로 전달되는지 검증한다.

## 7. Completion Report

### Summary

- [x] `collectCommandInput`과 `wrapCommandHandlersWithInputCollection`을 추가해 presentation 계층에서 command input DTO를 수집하도록 했다.
- [x] `sponzeySkills.createSkill`에 대해 missing `name`, `description`을 `showInputBox`로 수집하도록 했다.
- [x] 기존 DTO가 있는 호출은 prompt 없이 그대로 use case handler로 전달하도록 했다.
- [x] 입력 취소 시 use case handler를 호출하지 않고 typed cancelled result를 반환하도록 했다.
- [x] `activate`에서 `showInputBox`가 있는 window runtime에만 input collection wrapper를 적용하도록 했다.

### Files

- [x] `src/presentation/command-input-collector.js`를 추가했다.
- [x] `src/presentation/index.js`를 수정했다.
- [x] `src/extension.js`를 수정했다.
- [x] `test/presentation/command-input-collector.test.mjs`를 추가했다.
- [x] `test/extension-activation.test.mjs`를 수정했다.
- [x] `.tasks/task024.md`를 완료 상태로 갱신했다.

### Tests

- [x] `npm test -- test/presentation/command-input-collector.test.mjs` 통과. `3`개 테스트가 모두 통과했다.
- [x] `npm test -- test/extension-activation.test.mjs` 통과. `5`개 테스트가 모두 통과했다.
- [x] `npm test` 통과. `91`개 테스트가 모두 통과했다.
- [x] `npm run check:architecture` 통과. `23`개 source file에서 architecture violation이 없음을 확인했다.
- [x] `npm run build` 통과. architecture check와 build smoke가 모두 통과했다.

### Validated Items

- [x] command palette create skill 실행에서 `Skill name`, `Skill description` prompt가 호출된다.
- [x] prompt로 수집된 값이 `createSourceSkill` input DTO의 `skillName`, `description`, `body`로 전달된다.
- [x] 기존 input DTO가 제공된 호출은 prompt 없이 통과한다.
- [x] 입력 취소 시 wrapped handler가 호출되지 않는다.
- [x] input collector는 VSCode API를 직접 import하지 않고 `window` dependency만 사용한다.
- [x] Domain/Application 계층에 prompt, window, command palette dependency가 추가되지 않았다.

### Remaining Risks

- [x] import/apply/remove/transfer command prompt는 아직 없다.
- [x] rich multi-line editor 기반 skill body 입력은 아직 없다.
- [x] tree item context menu command input mapping은 아직 없다.
- [x] cancellation result는 현재 renderer 정책상 error notification으로 표시될 수 있다.

### Follow-Up

- [x] 후속 태스크에서 import command의 folder/name/analysis option input collection을 추가한다.
- [x] 후속 태스크에서 cancellation result rendering을 no-op 또는 warning 수준으로 조정한다.
- [x] 후속 태스크에서 tree item context value와 command input mapping을 설계한다.