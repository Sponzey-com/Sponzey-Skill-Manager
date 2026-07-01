# Task 019. README Troubleshooting And Release Documentation Coverage

## 1. Task Purpose

- [x] README가 Extension Development Host 기준 핵심 운영 흐름과 troubleshooting을 충분히 설명하도록 보강한다.
- [x] README에 default repository, Codex/Claude refresh, Diagnostics interpretation, permission failure, watcher unavailable 대응을 포함한다.
- [x] README release documentation coverage를 automated test로 고정한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.7의 README user flow와 troubleshooting guide 범위를 수행한다.
- [x] 완료 후 사용자는 README만 보고 Extension Host에서 기본 검증과 문제 대응을 수행할 수 있어야 한다.

## 2. Current Context

- [x] `.tasks/release-smoke.md`는 Phase 003 smoke checklist를 이미 포함한다.
- [x] README는 주요 기능을 간단히 설명하지만 watcher failure, permission failure, Claude refresh, Diagnostics interpretation 설명이 부족하다.
- [x] release gate는 smoke checklist 존재를 확인하지만 README troubleshooting coverage는 별도 테스트가 없다.
- [x] 이번 태스크는 runtime behavior를 변경하지 않는다.

## 3. Scope

### Included

- [x] README troubleshooting 섹션에 `code` unavailable, `CODE_BIN`, default repository, Codex/Claude session refresh, Diagnostics interpretation, permission failure, watcher unavailable을 명시한다.
- [x] README development 섹션에 `npm test`, `npm run build`, `npm run release:gate`, Extension Host script 사용 순서를 명시한다.
- [x] README가 Main Repository를 source repository로만 설명하는지 테스트한다.
- [x] README release documentation coverage test를 추가한다.

### Excluded

- [x] runtime code는 변경하지 않는다.
- [x] package manifest command title은 변경하지 않는다.
- [x] release gate script 동작은 변경하지 않는다.
- [x] VSIX packaging 자동화는 추가하지 않는다.
- [x] 새 설정을 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] README troubleshooting coverage를 보강한다.
- [x] 입력: README reader.
- [x] 출력: 문제 상황별 대응 문장.
- [x] 성공 조건: 사용자가 흔한 Extension Host/target/permission/watcher 문제를 README에서 찾을 수 있다.
- [x] 실패 조건: troubleshooting이 `code` command 정도만 다룬다.

### Functional Unit 2

- [x] README release documentation test를 추가한다.
- [x] 입력: README content.
- [x] 출력: required signals presence assertion.
- [x] 성공 조건: README에서 required release signals가 빠지면 테스트가 실패한다.
- [x] 실패 조건: README가 실제 release checklist와 드리프트해도 테스트가 통과한다.

### Functional Unit 3

- [x] Main Repository 개념을 문서에서 명확히 유지한다.
- [x] 입력: README concept/setup sections.
- [x] 출력: Main Repository is source-only and not Global Target wording.
- [x] 성공 조건: README가 Main Repository를 active target으로 오해시키지 않는다.
- [x] 실패 조건: README가 Main Repository를 global repository처럼 설명한다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Documentation`, `Scripts tests`, `Task documentation`.
- [x] Product runtime path는 변경하지 않는다.
- [x] 테스트는 local files only를 읽는다.
- [x] 외부 API, network, filesystem mutation을 추가하지 않는다.
- [x] 설정 정책과 runtime handling은 문서로만 보강한다.

Changed layers:

- [x] Documentation
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Read-only local README/package files in tests.

RuntimeContext fields used:

- [x] None.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] README는 외부 설정 최소화 원칙을 유지한다.
- [x] README는 RuntimeContext를 runtime 중간에 재설정하라고 안내하지 않는다.
- [x] `CODE_BIN`은 script invocation input으로만 설명한다.
- [x] 새 환경 변수 의존 설계를 추가하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] Product Log behavior는 변경하지 않는다.
- [x] README에서 Product Log는 최소 운영 로그로 설명한다.

### Field Debug Log

- [x] README에서 watcher/detail troubleshooting은 Field Debug Log가 제한적 현장 확인용임을 설명한다.

### Development Log

- [x] documentation tests output은 Development Log로 취급한다.
- [x] 프로덕션 기본 동작에 개발 로그를 추가하지 않는다.

Product Log events:

- [x] None.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] runtime state machine은 변경하지 않는다.
- [x] README는 watcher flow를 `event -> debounce -> refresh -> tree update` 수준으로만 설명한다.
- [x] 내부 플래그 조합 또는 hidden setting을 안내하지 않는다.

State machine required:

- [x] None.

## 9. TDD Plan

- [x] 실패하는 README coverage test를 먼저 작성한다.
- [x] 테스트 대상: required troubleshooting signals.
- [x] 테스트 대상: source-only Main Repository wording.
- [x] 테스트 대상: development command sequence.
- [x] 외부 의존성은 없다.
- [x] 설정 값 전달 방식 테스트는 README content assertions로 검증한다.
- [x] 로그 정책 검증은 README log policy wording으로 검증한다.
- [x] 테스트를 통과하는 최소 문서 변경만 작성한다.
- [x] 테스트 통과 후 문장 중복과 모호한 표현을 정리한다.

First failing tests:

- [x] `test/scripts/readme-release-docs.test.mjs` should fail because README lacks one or more required troubleshooting signals.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] README에 수동 smoke entry point가 있는지만 확인한다.

AGENTS.md rules checked:

- [x] Layered Architecture
- [x] Clean Architecture
- [x] Tidy First
- [x] TDD
- [x] Configuration Policy
- [x] Logging Policy
- [x] State Machine Policy

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 추가한다.
- [x] 실패하는 테스트를 확인한다.
- [x] README troubleshooting 문장을 보강한다.
- [x] README development command 순서를 보강한다.
- [x] release smoke checklist와 README wording 충돌이 없는지 확인한다.
- [x] Product runtime code가 변경되지 않았는지 확인한다.
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
- [x] 외부 I/O가 read-only documentation test 외에 추가되지 않는다.
- [x] 로그 정책 문구가 3단계 정책과 충돌하지 않는다.
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

- [x] Added README coverage tests for Phase 003 troubleshooting and release documentation signals.
- [x] Updated README to state that Main Repository is a source repository, not a Global Target.
- [x] Added troubleshooting for Claude session refresh, permission errors, watcher unavailable fallback, Diagnostics interpretation, and log policy.
- [x] Kept runtime code unchanged.

Commands run:

- [x] `node --test test/scripts/readme-release-docs.test.mjs` failed before README update and passed after README update.
- [x] `npm test` passed with 257 tests.
- [x] `npm run build` passed.

Files changed:

- [x] `.tasks/task019.md`
- [x] `README.md`
- [x] `test/scripts/readme-release-docs.test.mjs`

Residual risks:

- [x] VSIX packaging readiness remains for a later release task.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 020 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.
