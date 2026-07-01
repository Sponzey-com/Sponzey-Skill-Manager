# Task 020. Release Gate Smoke Checklist Content Validation

## 1. Task Purpose

- [x] release gate가 `.tasks/release-smoke.md` 존재만이 아니라 Phase 003 smoke checklist content를 검증하도록 한다.
- [x] smoke checklist 제목과 핵심 섹션 누락 시 machine-readable failure code를 반환한다.
- [x] release gate script가 local files and explicit dependencies만 사용하도록 유지한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.7의 release gate hardening 범위를 수행한다.
- [x] 완료 후 release gate는 빈 파일이나 잘못된 checklist 파일을 release-ready로 통과시키지 않아야 한다.

## 2. Current Context

- [x] `scripts/release-gate.mjs`는 tests, architecture, manifest, build를 실행한다.
- [x] 현재 release gate는 `.tasks/release-smoke.md` 파일 접근 가능 여부만 확인한다.
- [x] 별도 smoke checklist test는 존재하지만 release gate 자체는 checklist content drift를 막지 않는다.
- [x] 이번 태스크는 runtime extension code를 변경하지 않는다.

## 3. Scope

### Included

- [x] release gate가 smoke checklist file content를 읽는다.
- [x] release gate가 Phase 003 checklist title을 확인한다.
- [x] release gate가 required section headings를 확인한다.
- [x] invalid smoke checklist content에는 `SmokeMissing` failure code를 반환한다.
- [x] release gate tests를 보강한다.

### Excluded

- [x] release smoke checklist 본문은 변경하지 않는다.
- [x] VSIX packaging command는 추가하지 않는다.
- [x] runtime extension code는 변경하지 않는다.
- [x] network, external package registry, VSCode executable을 호출하지 않는다.
- [x] 새 설정을 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] smoke checklist title을 검증한다.
- [x] 입력: `.tasks/release-smoke.md` content.
- [x] 출력: title missing이면 `SmokeMissing`.
- [x] 성공 조건: wrong file content가 release gate를 통과하지 않는다.
- [x] 실패 조건: 빈 파일이나 임의 markdown이 release gate를 통과한다.

### Functional Unit 2

- [x] required section headings를 검증한다.
- [x] 입력: smoke checklist content missing one required section.
- [x] 출력: `SmokeMissing` failure code.
- [x] 성공 조건: manual smoke coverage drift가 release gate에서 잡힌다.
- [x] 실패 조건: critical manual smoke section 누락이 통과한다.

### Functional Unit 3

- [x] dependency injection 기반 테스트 가능성을 유지한다.
- [x] 입력: fake runCommand, fake checkFile, fake readTextFile.
- [x] 출력: tests without spawning external commands.
- [x] 성공 조건: release gate tests는 external process를 실행하지 않는다.
- [x] 실패 조건: tests가 실제 npm command를 실행한다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Scripts`, `Tests`, `Task documentation`.
- [x] Product runtime은 변경하지 않는다.
- [x] script는 explicit local file input만 읽는다.
- [x] settings/env/workspace를 읽지 않는다.
- [x] command execution은 existing injected `runCommand` boundary를 유지한다.

Changed layers:

- [x] Scripts
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Existing local file read for `.tasks/release-smoke.md`.
- [x] Existing subprocess boundary for release checks.

RuntimeContext fields used:

- [x] None.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] release gate는 user VSCode settings를 읽지 않는다.
- [x] release gate는 environment를 runtime 중간 설정으로 사용하지 않는다.
- [x] smoke checklist path는 script constant로 유지한다.
- [x] 테스트에서는 explicit injected readers만 사용한다.

## 7. Logging Requirements

### Product Log

- [x] Product Log는 변경하지 않는다.

### Field Debug Log

- [x] Field Debug Log는 변경하지 않는다.

### Development Log

- [x] release gate stdout/stderr는 Development Log로 취급한다.
- [x] failure code는 machine-readable string으로 유지한다.

Product Log events:

- [x] None.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build`, `npm run release:gate` local output only.

## 8. State Machine Requirements

- [x] release gate state는 `CheckingTests -> CheckingArchitecture -> CheckingManifest -> CheckingBuild -> CheckingSmoke -> Completed`로 유지한다.
- [x] smoke content failure는 `SmokeMissing` failure state로 표현한다.
- [x] 상태를 hidden flag 조합으로 만들지 않는다.

State machine required:

- [x] Existing release gate sequential checks only.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: valid smoke checklist content passes.
- [x] 테스트 대상: missing title or missing section returns `SmokeMissing`.
- [x] 테스트 대상: command failure behavior remains unchanged.
- [x] 외부 의존성은 fake command runner and fake file reader로 대체한다.
- [x] 설정 값 전달 방식 테스트는 no settings access by design으로 검증한다.
- [x] 로그 정책 검증은 machine-readable failure code assertion으로 수행한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 required section list 이름을 정리한다.

First failing tests:

- [x] `test/scripts/release-gate.test.mjs` should fail because release gate does not read or validate smoke checklist content.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] `npm run release:gate`는 전체 validation에서 실행한다.

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
- [x] 최소 구현으로 smoke checklist content reader를 추가한다.
- [x] 최소 구현으로 title and sections validation을 추가한다.
- [x] invalid content failure code를 `SmokeMissing`으로 반환한다.
- [x] existing command failure test가 변경되지 않았는지 확인한다.
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
- [x] 외부 I/O가 release script boundary 외에 추가되지 않는다.
- [x] 로그 정책이 Development Log 기준과 충돌하지 않는다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] release gate state가 sequential checks로 유지된다.
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

- [x] Release gate now reads `.tasks/release-smoke.md` content after checking file existence.
- [x] Release gate validates the Phase 003 checklist title and required section headings.
- [x] Invalid smoke checklist content now returns machine-readable `SmokeMissing`.
- [x] Release gate success output now includes `smoke` in checked items.

Commands run:

- [x] `node --test test/scripts/release-gate.test.mjs` failed before implementation and passed after implementation.
- [x] `npm test` passed with 258 tests.
- [x] `npm run build` passed.
- [x] `npm run release:gate` passed.

Files changed:

- [x] `.tasks/task020.md`
- [x] `scripts/release-gate.mjs`
- [x] `test/scripts/release-gate.test.mjs`

Residual risks:

- [x] VSIX packaging readiness remains for a later release task.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 021 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.
