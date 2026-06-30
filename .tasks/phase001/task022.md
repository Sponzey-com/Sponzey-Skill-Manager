# Task 022. VSCode Tree Data Provider Runtime

## 1. Task Purpose

- [x] 이 태스크의 목적은 refresh read model을 VSCode TreeDataProvider 형태로 제공해 Main Repository, Global Skills, Project Skills, Diagnostics view를 실제 runtime에 연결하는 것이다.
- [x] 이 태스크 완료 후 VSCode `window.registerTreeDataProvider`가 존재하는 runtime에서는 package에 선언된 모든 tree view가 provider를 등록해야 한다.

## 2. Scope

### Included

- [x] view id별 tree provider를 생성하는 presentation helper를 구현한다.
- [x] provider가 read model을 load/cache하고 `getChildren`, `getTreeItem`, `refresh`를 제공하도록 구현한다.
- [x] `registerSponzeyTreeDataProviders({ windowApi, providers })`를 구현한다.
- [x] `activate`에서 tree provider를 생성하고 VSCode window에 등록한다.
- [x] provider refresh가 cache를 무효화하고 tree change event를 fire하는지 검증한다.

### Excluded

- [x] Tree item context menu command wiring은 구현하지 않는다.
- [x] refresh command와 tree provider invalidation 연결은 구현하지 않는다.
- [x] VSCode input prompt는 구현하지 않는다.
- [x] custom icon/theme rendering은 구현하지 않는다.

## 3. Architecture Notes

- [x] Tree provider는 presentation 계층에 둔다.
- [x] Tree provider는 VSCode API를 import하지 않고 `windowApi`와 event emitter dependency를 명시적으로 받는다.
- [x] Tree provider는 read model을 표시만 하며 domain/application policy를 구현하지 않는다.
- [x] 파일시스템 접근은 provider 안에 추가하지 않는다.

## 4. Configuration Rules

- [x] Tree provider는 설정을 직접 읽지 않는다.
- [x] read model loader는 activation composition에서 전달받는다.
- [x] provider refresh는 RuntimeContext를 재생성하지 않는다.

## 5. Logging Policy

- [x] Tree provider는 Product Log/Field Debug Log를 생성하지 않는다.
- [x] provider는 diagnostic code/message만 tree item detail로 표시한다.
- [x] skill body, file content, stack trace를 tree item에 표시하지 않는다.

## 6. TDD Plan

- [x] 실패하는 presentation provider 테스트를 먼저 작성한다.
- [x] Main Repository view가 source skill children을 반환하는지 검증한다.
- [x] Global Skills view가 target group과 applied skill children을 반환하는지 검증한다.
- [x] provider refresh가 cache를 무효화하고 event를 fire하는지 검증한다.
- [x] activation이 모든 tree view provider를 등록하는지 검증한다.

## 7. Completion Report

### Summary

- [x] `createSkillsTreeDataProvider`와 `createSkillsTreeDataProviders`를 추가해 view id별 TreeDataProvider를 생성하도록 했다.
- [x] provider가 read model을 cache하고, `refresh()` 호출 시 cache 무효화와 change event fire를 수행하도록 했다.
- [x] `registerSponzeyTreeDataProviders`를 추가해 package에 선언된 모든 tree view provider를 등록하도록 했다.
- [x] `activate`에서 VSCode `window.registerTreeDataProvider`가 존재할 때 tree provider를 등록하도록 연결했다.
- [x] tree read model loader는 composition의 refresh handler 결과 또는 composition diagnostics만 사용하도록 제한했다.

### Files

- [x] `src/presentation/tree-data-provider.js`를 추가했다.
- [x] `src/presentation/index.js`를 수정했다.
- [x] `src/extension.js`를 수정했다.
- [x] `test/presentation/tree-data-provider.test.mjs`를 추가했다.
- [x] `test/extension-activation.test.mjs`를 수정했다.
- [x] `.tasks/task022.md`를 완료 상태로 갱신했다.

### Tests

- [x] `npm test -- test/presentation/tree-data-provider.test.mjs` 통과. `4`개 테스트가 모두 통과했다.
- [x] `npm test -- test/extension-activation.test.mjs` 통과. `3`개 테스트가 모두 통과했다.
- [x] `npm test` 통과. `84`개 테스트가 모두 통과했다.
- [x] `npm run check:architecture` 통과. `22`개 source file에서 architecture violation이 없음을 확인했다.
- [x] `npm run build` 통과. architecture check와 build smoke가 모두 통과했다.

### Validated Items

- [x] Main Repository view provider가 source skill item을 반환한다.
- [x] Global Skills view provider가 target group과 applied skill child item을 반환한다.
- [x] provider cache가 두 번째 `getChildren()` 호출에서 재사용된다.
- [x] provider `refresh()`가 cache를 무효화하고 event를 fire한다.
- [x] activation이 package에 선언된 모든 tree view id를 등록한다.
- [x] provider와 registration helper가 VSCode API를 직접 import하지 않는다.

### Remaining Risks

- [x] refresh command 실행 후 tree provider cache를 자동 invalidation하는 연결은 아직 없다.
- [x] Tree item context menu command wiring은 아직 없다.
- [x] VSCode input prompt는 아직 없다.
- [x] custom icon/theme rendering은 아직 없다.

### Follow-Up

- [x] 후속 태스크에서 refresh command와 tree provider refresh를 연결한다.
- [x] 후속 태스크에서 tree item 기반 command input DTO 전달을 설계한다.
- [x] 후속 태스크에서 사용자 입력이 필요한 command의 prompt/input boundary를 presentation 계층에 추가한다.
