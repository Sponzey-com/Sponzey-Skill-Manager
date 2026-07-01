# Task 022. Release Smoke Checklist Packaging Metadata Alignment

## 1. Task Purpose

- [x] Phase 003 release smoke checklist를 strengthened manifest metadata validation과 정렬한다.
- [x] smoke checklist에 `displayName`, `categories`, `keywords`, `extensionKind` 확인 항목을 포함한다.
- [x] release smoke checklist tests가 packaging metadata signal 누락을 감지하게 한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.7의 smoke checklist and release gate alignment 범위를 수행한다.
- [x] 완료 후 automated gate와 manual smoke checklist가 같은 release candidate 기준을 공유해야 한다.

## 2. Current Context

- [x] Task 020은 release gate가 smoke checklist content를 검증하도록 강화했다.
- [x] Task 021은 manifest packaging metadata validation과 package metadata를 추가했다.
- [x] `.tasks/release-smoke.md`는 manifest validation을 언급하지만 packaging metadata 항목을 구체적으로 언급하지 않는다.
- [x] 이번 태스크는 runtime extension code를 변경하지 않는다.

## 3. Scope

### Included

- [x] release smoke checklist에 packaging metadata validation 항목을 추가한다.
- [x] release smoke checklist test required signals에 packaging metadata terms를 추가한다.
- [x] `npm run release:gate`가 updated checklist와 함께 통과하는지 확인한다.
- [x] task documentation을 완료한다.

### Excluded

- [x] runtime extension code는 변경하지 않는다.
- [x] package metadata 값은 변경하지 않는다.
- [x] release gate script는 변경하지 않는다.
- [x] VSIX packaging command는 추가하지 않는다.
- [x] 새 설정을 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] smoke checklist packaging metadata 항목을 추가한다.
- [x] 입력: `.tasks/release-smoke.md`.
- [x] 출력: displayName/categories/keywords/extensionKind checklist lines.
- [x] 성공 조건: manual smoke reviewer가 metadata gate를 확인할 수 있다.
- [x] 실패 조건: automated manifest gate와 manual checklist가 다른 기준을 가진다.

### Functional Unit 2

- [x] smoke checklist required signal test를 보강한다.
- [x] 입력: release smoke checklist content.
- [x] 출력: packaging metadata terms missing이면 test failure.
- [x] 성공 조건: checklist에서 metadata 항목이 삭제되면 test가 실패한다.
- [x] 실패 조건: checklist drift가 release gate까지 통과한다.

### Functional Unit 3

- [x] release gate final path를 검증한다.
- [x] 입력: updated checklist and scripts.
- [x] 출력: `npm run release:gate` passes.
- [x] 성공 조건: tests/build/docs/smoke 모두 통과한다.
- [x] 실패 조건: checklist content validation과 smoke checklist tests가 충돌한다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Task documentation`, `Release smoke documentation`, `Scripts tests`.
- [x] Product runtime code는 변경하지 않는다.
- [x] release checklist is documentation only.
- [x] tests read local files only.
- [x] settings/env/workspace를 읽지 않는다.

Changed layers:

- [x] Documentation
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Read-only local release checklist test.

RuntimeContext fields used:

- [x] None.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] packaging metadata를 runtime 설정으로 만들지 않는다.
- [x] release smoke checklist는 settings 변경을 요구하지 않는다.
- [x] release gate는 explicit local files and commands만 사용한다.
- [x] environment mutation을 추가하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] Product Log는 변경하지 않는다.

### Field Debug Log

- [x] Field Debug Log는 변경하지 않는다.

### Development Log

- [x] smoke checklist tests and release gate output are Development Log.
- [x] 프로덕션 기본 동작에 개발 로그를 추가하지 않는다.

Product Log events:

- [x] None.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build`, `npm run release:gate` local output only.

## 8. State Machine Requirements

- [x] runtime state machine은 변경하지 않는다.
- [x] release gate sequential state는 Task 020 구현을 유지한다.
- [x] checklist update는 state change가 아니다.

State machine required:

- [x] None.

## 9. TDD Plan

- [x] 실패하는 smoke checklist signal test를 먼저 작성한다.
- [x] 테스트 대상: packaging metadata terms appear in release smoke checklist.
- [x] 외부 의존성은 없다.
- [x] 설정 값 전달 방식 테스트는 no settings access by design으로 검증한다.
- [x] 로그 정책 검증은 local test output only로 유지한다.
- [x] 테스트를 통과하는 최소 문서 변경만 작성한다.
- [x] 테스트 통과 후 release gate를 실행한다.

First failing tests:

- [x] `test/scripts/release-smoke-checklist.test.mjs` should fail because packaging metadata signals are not yet required or present.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] Manual smoke remains represented by `.tasks/release-smoke.md`.

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
- [x] release smoke checklist 문서를 업데이트한다.
- [x] release gate와 checklist tests를 실행한다.
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
- [x] 외부 I/O가 read-only checklist test 외에 추가되지 않는다.
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

- [x] Added packaging metadata signals to the Phase 003 release smoke checklist tests.
- [x] Updated `.tasks/release-smoke.md` to require `displayName`, `categories`, `keywords`, and `extensionKind` manifest validation.
- [x] Verified the updated smoke checklist works with the strengthened release gate.

Commands run:

- [x] `node --test test/scripts/release-smoke-checklist.test.mjs` failed before checklist update and passed after checklist update.
- [x] `npm test` passed with 259 tests.
- [x] `npm run build` passed.
- [x] `npm run release:gate` passed.

Files changed:

- [x] `.tasks/task022.md`
- [x] `.tasks/release-smoke.md`
- [x] `test/scripts/release-smoke-checklist.test.mjs`

Residual risks:

- [x] Actual Extension Host manual smoke remains manual and must be run before publishing.

Next task decision:

- [x] Phase 003 task sequence can stop after this task if all validation passes.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if `npm run release:gate` fails.
