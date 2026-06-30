# Task 028. Target And Transfer Commands Refresh Tree Providers

## 1. Task Purpose

- [x] 이 태스크의 목적은 apply/remove/transfer 성공 후 등록된 tree provider가 stale read model을 계속 보여주는 문제를 제거하는 것이다.
- [x] 이 태스크 완료 후 target 또는 main repository read model을 바꾸는 command가 성공하면 tree provider cache가 refresh read model로 갱신되어야 한다.

## 2. Scope

### Included

- [x] `sponzeySkills.applySkillToGlobalTarget` 성공 후 tree provider cache를 갱신한다.
- [x] `sponzeySkills.applySkillToProjectTarget` 성공 후 tree provider cache를 갱신한다.
- [x] `sponzeySkills.removeAppliedSkill` 성공 후 tree provider cache를 갱신한다.
- [x] `sponzeySkills.copyAppliedSkillToMainRepository` 성공 후 tree provider cache를 갱신한다.
- [x] `sponzeySkills.backupAppliedSkillToMainRepository` 성공 후 tree provider cache를 갱신한다.
- [x] `sponzeySkills.moveAppliedSkillToMainRepository` 성공 후 tree provider cache를 갱신한다.
- [x] mutating command result는 원본 그대로 반환한다.
- [x] mutation 실패 또는 취소 시 tree refresh를 실행하지 않는다.

### Excluded

- [x] apply/remove/transfer command prompt는 구현하지 않는다.
- [x] tree item context menu command input mapping은 구현하지 않는다.
- [x] 파일 watcher 기반 자동 refresh는 구현하지 않는다.
- [x] backup snapshot list view는 구현하지 않는다.

## 3. Architecture Notes

- [x] Tree refresh orchestration은 extension boundary에 둔다.
- [x] Application use case는 tree provider를 알지 못한다.
- [x] Domain/Infrastructure에는 tree view dependency를 추가하지 않는다.
- [x] refresh 대상 command 목록은 extension boundary에서 명시적으로 관리한다.

## 4. Configuration Rules

- [x] mutation 후 refresh 과정에서 settings를 재조회하지 않는다.
- [x] activation에서 만들어진 composition과 RuntimeContext를 재사용한다.

## 5. Logging Policy

- [x] mutation 후 자동 tree refresh는 별도 Product Log/Field Debug Log를 생성하지 않는다.
- [x] 사용자 notification은 원래 mutating command result renderer 정책만 따른다.

## 6. TDD Plan

- [x] 실패하는 activation 테스트를 먼저 작성한다.
- [x] apply 성공 후 Global Skills provider가 applied skill을 표시하는지 검증한다.
- [x] remove 성공 후 Global Skills provider에서 applied skill이 사라지는지 검증한다.
- [x] copy transfer 성공 후 Main Repository provider가 copied source를 표시하는지 검증한다.
- [x] command result가 refresh result로 대체되지 않는지 검증한다.

## 7. Completion Report

### Summary

- [x] `wrapSourceMutationHandlersWithTreeRefresh`를 `wrapMutationHandlersWithTreeRefresh`로 일반화했다.
- [x] tree refresh 대상 command 목록에 apply/remove/copy/backup/move transfer command를 추가했다.
- [x] apply 성공 후 Global Skills provider cache가 applied skill을 표시하도록 갱신되는지 검증했다.
- [x] remove 성공 후 Global Skills provider cache에서 applied skill이 사라지는지 검증했다.
- [x] copy transfer 성공 후 Main Repository provider cache가 copied source를 표시하도록 갱신되는지 검증했다.

### Files

- [x] `src/extension.js`를 수정했다.
- [x] `test/extension-activation.test.mjs`를 수정했다.
- [x] `.tasks/task028.md`를 완료 상태로 갱신했다.

### Tests

- [x] `npm test -- test/extension-activation.test.mjs` 통과. `8`개 테스트가 모두 통과했다.
- [x] `npm test` 통과. `99`개 테스트가 모두 통과했다.
- [x] `npm run check:architecture` 통과. `23`개 source file에서 architecture violation이 없음을 확인했다.
- [x] `npm run build` 통과. architecture check와 build smoke가 모두 통과했다.

### Validated Items

- [x] apply 성공 후 Global Skills provider가 `alpha` applied skill을 표시한다.
- [x] remove 성공 후 Global Skills provider에서 `alpha` applied skill이 사라진다.
- [x] copy transfer 성공 후 Main Repository provider가 `external` source를 표시한다.
- [x] apply/remove/copy transfer result가 refresh result로 대체되지 않는다.
- [x] mutation 후 refresh 과정에서 VSCode settings를 재조회하지 않는다.
- [x] Domain/Application/Infrastructure에 tree provider dependency가 추가되지 않았다.

### Remaining Risks

- [x] apply/remove/transfer command prompt는 아직 없다.
- [x] tree item context menu command input mapping은 아직 없다.
- [x] 파일 watcher 기반 자동 refresh는 아직 없다.
- [x] backup snapshot list view는 아직 없다.
- [x] source mutation 후 내부 refresh 실패를 사용자에게 별도로 표시하지 않는다.

### Follow-Up

- [x] 후속 태스크에서 apply command의 source/target/apply mode input collection을 설계한다.
- [x] 후속 태스크에서 tree item context value와 command input mapping을 설계한다.
