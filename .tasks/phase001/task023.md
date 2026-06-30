# Task 023. Refresh Command Updates Tree Providers

## 1. Task Purpose

- [x] 이 태스크의 목적은 `sponzeySkills.refreshSkills` command 실행 결과가 등록된 tree provider cache와 change event에 반영되도록 연결하는 것이다.
- [x] 이 태스크 완료 후 사용자가 refresh command를 실행하면 tree view가 stale read model을 계속 보여주지 않아야 한다.

## 2. Scope

### Included

- [x] tree provider가 command result read model로 cache를 교체하는 method를 제공한다.
- [x] 모든 tree provider cache를 같은 read model로 갱신하는 helper를 구현한다.
- [x] `activate`에서 refresh command handler를 tree provider update wrapper로 감싼다.
- [x] refresh command result는 기존처럼 원본 그대로 반환한다.
- [x] tree provider update는 command result rendering과 충돌하지 않도록 registration 전에 조합한다.

### Excluded

- [x] 파일 watcher 기반 자동 refresh는 구현하지 않는다.
- [x] Tree item context menu command wiring은 구현하지 않는다.
- [x] VSCode input prompt는 구현하지 않는다.
- [x] OutputChannel logging은 구현하지 않는다.

## 3. Architecture Notes

- [x] Tree provider cache update는 presentation/extension boundary에서만 수행한다.
- [x] Application use case는 tree provider를 알지 못한다.
- [x] Domain/Infrastructure에는 tree view dependency를 추가하지 않는다.

## 4. Configuration Rules

- [x] refresh command 실행 중 settings를 재조회하지 않는다.
- [x] tree provider update는 activation composition에서 이미 보유한 RuntimeContext를 사용한 command result만 받는다.

## 5. Logging Policy

- [x] tree provider update는 별도 Product Log/Field Debug Log를 생성하지 않는다.
- [x] notification rendering은 기존 command result renderer 정책을 유지한다.

## 6. TDD Plan

- [x] 실패하는 provider cache replacement 테스트를 먼저 작성한다.
- [x] 실패하는 activation refresh-to-tree update 테스트를 먼저 작성한다.
- [x] provider cache 교체 후 loader 재호출 없이 새 read model이 반환되는지 검증한다.
- [x] refresh command 후 tree provider가 command result read model을 표시하고 command result를 보존하는지 검증한다.

## 7. Completion Report

### Summary

- [x] tree provider에 `setReadModel(readModel)`을 추가해 command result read model로 cache를 교체할 수 있게 했다.
- [x] `refreshSponzeyTreeDataProviders({ providers, readModel })` helper를 추가해 모든 tree provider cache를 같은 read model로 갱신하도록 했다.
- [x] `activate`에서 tree provider 생성 후 refresh command handler를 tree update wrapper로 감싸도록 조합 순서를 정리했다.
- [x] command result rendering wrapper는 tree update wrapper 이후에 적용되어 기존 notification 정책을 유지한다.

### Files

- [x] `src/presentation/tree-data-provider.js`를 수정했다.
- [x] `src/presentation/index.js`를 수정했다.
- [x] `src/extension.js`를 수정했다.
- [x] `test/presentation/tree-data-provider.test.mjs`를 수정했다.
- [x] `test/extension-activation.test.mjs`를 수정했다.
- [x] `.tasks/task023.md`를 완료 상태로 갱신했다.

### Tests

- [x] `npm test -- test/presentation/tree-data-provider.test.mjs` 통과. `6`개 테스트가 모두 통과했다.
- [x] `npm test -- test/extension-activation.test.mjs` 통과. `4`개 테스트가 모두 통과했다.
- [x] `npm test` 통과. `87`개 테스트가 모두 통과했다.
- [x] `npm run check:architecture` 통과. `22`개 source file에서 architecture violation이 없음을 확인했다.
- [x] `npm run build` 통과. architecture check와 build smoke가 모두 통과했다.

### Validated Items

- [x] provider `setReadModel()` 호출 후 loader 재호출 없이 새 source skill item을 반환한다.
- [x] 모든 tree provider cache가 동일한 refresh result read model로 갱신된다.
- [x] refresh command 실행 후 Main Repository provider가 stale `alpha` 대신 새 `beta` item을 표시한다.
- [x] refresh command result는 wrapper 이후에도 `ok: true` 형태로 보존된다.
- [x] refresh command 실행 중 settings를 재조회하지 않고 기존 composition context를 사용한다.

### Remaining Risks

- [x] 파일 watcher 기반 자동 refresh는 아직 없다.
- [x] Tree item context menu command wiring은 아직 없다.
- [x] VSCode input prompt는 아직 없다.
- [x] OutputChannel logging은 아직 없다.

### Follow-Up

- [x] 후속 태스크에서 tree item에 command input DTO를 담기 위한 context/value mapping을 설계한다.
- [x] 후속 태스크에서 사용자 입력이 필요한 command의 prompt/input boundary를 presentation 계층에 추가한다.
