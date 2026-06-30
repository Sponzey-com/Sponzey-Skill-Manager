# Task 020. Activation Command Result Renderer Wiring

## 1. Task Purpose

- [x] 이 태스크의 목적은 `activate`에서 등록되는 command handler가 command result renderer를 통과하도록 연결하는 것이다.
- [x] 이 태스크 완료 후 VSCode `window` API가 존재하는 runtime에서는 command 실행 결과가 최소 notification으로 표시되어야 한다.

## 2. Scope

### Included

- [x] `activate(context, runtime)`에서 `vscodeApi.window` 또는 injected `runtime.window`를 renderer dependency로 사용한다.
- [x] command registration 전에 모든 command handler를 `wrapCommandHandlerWithResultRendering`으로 감싼다.
- [x] renderer window가 없는 runtime에서는 기존처럼 원본 handler를 등록한다.
- [x] command handler result가 wrapper 이후에도 원본 그대로 반환되는지 검증한다.

### Excluded

- [x] VSCode prompt/input collection은 구현하지 않는다.
- [x] TreeDataProvider runtime class는 구현하지 않는다.
- [x] OutputChannel, Field Debug Log persistence, 상세 로그 보존은 구현하지 않는다.
- [x] analyzer dependency 기본 wiring은 구현하지 않는다.

## 3. Architecture Notes

- [x] 변경 계층은 extension composition boundary와 presentation export 사용에 한정한다.
- [x] Domain/Application/Infrastructure 계층에는 VSCode notification dependency를 추가하지 않는다.
- [x] `window` dependency는 `activate`에서만 수신하고 presentation renderer에 명시적으로 전달한다.

## 4. Logging Policy

- [x] notification은 renderer 정책을 그대로 따른다.
- [x] Product Log event 전체 payload를 UI에 노출하지 않는다.
- [x] Field Debug Log payload, skill body, file content, stack trace를 notification에 표시하지 않는다.

## 5. TDD Plan

- [x] 실패하는 activation 테스트를 먼저 작성한다.
- [x] fake `vscodeApi.window.showInformationMessage`가 refresh command 실행 후 호출되는지 검증한다.
- [x] 등록 handler가 wrapper 이후에도 use case result를 반환하는지 검증한다.
- [x] window가 없는 runtime에서 기존 registration behavior가 유지되는지 기존 테스트로 검증한다.

## 6. Completion Report

### Summary

- [x] `activate`에서 renderer window dependency를 `runtime.window` 또는 `vscodeApi.window`에서 선택하도록 구현했다.
- [x] window가 information/warning/error message API를 모두 제공할 때만 command handler wrapper를 적용하도록 제한했다.
- [x] command registration 전에 handler map 전체를 `wrapCommandHandlerWithResultRendering`으로 감싸도록 연결했다.
- [x] window가 없는 runtime에서는 기존 원본 handler registration을 유지했다.

### Files

- [x] `src/extension.js`를 수정했다.
- [x] `test/extension-activation.test.mjs`를 수정했다.
- [x] `.tasks/task020.md`를 완료 상태로 갱신했다.

### Tests

- [x] `npm test -- test/extension-activation.test.mjs` 통과. `2`개 테스트가 모두 통과했다.
- [x] `npm test` 통과. `77`개 테스트가 모두 통과했다.
- [x] `npm run check:architecture` 통과. `20`개 source file에서 architecture violation이 없음을 확인했다.
- [x] `npm run build` 통과. architecture check와 build smoke가 모두 통과했다.

### Validated Items

- [x] refresh command 실행 후 `Sponzey Skills: skills.refresh.completed` information notification이 표시된다.
- [x] wrapper 이후에도 refresh use case result가 원본 형태로 반환된다.
- [x] settings는 activation 중 한 번만 읽히고 command 실행 중 재조회되지 않는다.
- [x] Domain/Application/Infrastructure에 VSCode notification dependency가 추가되지 않았다.

### Remaining Risks

- [x] VSCode prompt/input collection은 아직 없다.
- [x] 실제 TreeDataProvider runtime class는 아직 없다.
- [x] analyzer dependency는 activation runtime에서 주입되지 않으면 import/apply command가 not-wired 상태로 남는다.
- [x] OutputChannel 기반 상세 진단과 Field Debug Log persistence는 아직 없다.

### Follow-Up

- [x] 후속 태스크에서 사용자 입력이 필요한 command의 input DTO collection boundary를 presentation 계층에 추가한다.
- [x] 후속 태스크에서 TreeDataProvider runtime class를 구현해 refresh read model을 VSCode view에 연결한다.
