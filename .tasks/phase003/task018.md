# Task 018. Watcher Registration Failure Product Log Guard

## 1. Task Purpose

- [x] VSCode file system watcher registration이 실패해도 extension activation이 실패하지 않도록 한다.
- [x] watcher registration failure를 Product Log `watcher.registration.failed`로 기록한다.
- [x] 실패한 watcher path 또는 raw URI를 Product Log에 기록하지 않는다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.6의 watcher registration failure logging 범위를 수행한다.
- [x] 완료 후 watcher를 만들 수 없는 환경에서도 명령과 트리 뷰는 계속 사용할 수 있어야 한다.

## 2. Current Context

- [x] Task 015는 watcher refresh failure를 Product Log로 분리했다.
- [x] Task 016은 watcher lifecycle restart와 duplicate path dedupe를 완료했다.
- [x] 현재 watcher 생성 또는 event registration이 throw되면 activation flow가 깨질 수 있다.
- [x] watcher registration failure는 사용자 영향이 있으므로 Product Log로 기록해야 한다.
- [x] 이번 태스크는 watcher refresh debounce behavior를 변경하지 않는다.

## 3. Scope

### Included

- [x] `createFileSystemWatcher` throw를 catch하고 activation을 유지한다.
- [x] watcher event registration throw를 catch하고 activation을 유지한다.
- [x] Product Log `watcher.registration.failed`에 reason만 남긴다.
- [x] failed watcher는 registered watcher count에 포함하지 않는다.
- [x] tests에서 activation success와 Product Log failure event를 검증한다.

### Excluded

- [x] retry/backoff watcher registration은 추가하지 않는다.
- [x] watcher failure UI notification은 추가하지 않는다.
- [x] watcher debounce delay 설정은 추가하지 않는다.
- [x] watcher refresh failure handling은 변경하지 않는다.
- [x] 새 설정을 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] watcher creation failure를 차단한다.
- [x] 입력: `workspace.createFileSystemWatcher`가 throw하는 fake VSCode workspace.
- [x] 출력: activation succeeds, registeredWatcherCount is 0, Product Log failure exists.
- [x] 성공 조건: extension command/tree registration은 유지된다.
- [x] 실패 조건: activation promise가 reject된다.

### Functional Unit 2

- [x] watcher event registration failure를 차단한다.
- [x] 입력: watcher `onDidChange` registration이 throw한다.
- [x] 출력: non-throwing watcher disposables만 등록되고 Product Log failure exists.
- [x] 성공 조건: 나머지 event registration이 가능하면 계속 등록된다.
- [x] 실패 조건: 하나의 event registration 실패가 activation 전체를 중단한다.

### Functional Unit 3

- [x] Product Log payload를 최소화한다.
- [x] 입력: watcher creation/event registration failure.
- [x] 출력: `code`, `reason` only.
- [x] 성공 조건: Product Log에 full path, raw URI, stack trace가 없다.
- [x] 실패 조건: Product Log가 watch path 또는 exception message full detail을 노출한다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Extension boundary`, `Tests`, `Task documentation`.
- [x] Domain/Application/Infrastructure는 변경하지 않는다.
- [x] watcher registration은 VSCode boundary 책임이다.
- [x] Product Log routing은 기존 logger port를 사용한다.
- [x] settings/env/process global을 새로 읽지 않는다.

Changed layers:

- [x] Extension boundary
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Existing VSCode watcher API boundary.
- [x] Existing logger port boundary.

RuntimeContext fields used:

- [x] Existing watcher paths only.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] watcher failure behavior를 설정으로 만들지 않는다.
- [x] watcher registration 중 settings를 다시 읽지 않는다.
- [x] RuntimeContext에서 받은 paths만 사용한다.
- [x] runtime 중간 환경 값 변경을 추가하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] watcher creation failure는 Product Log `watcher.registration.failed`로 기록한다.
- [x] watcher event registration failure는 Product Log `watcher.registration.failed`로 기록한다.
- [x] Product Log에는 `reason`만 남기고 path, URI, stack, exception message를 기록하지 않는다.

### Field Debug Log

- [x] watcher event/debounce Field Debug Log는 변경하지 않는다.
- [x] registration failure detail을 Field Debug Log로 추가하지 않는다.

### Development Log

- [x] fake watcher failure sequence는 테스트 fixture에만 둔다.
- [x] 프로덕션 기본 동작에 개발 로그를 추가하지 않는다.

Product Log events:

- [x] `watcher.registration.failed`

Field Debug Log events:

- [x] Existing watcher events only.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] 별도 runtime state machine은 추가하지 않는다.
- [x] lifecycle registration flow는 `RegisterPath -> RegisterEvents -> Registered` 또는 `RegistrationFailed -> Continue`로 처리한다.
- [x] registration failure가 refresh invalidation controller state를 만들지 않는다.
- [x] 실패한 watcher는 lifecycle current disposables에 포함하지 않는다.

State machine required:

- [x] Explicit registration branch only.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: watcher creation throw does not reject activation.
- [x] 테스트 대상: event registration throw does not reject activation.
- [x] 테스트 대상: Product Log payload contains code and reason only.
- [x] 외부 의존성은 fake VSCode workspace watcher와 fake logger로 대체한다.
- [x] 설정 값 전달 방식 테스트는 새 settings access가 없음을 build/architecture validation으로 검증한다.
- [x] 로그 정책 검증은 Product Log event payload exact assertion으로 수행한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 helper 이름과 failure reason constants를 정리한다.

First failing tests:

- [x] `test/extension-activation.test.mjs` should fail because watcher creation throw rejects activation.
- [x] `test/extension-activation.test.mjs` should fail because event registration throw rejects activation.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 watcher unavailable troubleshooting을 문서로 확인한다.

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
- [x] 최소 구현으로 watcher creation try/catch를 추가한다.
- [x] 최소 구현으로 watcher event registration try/catch를 추가한다.
- [x] 최소 구현으로 Product Log failure helper를 추가한다.
- [x] Product Log payload에 path, URI, stack이 없는지 확인한다.
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
- [x] 외부 I/O가 VSCode watcher/logger boundary 외에 추가되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 유지되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] registration failure가 explicit branch로 처리된다.
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

- [x] Watcher creation failures are caught and no longer reject extension activation.
- [x] Watcher event registration failures are caught and valid watcher/event disposables are retained.
- [x] Registration failures emit Product Log `watcher.registration.failed` with minimal reason-only payload.
- [x] Failure logs do not include watch paths, raw URIs, stack traces, or exception messages.

Commands run:

- [x] `node --test test/extension-activation.test.mjs` failed before implementation and passed after implementation.
- [x] `npm test` passed with 255 tests.
- [x] `npm run build` passed.

Files changed:

- [x] `.tasks/task018.md`
- [x] `src/extension.js`
- [x] `test/extension-activation.test.mjs`

Residual risks:

- [x] User-facing watcher troubleshooting documentation remains for release documentation tasks.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 019 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.
