# Task 032. Tree Item Command Payload And Context Menus

## 1. Task Purpose

- [x] 이 태스크의 목적은 tree view 항목이 command 실행에 필요한 명시적 DTO payload를 포함하도록 만들고, VSCode tree item context menu에서 주요 명령을 실행할 수 있게 하는 것이다.
- [x] 이 태스크 완료 후 사용자는 tree view에서 source skill 또는 applied skill을 선택해 apply/remove/transfer 명령을 실행할 수 있어야 한다.

## 2. Scope

### Included

- [x] main repository source tree item에 `source` DTO payload를 포함한다.
- [x] target group tree item에 `target` DTO payload를 포함한다.
- [x] applied skill tree item에 `target`과 `appliedSkill` DTO payload를 포함한다.
- [x] tree item에 VSCode context menu용 `contextValue`를 포함한다.
- [x] tree data provider가 `contextValue`를 VSCode tree item으로 노출한다.
- [x] `package.json`에 source tree item apply context menu를 추가한다.
- [x] `package.json`에 global/project applied skill remove/copy/backup/move context menu를 추가한다.
- [x] context menu로 전달된 tree item payload가 기존 command input collector와 호환되는지 검증한다.

### Excluded

- [x] inline button icon UX는 구현하지 않는다.
- [x] drag and drop apply UX는 구현하지 않는다.
- [x] multi-select bulk operation은 구현하지 않는다.
- [x] context menu 명령별 추가 confirmation UX 개선은 구현하지 않는다.

## 3. Architecture Notes

- [x] 변경 계층은 presentation tree model/provider와 VSCode contribution manifest에 한정한다.
- [x] tree item은 표시 정보와 command DTO payload만 가진다.
- [x] tree item은 파일시스템, 설정, use case, adapter를 직접 호출하지 않는다.
- [x] command input collector는 tree item payload를 일반 input DTO로 처리한다.
- [x] Domain/Application에는 tree view 또는 VSCode context menu dependency를 추가하지 않는다.

## 4. Configuration Rules

- [x] tree item mapping은 settings/environment를 직접 읽지 않는다.
- [x] context menu contribution은 정적 manifest로만 선언한다.
- [x] 런타임 중간에 환경 값을 조회하거나 변경하지 않는다.

## 5. Logging Policy

- [x] tree item payload에는 skill body, file content, stack trace를 포함하지 않는다.
- [x] context menu mapping은 로그를 생성하지 않는다.
- [x] 실패/취소 로그는 기존 command result 흐름을 따른다.

## 6. TDD Plan

- [x] 실패하는 tree view model 테스트를 먼저 작성한다.
- [x] source item이 `source` payload와 `sponzeySkillSource` context value를 가지는지 검증한다.
- [x] target item이 `target` payload와 `sponzeySkillTarget` context value를 가지는지 검증한다.
- [x] applied skill item이 `target`, `appliedSkill`, `sponzeyAppliedSkill` context value를 가지는지 검증한다.
- [x] tree data provider가 `contextValue`를 VSCode tree item으로 반환하는지 검증한다.
- [x] package context menu contribution이 expected command/when/group 목록과 일치하는지 검증한다.
- [x] tree item payload가 command input collector에서 추가 target/applied prompt 없이 사용되는지 검증한다.

## 7. Completion Report

### Summary

- source tree item에 `source` payload와 `sponzeySkillSource` context value를 추가했다.
- target group tree item에 `target` payload와 `sponzeySkillTarget` context value를 추가했다.
- applied skill tree item에 `target`, `appliedSkill` payload와 `sponzeyAppliedSkill` context value를 추가했다.
- tree data provider가 `contextValue`를 VSCode TreeItem에 전달하도록 했다.
- `package.json`에 source apply, applied skill remove/copy/backup/move context menu contribution을 추가했다.
- applied skill tree item payload가 command input collector에서 추가 target/applied prompt 없이 사용되는지 검증했다.

### Changed Files

- `src/presentation/tree-view-model.js`
- `src/presentation/tree-data-provider.js`
- `package.json`
- `test/presentation/tree-view-model.test.mjs`
- `test/presentation/tree-data-provider.test.mjs`
- `test/presentation/command-input-collector.test.mjs`
- `.tasks/task032.md`

### Test Results

- `npm test -- test/presentation/tree-view-model.test.mjs`: 4 tests passed.
- `npm test -- test/presentation/tree-data-provider.test.mjs`: 6 tests passed.
- `npm test -- test/presentation/command-input-collector.test.mjs`: 18 tests passed.
- `npm test`: 116 tests passed.
- `npm run check:architecture`: architecture ok, 23 source files checked.
- `npm run build`: architecture ok, build smoke ok.

### Verified Items

- tree item payload는 source/target/appliedSkill DTO만 포함하고 skill body나 파일 내용은 포함하지 않는다.
- context menu contribution은 정적 manifest에만 선언되어 런타임 설정 조회를 추가하지 않는다.
- tree provider는 VSCode API에 전달할 표시 정보와 `contextValue`만 노출한다.
- Domain/Application 계층에는 tree view 또는 VSCode context menu 의존성을 추가하지 않았다.
- context menu에서 전달되는 applied skill tree item은 transfer command input으로 그대로 사용할 수 있다.

### Remaining Risks

- 실제 VSCode UI에서 context menu 노출 순서와 when clause 동작은 extension host smoke가 필요하다.
- source tree item apply 명령은 source payload만 제공하므로 target과 apply mode prompt는 계속 필요하다.
- applied skill tree item의 remove 명령은 managed skill 정책을 그대로 따른다. external skill 제거 confirmation UX는 아직 없다.

### Follow-up Tasks

- VSCode extension host 또는 packaging smoke로 context menu contribution을 검증한다.
- empty target/applied skill quick pick에 대한 unavailable result 처리를 설계한다.
- source tree item apply 명령에 기본 apply mode 설정을 어떻게 연결할지 검토한다.

- [x] 수행한 변경 사항을 요약한다.
- [x] 생성하거나 수정한 파일을 기록한다.
- [x] 실행한 테스트 명령과 결과를 기록한다.
- [x] 검증한 항목을 기록한다.
- [x] 남은 위험 요소를 기록한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
