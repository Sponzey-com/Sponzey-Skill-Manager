# Task 021. Extension Manifest Packaging Metadata Readiness

## 1. Task Purpose

- [x] VSCode extension packaging readiness를 위해 manifest metadata를 명시한다.
- [x] `displayName`, `categories`, `keywords`, `extensionKind` 누락을 manifest validation에서 잡는다.
- [x] package metadata를 local release candidate 수준으로 보강한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.7의 package manifest validation and packaging readiness 범위를 수행한다.
- [x] 완료 후 manifest validation은 command/view뿐 아니라 release metadata drift도 감지해야 한다.

## 2. Current Context

- [x] 현재 manifest validation은 main entrypoint, engines, commands, views, menus, configuration을 검증한다.
- [x] `package.json`에는 extension `displayName`, `categories`, `keywords`, `extensionKind`가 없다.
- [x] Phase 003은 marketplace publishing이 아니라 local release candidate readiness가 목표다.
- [x] 이번 태스크는 VSIX packaging dependency를 추가하지 않는다.

## 3. Scope

### Included

- [x] manifest validation에 required packaging metadata checks를 추가한다.
- [x] `package.json`에 `displayName`을 추가한다.
- [x] `package.json`에 `categories`를 추가한다.
- [x] `package.json`에 `keywords`를 추가한다.
- [x] `package.json`에 `extensionKind`를 추가한다.
- [x] manifest validation tests를 보강한다.

### Excluded

- [x] VSIX packaging command는 추가하지 않는다.
- [x] publisher/version release automation은 추가하지 않는다.
- [x] runtime extension code는 변경하지 않는다.
- [x] marketplace publishing metadata는 추가하지 않는다.
- [x] 새 설정을 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] required packaging metadata를 검증한다.
- [x] 입력: package manifest without displayName/categories/keywords/extensionKind.
- [x] 출력: typed manifest diagnostics.
- [x] 성공 조건: packaging metadata 누락이 build에서 발견된다.
- [x] 실패 조건: release candidate manifest가 이름/분류/keyword 없이 통과한다.

### Functional Unit 2

- [x] package metadata를 추가한다.
- [x] 입력: current `package.json`.
- [x] 출력: local release candidate metadata.
- [x] 성공 조건: current package manifest passes validation.
- [x] 실패 조건: metadata validation 추가 후 current package가 실패한다.

### Functional Unit 3

- [x] runtime dependency를 추가하지 않는다.
- [x] 입력: package scripts and dependencies.
- [x] 출력: no new packaging dependency.
- [x] 성공 조건: validation is script-only and existing build path passes.
- [x] 실패 조건: packaging readiness가 external package install을 요구한다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Package manifest`, `Scripts`, `Tests`, `Task documentation`.
- [x] Product runtime code는 변경하지 않는다.
- [x] script validation은 local package JSON만 읽는다.
- [x] settings/env/workspace를 읽지 않는다.
- [x] 외부 network를 사용하지 않는다.

Changed layers:

- [x] Package manifest
- [x] Scripts
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Existing local package manifest read by build scripts.

RuntimeContext fields used:

- [x] None.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] packaging metadata를 runtime 설정으로 만들지 않는다.
- [x] manifest validation은 user settings를 읽지 않는다.
- [x] extensionKind는 manifest metadata로만 둔다.
- [x] package metadata 변경은 runtime behavior로 전달하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] Product Log는 변경하지 않는다.

### Field Debug Log

- [x] Field Debug Log는 변경하지 않는다.

### Development Log

- [x] manifest validation output은 Development Log로 취급한다.
- [x] machine-readable diagnostic code를 유지한다.

Product Log events:

- [x] None.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] runtime state machine은 변경하지 않는다.
- [x] manifest validation은 sequential static checks로 유지한다.
- [x] 실패는 typed diagnostic code로 표현한다.

State machine required:

- [x] None.

## 9. TDD Plan

- [x] 실패하는 manifest validation test를 먼저 작성한다.
- [x] 테스트 대상: missing displayName.
- [x] 테스트 대상: missing categories.
- [x] 테스트 대상: missing keywords.
- [x] 테스트 대상: missing extensionKind.
- [x] 외부 의존성은 없다.
- [x] 설정 값 전달 방식 테스트는 no settings access by design으로 검증한다.
- [x] 로그 정책 검증은 diagnostic code assertion으로 수행한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 package metadata wording을 정리한다.

First failing tests:

- [x] `test/scripts/extension-manifest-rules.test.mjs` should fail because validation does not report missing packaging metadata.
- [x] Current package validation should fail until package metadata is added.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.

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
- [x] 최소 구현으로 manifest metadata validation을 추가한다.
- [x] package metadata를 추가한다.
- [x] build script가 manifest validation을 계속 실행하는지 확인한다.
- [x] runtime code가 변경되지 않았는지 확인한다.
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
- [x] 외부 I/O가 local manifest validation 외에 추가되지 않는다.
- [x] 로그 정책이 Development Log 기준과 충돌하지 않는다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] runtime state 변경이 없다.
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

- [x] Manifest validation now checks `displayName`, `categories`, `keywords`, and `extensionKind`.
- [x] `package.json` now includes local release candidate metadata for display name, category, keywords, and workspace extension kind.
- [x] No VSIX packaging dependency or runtime code was added.

Commands run:

- [x] `node --test test/scripts/extension-manifest-rules.test.mjs` failed before implementation and passed after implementation.
- [x] `npm test` passed with 259 tests.
- [x] `npm run build` passed.

Files changed:

- [x] `.tasks/task021.md`
- [x] `package.json`
- [x] `scripts/extension-manifest-rules.mjs`
- [x] `test/scripts/extension-manifest-rules.test.mjs`

Residual risks:

- [x] Actual VSIX packaging command remains outside this task.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 022 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.
