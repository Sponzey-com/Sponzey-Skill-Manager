# Task 016. Watcher Lifecycle Restart And Duplicate Path Guard

## 1. Task Purpose

- [x] settings recomposition 후 old watcher disposable을 해제하고 새 RuntimeContext 기준 watcher를 등록한다.
- [x] 동일한 normalized watch path가 여러 target에서 들어와도 watcher를 중복 등록하지 않는다.
- [x] watcher lifecycle을 Extension boundary 책임으로 관리하고 Application/Domain 정책으로 끌어들이지 않는다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.6의 settings recomposition watcher disposal과 duplicate watcher prevention 범위를 수행한다.
- [x] 완료 후 main repository 또는 target settings 변경 뒤 watcher가 이전 경로를 계속 감시하거나 같은 경로를 중복 감시하지 않아야 한다.

## 2. Current Context

- [x] Task 015는 watcher refresh failure recovery와 log separation을 완료했다.
- [x] 현재 activation 시점에 watcher를 등록하지만 settings command 성공 후 watcher를 재등록하지 않는다.
- [x] 현재 watcher path list는 duplicate normalized path를 제거하지 않는다.
- [x] settings recomposition은 RuntimeContext를 갱신하지만 watcher lifecycle은 갱신하지 않는다.
- [x] 이번 태스크는 read model refresh policy를 변경하지 않는다.

## 3. Scope

### Included

- [x] Extension boundary에 watcher lifecycle owner를 추가한다.
- [x] activation 시 watcher lifecycle을 시작하고 extension dispose 시 current watcher를 해제할 수 있게 한다.
- [x] settings command 성공 후 runtime recomposition이 성공하면 old watcher를 dispose하고 current RuntimeContext 기준으로 watcher를 재등록한다.
- [x] `watchedPathsFromContext`가 normalized duplicate path를 제거한다.
- [x] tests에서 old watcher disposable 호출과 duplicate watcher count를 검증한다.

### Excluded

- [x] refresh use case read model structure는 변경하지 않는다.
- [x] watcher debounce delay 설정은 추가하지 않는다.
- [x] filesystem adapter platform smoke는 이번 태스크에서 실행하지 않는다.
- [x] project target discovery 정책은 변경하지 않는다.
- [x] Product UI tree rendering은 변경하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] settings recomposition watcher restart를 구현한다.
- [x] 입력: `setMainRepository` 성공 후 RuntimeContext main path 변경.
- [x] 출력: old watcher/event disposables disposed, new watcher registered for new path.
- [x] 성공 조건: old path watcher가 살아있지 않고 new path watcher가 등록된다.
- [x] 실패 조건: old watcher가 dispose되지 않거나 watcher가 settings 변경 전 경로만 감시한다.

### Functional Unit 2

- [x] duplicate normalized watch path를 제거한다.
- [x] 입력: main path `/repo`, global target `/global`, duplicate global target `/global/`.
- [x] 출력: watcher registration은 `/repo`와 `/global` 각각 한 번만 수행한다.
- [x] 성공 조건: registered watcher disposable count가 unique path count 기준이다.
- [x] 실패 조건: 같은 normalized path에 watcher가 두 번 등록된다.

### Functional Unit 3

- [x] watcher lifecycle disposable을 extension subscription으로 연결한다.
- [x] 입력: extension deactivate 또는 subscription disposal.
- [x] 출력: current watcher disposables가 lifecycle owner를 통해 해제된다.
- [x] 성공 조건: lifecycle owner가 current watcher 상태를 단일 소유한다.
- [x] 실패 조건: restart 후 새 watcher가 extension context subscriptions에 포함되지 않아 dispose 누락이 발생한다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Extension boundary`, `Tests`, `Task documentation`.
- [x] Application controller는 변경하지 않는다.
- [x] Domain은 watcher lifecycle을 알지 않는다.
- [x] Infrastructure adapter는 변경하지 않는다.
- [x] Extension boundary가 VSCode watcher disposable ownership을 가진다.

Changed layers:

- [x] Extension boundary
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Existing VSCode `workspace.createFileSystemWatcher` boundary only.

RuntimeContext fields used:

- [x] `mainRepositoryPath`
- [x] `globalTargets`
- [x] `projectTargets`

New settings:

- [x] None.

## 6. Configuration Rules

- [x] watcher paths는 RuntimeContext에서만 읽는다.
- [x] watcher restart 중 VSCode settings를 직접 재조회하지 않는다.
- [x] settings command가 recompose한 RuntimeContext를 watcher lifecycle에 전달한다.
- [x] watcher dedupe policy를 외부 설정으로 만들지 않는다.

## 7. Logging Requirements

### Product Log

- [x] watcher restart 자체는 Product Log를 추가하지 않는다.
- [x] watcher registration failure handling은 후속 태스크에서 다룬다.
- [x] Product Log에 watcher path를 기록하지 않는다.

### Field Debug Log

- [x] 기존 watcher event/debounce Field Debug Log를 유지한다.
- [x] 이번 태스크에서 lifecycle restart debug log는 추가하지 않는다.

### Development Log

- [x] fake watcher disposable count는 테스트 fixture에만 둔다.
- [x] 프로덕션 기본 동작에 개발 로그를 추가하지 않는다.

Product Log events:

- [x] None newly added.

Field Debug Log events:

- [x] Existing watcher events only.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] 별도 runtime state machine class를 추가하지 않는다.
- [x] lifecycle owner state는 `Stopped` and `Started`로 암묵적 disposable list가 아니라 explicit helper methods로 관리한다.
- [x] restart sequence는 `DisposeCurrent -> RegisterCurrent -> Started` 순서를 따른다.
- [x] dispose는 idempotent 해야 한다.

State machine required:

- [x] Explicit lifecycle helper only.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: settings recomposition 후 old watcher/event disposables가 dispose된다.
- [x] 테스트 대상: settings recomposition 후 new RuntimeContext path watcher가 등록된다.
- [x] 테스트 대상: duplicate normalized global target paths do not create duplicate watchers.
- [x] 외부 의존성은 fake VSCode workspace watcher와 fake settings writer로 대체한다.
- [x] 설정 값 전달 방식 테스트는 watcher restart가 settings를 직접 읽지 않고 recomposed context를 사용하는지 activation flow로 검증한다.
- [x] 로그 정책 검증은 새 Product Log/Field Debug Log가 추가되지 않음을 기존 logger assertions로 확인한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 lifecycle helper 이름과 count reporting을 정리한다.

First failing tests:

- [x] `test/extension-activation.test.mjs` should fail because watcher disposables are not restarted after settings recomposition.
- [x] `test/extension-activation.test.mjs` should fail because duplicate normalized watch paths are not deduped.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 settings 변경 후 file edit watcher refresh를 확인한다.

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
- [x] 최소 구현으로 watcher lifecycle owner를 추가한다.
- [x] 최소 구현으로 activation initial watcher registration을 lifecycle owner로 이동한다.
- [x] 최소 구현으로 settings recomposition success path에서 watcher restart를 호출한다.
- [x] 최소 구현으로 watched path normalized dedupe를 추가한다.
- [x] 새 Product Log 또는 settings read가 추가되지 않았는지 확인한다.
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
- [x] 외부 I/O가 VSCode watcher boundary 외에 추가되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 유지되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] watcher lifecycle이 explicit helper로 관리된다.
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

- [x] Added an Extension boundary watcher lifecycle owner.
- [x] Initial watcher registration now runs through the lifecycle owner.
- [x] Settings recomposition success now disposes old watcher/event disposables and registers watchers from the recomposed RuntimeContext.
- [x] Normalized duplicate watcher paths are deduped before watcher registration.
- [x] Watcher ownership stays outside Domain/Application policy.

Commands run:

- [x] `node --test test/extension-activation.test.mjs` failed before implementation and passed after implementation.
- [x] `npm test` passed with 252 tests.
- [x] `npm run build` passed.

Files changed:

- [x] `.tasks/task016.md`
- [x] `src/extension.js`
- [x] `test/extension-activation.test.mjs`

Residual risks:

- [x] Watcher registration failure Product Log remains for a later task.
- [x] Manual Extension Host watcher smoke is still pending for release readiness.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 017 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.
