# Task 017. Persisted Analysis Refresh Consistency And Diagnostic Deduplication

## 1. Task Purpose

- [x] analyze 직후 refresh가 persisted analysis metadata를 읽는 경우 diagnostic이 중복 표시되지 않게 한다.
- [x] analyze 후 manual refresh가 persisted diagnostics를 유지하는지 검증한다.
- [x] 임시 analyze result injection은 persistence가 없는 환경의 fallback으로만 동작하게 한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.6의 analyze result update, manual refresh consistency, diagnostics preservation 범위를 수행한다.
- [x] 완료 후 Diagnostics tree는 analyze result와 persisted refresh result가 같은 diagnostic을 중복 표시하지 않아야 한다.

## 2. Current Context

- [x] Task 015는 watcher refresh failure recovery를 완료했다.
- [x] Task 016은 watcher lifecycle restart와 duplicate path guard를 완료했다.
- [x] `analyzeAllSkills`는 analysis metadata를 쓸 수 있고, `refreshSkills`는 persisted metadata를 읽을 수 있다.
- [x] Extension mutation wrapper는 analyze 성공 후 refresh read model에 analyze result diagnostics를 추가 주입한다.
- [x] persisted refresh가 이미 같은 diagnostics를 포함하면 추가 주입이 중복을 만들 수 있다.

## 3. Scope

### Included

- [x] analyze 후 refresh read model diagnostics와 analyze result diagnostics를 dedupe한다.
- [x] dedupe key는 diagnostic code, sourceId, targetId, skillName, category를 사용한다.
- [x] persisted analysis metadata가 있는 analyze flow에서 Diagnostics tree item이 한 번만 표시되는지 테스트한다.
- [x] analyze 이후 manual refresh를 실행해 persisted diagnostic이 계속 표시되는지 테스트한다.
- [x] persistence가 없는 환경에서는 analyze result diagnostic fallback이 유지되게 한다.

### Excluded

- [x] analysis metadata schema는 변경하지 않는다.
- [x] analyzer rules는 변경하지 않는다.
- [x] Diagnostics tree grouping UI는 변경하지 않는다.
- [x] watcher event refresh smoke는 이번 태스크에서 실행하지 않는다.
- [x] 새 설정을 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] read model additional diagnostics 병합에서 중복을 제거한다.
- [x] 입력: refresh read model diagnostics와 analyze result diagnostics.
- [x] 출력: 같은 source/code/category diagnostic은 한 번만 포함된다.
- [x] 성공 조건: persisted refresh와 temporary injection이 같은 diagnostic을 중복 표시하지 않는다.
- [x] 실패 조건: Diagnostics tree에 같은 diagnostic item이 두 번 표시된다.

### Functional Unit 2

- [x] analyze 후 manual refresh가 persisted diagnostics를 보존한다.
- [x] 입력: analysisStore write/read를 모두 제공하는 extension activation.
- [x] 출력: analyze 후와 manual refresh 후 Diagnostics tree가 같은 single diagnostic을 표시한다.
- [x] 성공 조건: manual refresh가 analyze 결과를 지우지 않는다.
- [x] 실패 조건: manual refresh 후 Diagnostics tree가 비거나 diagnostic이 중복된다.

### Functional Unit 3

- [x] persistence 없는 analyze fallback을 유지한다.
- [x] 입력: write-only 또는 missing readAnalysisMetadata analysisStore.
- [x] 출력: analyze result diagnostics가 refresh read model에 임시 주입된다.
- [x] 성공 조건: 기존 analyze command diagnostics tree test가 계속 통과한다.
- [x] 실패 조건: persistence 없는 환경에서 analyze 직후 Diagnostics tree가 비어 있다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Extension boundary`, `Tests`, `Task documentation`.
- [x] Application refresh use case는 이미 source of truth에서 persisted metadata를 읽는다.
- [x] Extension boundary는 fallback merge만 수행하고 Domain/Application policy를 변경하지 않는다.
- [x] Infrastructure analysis store는 변경하지 않는다.
- [x] 외부 I/O를 추가하지 않는다.

Changed layers:

- [x] Extension boundary
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Existing analysis store read/write through use cases only.

RuntimeContext fields used:

- [x] None newly added.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] diagnostic dedupe behavior를 설정으로 만들지 않는다.
- [x] analyze refresh fallback은 settings를 직접 읽지 않는다.
- [x] Extension wrapper는 recomposed context와 use case result만 사용한다.
- [x] 런타임 중간 환경 값 삽입을 추가하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] analyze/refresh existing Product Log events를 유지한다.
- [x] dedupe 자체에 Product Log를 추가하지 않는다.
- [x] Product Log에 diagnostic body나 file path를 추가하지 않는다.

### Field Debug Log

- [x] 새 Field Debug Log를 추가하지 않는다.
- [x] watcher/refresh existing Field Debug Log를 유지한다.

### Development Log

- [x] diagnostics count 검증은 테스트 fixture에만 둔다.
- [x] 프로덕션 기본 동작에 개발 로그를 추가하지 않는다.

Product Log events:

- [x] Existing analyze/refresh events only.

Field Debug Log events:

- [x] Existing watcher/target scan events only.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] 별도 runtime state machine은 추가하지 않는다.
- [x] analyze mutation wrapper flow는 기존 `use case success -> refresh -> provider update` 순서를 유지한다.
- [x] dedupe는 pure helper로 유지한다.
- [x] 상태 플래그 조합을 만들지 않는다.

State machine required:

- [x] No new state machine.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: persisted analysis refresh plus analyze injection does not duplicate diagnostics.
- [x] 테스트 대상: manual refresh after analyze keeps one persisted diagnostic.
- [x] 테스트 대상: existing no-read analysis fallback test still passes.
- [x] 외부 의존성은 in-memory fake analysis store, fake analyzer, fake hash port로 대체한다.
- [x] 설정 값 전달 방식 테스트는 새 설정이 없음을 build/manifest validation으로 검증한다.
- [x] 로그 정책 검증은 Product Log event shape를 변경하지 않는 기존 tests로 확인한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 diagnostic key helper 이름을 정리한다.

First failing tests:

- [x] `test/extension-activation.test.mjs` should fail because persisted refresh diagnostics and analyze result diagnostics are duplicated.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 Analyze All Skills 이후 Refresh를 눌러 Diagnostics가 유지되는지 확인한다.

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
- [x] 최소 구현으로 read model diagnostic dedupe helper를 추가한다.
- [x] 최소 구현으로 additional diagnostics merge에서 helper를 사용한다.
- [x] Persistence 없는 기존 fallback test가 통과하는지 확인한다.
- [x] Product Log 또는 Field Debug Log를 추가하지 않는다.
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
- [x] 외부 I/O가 추가되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 유지되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 중복 제거가 pure helper로 표현되었다.
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

- [x] Added diagnostic dedupe for analyze result fallback merged into refreshed read models.
- [x] Dedupe uses code/category/sourceId/targetId and falls back to skillName only when no stable id exists.
- [x] Added Extension activation coverage for persisted analysis metadata after analyze.
- [x] Verified manual refresh preserves the persisted diagnostic as a single Diagnostics tree item.
- [x] Existing no-read analysis fallback behavior remains covered by the previous analyze command test.

Commands run:

- [x] `node --test test/extension-activation.test.mjs` failed before implementation and passed after implementation.
- [x] `npm test` passed with 253 tests.
- [x] `npm run build` passed.

Files changed:

- [x] `.tasks/task017.md`
- [x] `src/extension.js`
- [x] `test/extension-activation.test.mjs`

Residual risks:

- [x] Watcher-triggered persisted analysis refresh manual smoke remains pending for release readiness.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 018 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.
