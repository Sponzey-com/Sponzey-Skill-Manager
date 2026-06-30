# Task 026. Import Skill Command Input Collection

## 1. Task Purpose

- [x] 이 태스크의 목적은 command palette에서 `sponzeySkills.importSkill`을 실행할 때 필요한 input DTO를 presentation 계층에서 수집하는 것이다.
- [x] 이 태스크 완료 후 사용자는 command palette만으로 external skill folder를 선택하고 Main Repository로 import할 수 있어야 한다.

## 2. Scope

### Included

- [x] `sponzeySkills.importSkill`에 대해 missing `externalSourcePath`를 `showOpenDialog`로 수집한다.
- [x] missing `name`을 `showInputBox`로 수집하되 folder basename을 기본값으로 제공한다.
- [x] missing `runAnalysisAfterImport`를 `showQuickPick`으로 수집한다.
- [x] 이미 input DTO가 제공된 호출은 prompt 없이 그대로 통과시킨다.
- [x] input collection 취소 시 use case handler를 호출하지 않고 typed cancelled result를 반환한다.
- [x] activation에서 command palette importSkill 실행 시 prompt input이 use case로 전달되는지 검증한다.

### Excluded

- [x] apply/remove/transfer command prompt는 구현하지 않는다.
- [x] duplicate name overwrite prompt는 구현하지 않는다.
- [x] import 후 tree refresh 자동 갱신은 구현하지 않는다.
- [x] rich folder validation UI는 구현하지 않는다.

## 3. Architecture Notes

- [x] 변경 계층은 presentation과 extension activation 테스트에 한정한다.
- [x] input collector는 VSCode API를 import하지 않고 `window` dependency를 명시적으로 받는다.
- [x] folder path parsing은 DTO 기본값 산출에만 사용하고 파일시스템 접근은 수행하지 않는다.
- [x] Domain/Application에는 prompt, window, command palette dependency를 추가하지 않는다.

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
- [x] missing import input이 folder/name/analysis prompt로 채워지는지 검증한다.
- [x] 기존 DTO가 있는 import input은 prompt 없이 통과하는지 검증한다.
- [x] folder 선택 취소 시 wrapped handler가 호출되지 않는지 검증한다.
- [x] activation에서 command palette importSkill 실행 시 prompt input이 import use case로 전달되는지 검증한다.

## 7. Completion Report

### Summary

- [x] `collectCommandInput`에 `sponzeySkills.importSkill` 수집 흐름을 추가했다.
- [x] missing `externalSourcePath`는 folder-only `showOpenDialog`로 수집한다.
- [x] missing `name`은 selected folder basename을 기본값으로 둔 `showInputBox`로 수집한다.
- [x] missing `runAnalysisAfterImport`는 `Run analysis`/`Skip analysis` quick pick으로 수집한다.
- [x] 기존 import DTO가 있는 호출은 prompt 없이 그대로 통과하도록 했다.
- [x] folder 선택 취소 시 use case handler를 호출하지 않고 cancelled result를 반환하도록 했다.

### Files

- [x] `src/presentation/command-input-collector.js`를 수정했다.
- [x] `test/presentation/command-input-collector.test.mjs`를 수정했다.
- [x] `test/extension-activation.test.mjs`를 수정했다.
- [x] `.tasks/task026.md`를 완료 상태로 갱신했다.

### Tests

- [x] `npm test -- test/presentation/command-input-collector.test.mjs` 통과. `6`개 테스트가 모두 통과했다.
- [x] `npm test -- test/extension-activation.test.mjs` 통과. `6`개 테스트가 모두 통과했다.
- [x] `npm test` 통과. `97`개 테스트가 모두 통과했다.
- [x] `npm run check:architecture` 통과. `23`개 source file에서 architecture violation이 없음을 확인했다.
- [x] `npm run build` 통과. architecture check와 build smoke가 모두 통과했다.

### Validated Items

- [x] command palette import skill 실행에서 folder dialog, name input, analysis quick pick이 순서대로 호출된다.
- [x] folder basename이 name input 기본값으로 전달된다.
- [x] prompt로 수집된 값이 import use case의 `externalSourcePath`, `skillName`, `runAnalysisAfterImport`로 전달된다.
- [x] `Run analysis` 선택 시 기본 analyzer가 import 결과를 분석하고 low risk analysis를 반환한다.
- [x] 기존 import DTO가 제공된 호출은 prompt 없이 통과한다.
- [x] folder 선택 취소 시 wrapped handler가 호출되지 않는다.
- [x] input collector는 VSCode API를 직접 import하지 않고 `window` dependency만 사용한다.

### Remaining Risks

- [x] apply/remove/transfer command prompt는 아직 없다.
- [x] import 후 tree refresh 자동 갱신은 아직 없다.
- [x] duplicate name overwrite prompt는 아직 없다.
- [x] tree item context menu command input mapping은 아직 없다.

### Follow-Up

- [x] 후속 태스크에서 import/create 성공 후 tree provider cache를 refresh하는 wrapper를 추가한다.
- [x] 후속 태스크에서 apply command의 source/target/apply mode input collection을 설계한다.
