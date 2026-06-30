# Task 027. Source Mutation Commands Refresh Tree Providers

## 1. Task Purpose

- [x] 이 태스크의 목적은 `createSkill` 또는 `importSkill` 성공 후 등록된 tree provider가 stale read model을 계속 보여주는 문제를 제거하는 것이다.
- [x] 이 태스크 완료 후 source repository를 변경하는 command가 성공하면 tree provider cache가 refresh read model로 갱신되어야 한다.

## 2. Scope

### Included

- [x] `sponzeySkills.createSkill` 성공 후 refresh command를 실행해 tree provider cache를 갱신한다.
- [x] `sponzeySkills.importSkill` 성공 후 refresh command를 실행해 tree provider cache를 갱신한다.
- [x] mutating command result는 원본 그대로 반환한다.
- [x] mutation 실패 또는 취소 시 tree refresh를 실행하지 않는다.
- [x] refresh는 기존 RuntimeContext와 command handler composition을 사용하고 settings를 재조회하지 않는다.

### Excluded

- [x] apply/remove/transfer 후 tree refresh는 구현하지 않는다.
- [x] 파일 watcher 기반 자동 refresh는 구현하지 않는다.
- [x] tree item context menu command input mapping은 구현하지 않는다.
- [x] OutputChannel logging은 구현하지 않는다.

## 3. Architecture Notes

- [x] Tree refresh orchestration은 extension boundary에 둔다.
- [x] Application use case는 tree provider를 알지 못한다.
- [x] Domain/Infrastructure에는 tree view dependency를 추가하지 않는다.

## 4. Configuration Rules

- [x] source mutation 후 refresh 과정에서 settings를 재조회하지 않는다.
- [x] activation에서 만들어진 composition과 RuntimeContext를 재사용한다.

## 5. Logging Policy

- [x] source mutation 후 자동 tree refresh는 별도 Product Log/Field Debug Log를 생성하지 않는다.
- [x] 사용자 notification은 mutating command result renderer 정책만 따른다.

## 6. TDD Plan

- [x] 실패하는 activation 테스트를 먼저 작성한다.
- [x] createSkill 성공 후 tree provider가 새 source list를 표시하는지 검증한다.
- [x] importSkill 성공 후 tree provider가 새 source list를 표시하는지 검증한다.
- [x] create/import result가 refresh result로 대체되지 않는지 검증한다.

## 7. Completion Report

### Summary

- [x] `wrapSourceMutationHandlersWithTreeRefresh`를 추가해 source mutation command 성공 후 refresh handler를 실행하도록 했다.
- [x] 대상 command는 `sponzeySkills.createSkill`, `sponzeySkills.importSkill`로 제한했다.
- [x] refresh handler는 기존 tree provider update wrapper를 거치므로 모든 registered provider cache가 갱신된다.
- [x] create/import command result는 refresh result로 대체하지 않고 원본 그대로 반환한다.

### Files

- [x] `src/extension.js`를 수정했다.
- [x] `test/extension-activation.test.mjs`를 수정했다.
- [x] `.tasks/task027.md`를 완료 상태로 갱신했다.

### Tests

- [x] `npm test -- test/extension-activation.test.mjs` 통과. `7`개 테스트가 모두 통과했다.
- [x] `npm test` 통과. `98`개 테스트가 모두 통과했다.
- [x] `npm run check:architecture` 통과. `23`개 source file에서 architecture violation이 없음을 확인했다.
- [x] `npm run build` 통과. architecture check와 build smoke가 모두 통과했다.

### Validated Items

- [x] initial tree cache가 `alpha`만 가진 상태에서 `createSkill` 성공 후 `alpha`, `beta`를 표시한다.
- [x] 이어서 `importSkill` 성공 후 `alpha`, `beta`, `gamma`를 표시한다.
- [x] create result가 refresh result로 대체되지 않고 `source.name === "beta"`를 유지한다.
- [x] import result가 refresh result로 대체되지 않고 `source.name === "gamma"`를 유지한다.
- [x] source mutation 후 refresh는 activation composition과 기존 RuntimeContext를 재사용한다.

### Remaining Risks

- [x] apply/remove/transfer 후 tree refresh는 아직 없다.
- [x] 파일 watcher 기반 자동 refresh는 아직 없다.
- [x] tree item context menu command input mapping은 아직 없다.
- [x] source mutation 후 내부 refresh 실패를 사용자에게 별도로 표시하지 않는다.

### Follow-Up

- [x] 후속 태스크에서 apply/remove/transfer 성공 후 tree provider cache 갱신을 추가한다.
- [x] 후속 태스크에서 apply command의 source/target/apply mode input collection을 설계한다.