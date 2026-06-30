# Task 029. Apply Skill Command Input Collection

## 1. Task Purpose

- [x] 이 태스크의 목적은 command palette에서 `applySkillToGlobalTarget` 또는 `applySkillToProjectTarget` 실행 시 필요한 source, target, apply mode input DTO를 presentation 계층에서 수집하는 것이다.
- [x] 이 태스크 완료 후 사용자는 command palette만으로 Main Repository source skill을 global/project target에 copy 또는 symlink 방식으로 적용할 수 있어야 한다.

## 2. Scope

### Included

- [x] `collectCommandInput`이 `sponzeySkills.applySkillToGlobalTarget` input을 수집한다.
- [x] `collectCommandInput`이 `sponzeySkills.applySkillToProjectTarget` input을 수집한다.
- [x] missing source는 read model의 `mainRepositorySkills`를 quick pick으로 표시해 수집한다.
- [x] missing target은 global/project read model group을 quick pick으로 표시해 수집한다.
- [x] missing apply mode는 `copy`/`symlink` quick pick으로 수집한다.
- [x] 이미 input DTO가 제공된 호출은 prompt 없이 그대로 통과시킨다.
- [x] input collection 취소 시 use case handler를 호출하지 않고 typed cancelled result를 반환한다.
- [x] activation에서 command palette apply 실행 시 prompt input이 apply use case로 전달되는지 검증한다.

### Excluded

- [x] high risk confirmation prompt는 구현하지 않는다.
- [x] remove/transfer command prompt는 구현하지 않는다.
- [x] tree item context menu command input mapping은 구현하지 않는다.
- [x] apply conflict overwrite prompt는 구현하지 않는다.

## 3. Architecture Notes

- [x] 변경 계층은 presentation과 extension boundary에 한정한다.
- [x] input collector는 VSCode API를 import하지 않고 `window` dependency와 `loadReadModel` dependency를 명시적으로 받는다.
- [x] input collector는 read model을 표시용 선택지로 변환하고 domain policy를 구현하지 않는다.
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
- [x] missing global apply input이 source/target/mode quick pick으로 채워지는지 검증한다.
- [x] 기존 apply DTO가 있는 호출은 prompt와 read model load 없이 통과하는지 검증한다.
- [x] source 선택 취소 시 wrapped handler가 호출되지 않는지 검증한다.
- [x] activation에서 command palette global apply 실행 시 prompt input이 apply use case로 전달되는지 검증한다.

## 7. Completion Report

### Summary

- [x] `collectCommandInput`에 global/project apply command input 수집 흐름을 추가했다.
- [x] missing source는 read model의 `mainRepositorySkills`를 quick pick 선택지로 변환해 수집한다.
- [x] missing target은 command scope에 맞는 `globalSkills` 또는 `projectSkills` group을 quick pick 선택지로 변환해 수집한다.
- [x] missing apply mode는 `copy`/`symlink` quick pick으로 수집한다.
- [x] `wrapCommandHandlersWithInputCollection`이 activation composition에서 받은 `loadReadModel` dependency를 collector에 전달하도록 했다.
- [x] 기존 apply DTO가 있는 호출은 prompt와 read model load 없이 통과하도록 했다.

### Files

- [x] `src/presentation/command-input-collector.js`를 수정했다.
- [x] `src/extension.js`를 수정했다.
- [x] `test/presentation/command-input-collector.test.mjs`를 수정했다.
- [x] `test/extension-activation.test.mjs`를 수정했다.
- [x] `.tasks/task029.md`를 완료 상태로 갱신했다.

### Tests

- [x] `npm test -- test/presentation/command-input-collector.test.mjs` 통과. `9`개 테스트가 모두 통과했다.
- [x] `npm test -- test/extension-activation.test.mjs` 통과. `9`개 테스트가 모두 통과했다.
- [x] `npm test` 통과. `103`개 테스트가 모두 통과했다.
- [x] `npm run check:architecture` 통과. `23`개 source file에서 architecture violation이 없음을 확인했다.
- [x] `npm run build` 통과. architecture check와 build smoke가 모두 통과했다.

### Validated Items

- [x] global apply command에서 source skill, global target, apply mode quick pick이 순서대로 호출된다.
- [x] prompt 결과가 `applySkillToTarget` input DTO의 `source`, `target`, `applyMode`로 전달된다.
- [x] `copy` 선택 시 target store의 `copySkillToTarget`에 expected metadata가 전달된다.
- [x] 기존 apply DTO가 제공된 호출은 read model loader를 호출하지 않는다.
- [x] source 선택 취소 시 wrapped handler가 호출되지 않는다.
- [x] input collector는 VSCode API를 직접 import하지 않고 `window`와 `loadReadModel` dependency만 사용한다.

### Remaining Risks

- [x] high risk confirmation prompt는 아직 없다.
- [x] remove/transfer command prompt는 아직 없다.
- [x] tree item context menu command input mapping은 아직 없다.
- [x] apply conflict overwrite prompt는 아직 없다.

### Follow-Up

- [x] 후속 태스크에서 high risk apply confirmation prompt를 추가한다.
- [x] 후속 태스크에서 remove command input collection 또는 tree item context command mapping을 설계한다.
