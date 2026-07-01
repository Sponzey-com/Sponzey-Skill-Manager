# Task 015. Watcher Refresh Failure Recovery And Log Separation

## 1. Task Purpose

- [x] watcher invalidation refresh가 실패해도 controller state가 `Idle`로 복구되도록 한다.
- [x] refresh 실패를 Product Log로 기록하고 debounce/event detail은 Field Debug Log로 유지한다.
- [x] extension watcher refresh callback이 refresh use case result를 controller에 반환하도록 한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.6의 refresh state failure handling과 logging policy 범위를 수행한다.
- [x] 완료 후 watcher refresh 실패는 중복 watcher나 멈춘 state를 만들지 않고 다음 watcher event를 처리할 수 있어야 한다.

## 2. Current Context

- [x] `createRefreshInvalidationController`는 watcher event debounce를 수행한다.
- [x] 현재 refresh callback이 throw하면 scheduled callback이 예외를 전파하고 state가 `Refreshing`에 남을 수 있다.
- [x] 현재 controller는 refresh result `ok: false`를 명시적으로 Product Log failure로 변환하지 않는다.
- [x] watcher event와 debounce 완료는 Field Debug Log로 기록된다.
- [x] 이번 태스크는 watcher registration/disposal lifecycle은 변경하지 않는다.

## 3. Scope

### Included

- [x] refresh callback throw를 controller 내부에서 catch한다.
- [x] refresh callback이 `{ ok: false, diagnostics }`를 반환하면 실패로 취급한다.
- [x] refresh 실패 시 Product Log event `watcher.refresh.failed`를 생성한다.
- [x] debounce 완료 Field Debug Log에는 invalidation count와 status를 남긴다.
- [x] extension watcher refresh callback이 refresh result를 반환하도록 한다.

### Excluded

- [x] settings recomposition watcher disposal은 이번 태스크에서 다루지 않는다.
- [x] duplicate watcher registration 방지는 이번 태스크에서 다루지 않는다.
- [x] file system watcher adapter smoke는 이번 태스크에서 실행하지 않는다.
- [x] 새 설정을 추가하지 않는다.
- [x] refresh use case read model 구조는 변경하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] refresh throw failure를 복구한다.
- [x] 입력: scheduled refresh callback이 예외를 throw하는 watcher event.
- [x] 출력: controller state `Idle`, Product Log `watcher.refresh.failed`.
- [x] 성공 조건: 다음 invalidate 호출이 다시 debounce schedule을 만들 수 있다.
- [x] 실패 조건: state가 `Refreshing`에 남거나 scheduled flag가 해제되지 않는다.

### Functional Unit 2

- [x] refresh returned failure를 복구한다.
- [x] 입력: refresh callback이 `{ ok: false, diagnostics: [{ code }] }`를 반환한다.
- [x] 출력: Product Log reason이 첫 diagnostic code를 포함한다.
- [x] 성공 조건: refresh use case failure가 watcher layer에서 숨겨지지 않는다.
- [x] 실패 조건: refresh 실패가 Field Debug Log만 남기거나 아무 로그도 남기지 않는다.

### Functional Unit 3

- [x] extension watcher refresh callback이 result를 반환한다.
- [x] 입력: extension watcher가 refresh command handler를 호출한다.
- [x] 출력: controller가 refresh result의 `ok` 값을 판단할 수 있다.
- [x] 성공 조건: refresh command result가 controller로 전달된다.
- [x] 실패 조건: extension refresh callback이 result를 버린다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Application watch`, `Extension boundary`, `Tests`, `Task documentation`.
- [x] watcher는 event source일 뿐 read model policy를 결정하지 않는다.
- [x] refresh use case가 read model source of truth를 유지한다.
- [x] controller는 UI provider나 VSCode API를 알지 않는다.
- [x] Extension boundary가 provider update와 log routing adapter를 연결한다.

Changed layers:

- [x] Application
- [x] Extension boundary
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Existing logger port routing only.

RuntimeContext fields used:

- [x] None newly added.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] watcher debounce behavior를 새 설정으로 만들지 않는다.
- [x] watcher callback 내부에서 VSCode settings를 재조회하지 않는다.
- [x] RuntimeContext에서 받은 watcher path 정책은 변경하지 않는다.
- [x] refresh failure policy는 명시적 controller input과 callback result만 사용한다.

## 7. Logging Requirements

### Product Log

- [x] refresh callback throw 또는 `{ ok: false }`는 Product Log `watcher.refresh.failed`로 기록한다.
- [x] Product Log에는 first diagnostic code 또는 generic reason만 남긴다.
- [x] Product Log에 full path, file body, watcher event raw URI를 남기지 않는다.

### Field Debug Log

- [x] watcher event received는 Field Debug Log로 유지한다.
- [x] debounce completed는 Field Debug Log로 유지하고 status를 포함한다.
- [x] Field Debug Log에 event type과 invalidation count만 남긴다.

### Development Log

- [x] fake schedule/fake refresh sequence는 테스트 fixture에만 둔다.
- [x] 프로덕션 기본 동작에 개발 로그를 추가하지 않는다.

Product Log events:

- [x] `watcher.refresh.failed`

Field Debug Log events:

- [x] `watcher.event.received`
- [x] `watcher.debounce.completed`

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] Runtime state machine은 controller state string으로 명시한다.
- [x] 정상 전이: `Idle -> Invalidated -> Debouncing -> Refreshing -> Idle`.
- [x] 실패 전이: `Refreshing -> RefreshFailed -> Idle`.
- [x] scheduled flag와 invalidation count는 failure 이후 초기화한다.
- [x] state transition은 단위 테스트로 검증한다.

State machine required:

- [x] Explicit controller state only.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: refresh throw 후 state가 `Idle`로 돌아오고 Product Log failure가 기록된다.
- [x] 테스트 대상: refresh `{ ok: false }` 후 reason이 diagnostic code로 기록된다.
- [x] 테스트 대상: extension watcher refresh callback이 refresh result를 반환한다.
- [x] 외부 의존성은 fake scheduler, fake logger, fake VSCode workspace watcher로 대체한다.
- [x] 설정 값 전달 방식 테스트는 watcher callback이 settings를 읽지 않는 기존 activation tests와 build로 검증한다.
- [x] 로그 정책 검증은 Product Log와 Field Debug Log event level을 assertion한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 state helper 이름과 failure reason helper를 정리한다.

First failing tests:

- [x] `test/application/refresh-invalidation-controller.test.mjs` should fail because refresh throw is not caught.
- [x] `test/application/refresh-invalidation-controller.test.mjs` should fail because returned failure is not logged.
- [x] `test/extension-activation.test.mjs` should fail because extension refresh callback does not return refresh result.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 source file edit watcher refresh를 확인한다.

AGENTS.md rules checked:

- [x] Layered Architecture
- [x] Clean Architecture
- [x] Tidy First
- [x] TDD
- [x] Configuration Policy
- [x] Logging Policy
- [x] State Machine Policy

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 수정한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현으로 refresh throw catch를 추가한다.
- [x] 최소 구현으로 returned failure Product Log를 추가한다.
- [x] 최소 구현으로 failure 후 state/scheduled/count reset을 보장한다.
- [x] 최소 구현으로 extension refresh callback이 result를 반환하게 한다.
- [x] Product Log와 Field Debug Log level이 분리되었는지 확인한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 추가되지 않았는지 확인한다.
- [x] 설정 값 전달 방식이 변경되지 않았는지 확인한다.
- [x] 모든 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 도메인 계층이 외부 프레임워크에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 I/O가 logger boundary 외에 추가되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 유지되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 명시적 controller state로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.
- [x] 생성하거나 수정한 파일을 기록한다.
- [x] 실행한 테스트 명령과 결과를 기록한다.
- [x] 검증한 항목을 기록한다.
- [x] 남은 위험 요소를 기록한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.

Completion notes:

- [x] `createRefreshInvalidationController` now catches refresh callback exceptions and returns to `Idle`.
- [x] Refresh callback `{ ok: false }` results now create Product Log event `watcher.refresh.failed`.
- [x] Debounce completion Field Debug Log now includes `status`.
- [x] Extension watcher refresh callback now returns the refresh command result to the controller.
- [x] Extension watcher wiring routes controller Product Log events through the existing logger port.

Commands run:

- [x] `node --test test/application/refresh-invalidation-controller.test.mjs` failed before implementation and passed after implementation.
- [x] `node --test test/extension-activation.test.mjs` failed before implementation and passed after implementation.
- [x] `npm test` passed with 250 tests.
- [x] `npm run build` passed.

Files changed:

- [x] `.tasks/task015.md`
- [x] `src/application/watch/refresh-invalidation-controller.js`
- [x] `src/extension.js`
- [x] `test/application/refresh-invalidation-controller.test.mjs`
- [x] `test/extension-activation.test.mjs`

Residual risks:

- [x] Watcher disposal during settings recomposition remains for Task 016.
- [x] Duplicate watcher prevention remains for Task 016.
- [x] Manual Extension Host watcher smoke is still pending for release readiness.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 016 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.