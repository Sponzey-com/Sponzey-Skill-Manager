# Task 001. Phase 003 Audit Baseline And Release Smoke Checklist

## 1. Task Purpose

- [x] Phase 003의 시작점으로 Phase 002 완료 상태와 현재 코드/문서/검증 기준의 drift를 확인한다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 003.1 "Phase 002 Completion Audit And Product Baseline"에 기여한다.
- [x] 완료 후 프로젝트는 루트 `.tasks/release-smoke.md`를 통해 Phase 003 Extension Host 수동 검증 기준을 갖고, release gate가 이를 자동으로 확인해야 한다.

## 2. Current Context

- [x] 현재 코드베이스에는 VSCode extension entrypoint, command registry, package contributions, README, release gate가 존재한다.
- [x] 이전 Phase 001, Phase 002 task 문서는 `.tasks/phase001/`, `.tasks/phase002/`에 보관되어 있다.
- [x] 루트 `.tasks/plan.md`는 Phase 003 계획만 담고 있다.
- [x] 기존 `test/presentation/command-registry.test.mjs`는 `SPONZEY_COMMANDS`와 `package.json` command contribution의 1:1 일치를 검증한다.
- [x] 기존 `scripts/release-gate.mjs`는 `.tasks/release-smoke.md`를 요구하지만 현재 루트 `.tasks/release-smoke.md`는 없다.
- [x] 이번 태스크는 runtime behavior를 변경하지 않고 문서/검증 기준선을 맞추기 위해 시작한다.
- [x] 현재 확인된 제약 사항: Extension Development Host 수동 smoke는 자동 실행하지 않고 체크리스트 기준만 작성한다.

## 3. Scope

### Included

- [x] Phase 003 release smoke checklist 구조와 필수 항목을 검증하는 실패 테스트를 먼저 작성한다.
- [x] 루트 `.tasks/release-smoke.md`를 Phase 003 기준으로 생성한다.
- [x] release gate, command registry, README, package contribution의 baseline drift를 검증한다.

### Excluded

- [x] Diagnostics persistence, stale analysis metadata, diagnostics grouping은 이번 태스크에서 구현하지 않는다.
- [x] Skill detail read model, conflict/shadowing policy, watcher race guard는 이번 태스크에서 구현하지 않는다.
- [x] Extension Development Host를 실제 GUI로 실행하지 않는다. 수동 실행 기준만 문서화한다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] Phase 003 release smoke checklist 검증 테스트를 작성한다.
- [x] 입력: `.tasks/release-smoke.md` 파일 내용.
- [x] 출력: 필수 section과 핵심 UX 항목이 없으면 실패하는 script test.
- [x] 성공 조건: checklist가 Phase 003 필수 smoke 항목을 포함하면 테스트가 통과한다.
- [x] 실패 조건: checklist가 없거나 Diagnostics, Project Skills visibility, Codex/Claude badge, default repository, Git URL/path install, Extension Host run script 항목 중 하나라도 없으면 테스트가 실패한다.

### Functional Unit 2

- [x] 루트 `.tasks/release-smoke.md`를 작성한다.
- [x] 입력: `.tasks/plan.md` Phase 003.1, Phase 003.7, Phase 8.4, `.tasks/phase002/release-smoke.md`.
- [x] 출력: Phase 003용 수동 smoke checklist.
- [x] 성공 조건: release gate가 요구하는 파일이 존재하고 필수 항목이 자동 테스트로 확인된다.
- [x] 실패 조건: checklist가 Phase 002 수준에 머물거나 Phase 003 계획의 핵심 gap을 포함하지 않는다.

### Functional Unit 3

- [x] baseline 검증 명령을 실행하고 결과를 Completion Report에 기록한다.
- [x] 입력: `npm test`, `npm run build`, `npm run release:gate`.
- [x] 출력: 실행 결과와 남은 위험 기록.
- [x] 성공 조건: 자동 테스트와 build/release gate가 통과한다.
- [x] 실패 조건: 테스트 실패, manifest drift, release smoke 누락, architecture guard 실패가 발생한다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Scripts tests`, `Docs`, `.tasks`.
- [x] Domain, Application, Infrastructure, Presentation runtime behavior는 변경하지 않는다.
- [x] 도메인, 유스케이스, 어댑터 책임은 이번 태스크에서 변경하지 않는다.
- [x] 의존성 방향은 변경되지 않는다.
- [x] 외부 시스템 접근은 Node test가 repository 파일을 읽는 개발 검증 경계에만 위치한다.
- [x] 필요한 인터페이스, 포트, 어댑터는 없다.
- [x] 전역 상태, 숨겨진 I/O, 암묵적 설정 접근을 추가하지 않는다.

Changed layers:

- [x] Scripts tests
- [x] Docs
- [x] Task documentation

External I/O boundary:

- [x] Filesystem read of `.tasks/release-smoke.md` in test code only.

RuntimeContext fields used:

- [x] None.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 환경 값은 프로그램 시작 시 최초 1회만 수신한다는 기존 원칙을 변경하지 않는다.
- [x] 최초 수신 이후에는 환경 값을 전역 상수처럼 사용하지 않는다.
- [x] 환경 값은 명시적 인자, 생성자 인자, 컨텍스트 객체, 의존성 주입으로 전달한다는 기존 구조를 유지한다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 추가하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] Product runtime log를 추가하지 않는다.
- [x] 운영에 필요한 최소 로그만 정의한다는 기존 원칙을 변경하지 않는다.
- [x] 민감 정보와 과도한 내부 상태를 기록하지 않는다.

### Field Debug Log

- [x] Field Debug Log는 필요하지 않다.
- [x] 활성화 조건 변경은 없다.
- [x] 민감 정보 마스킹 기준 변경은 없다.
- [x] 보존 범위와 사용 범위 변경은 없다.

### Development Log

- [x] release gate와 smoke checklist 검증 결과는 Development Log 성격의 local verification output으로 취급한다.
- [x] 프로덕션 기본 동작에 포함되는 로그를 추가하지 않는다.
- [x] 테스트 전용 output은 Node test와 script 실행 결과에만 남긴다.

Product Log events:

- [x] None.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `npm test`, `npm run build`, `npm run release:gate` local output only.

## 8. State Machine Requirements

- [x] runtime 상태머신은 필요하지 않다.
- [x] Audit 절차는 `.tasks/plan.md`의 `CollectingCommands -> CollectingViews -> CheckingDocs -> CheckingSmoke -> RecordingGaps -> Completed` explicit steps로 관리한다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록: `CollectingCommands`, `CollectingViews`, `CheckingDocs`, `CheckingSmoke`, `RecordingGaps`, `Completed`.
- [x] 이벤트 목록: `CommandsMatched`, `ViewsMatched`, `DocsChecked`, `SmokeChecklistVerified`, `GapsRecorded`.
- [x] 실패 상태: `CommandDrift`, `ViewDrift`, `DocsDrift`, `SmokeGap`.
- [x] 종료 상태: `Completed`.
- [x] 상태 전이는 이번 태스크에서 코드 상태머신으로 구현하지 않고 task completion report로 추적한다.

State machine required:

- [x] No runtime state machine; documentation-level audit steps only.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: Phase 003 release smoke checklist presence and required content.
- [x] 정상 케이스 테스트를 작성한다.
- [x] 실패 케이스 테스트는 missing file 또는 missing required text로 재현한다.
- [x] 경계값 테스트는 필수 section 누락을 검증한다.
- [x] 외부 의존성은 Node filesystem read만 사용하며 VSCode API는 사용하지 않는다.
- [x] 설정 값 전달 방식 테스트는 해당 없음으로 기록한다.
- [x] 로그 정책 검증 테스트는 해당 없음으로 기록한다.
- [x] 상태 전이 테스트는 runtime state machine이 없으므로 해당 없음으로 기록한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

First failing tests:

- [x] `test/scripts/release-smoke-checklist.test.mjs` failed while `.tasks/release-smoke.md` was missing.

Manual smoke steps:

- [x] `.tasks/release-smoke.md`에 Extension Development Host 수동 검증 항목을 작성한다.
- [x] 실제 Extension Development Host GUI 실행은 이번 태스크에서 수행하지 않는다.

AGENTS.md rules checked:

- [x] Layered Architecture
- [x] Clean Architecture
- [x] Tidy First
- [x] TDD
- [x] Configuration Policy
- [x] Logging Policy
- [x] State Machine Policy

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 작성한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현으로 `.tasks/release-smoke.md`를 작성한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] 필요한 로그를 정책에 맞게 추가한다.
- [x] 상태 관리가 필요한 경우 명시적 상태 전이로 구현한다.
- [x] 중복과 구조 문제를 정리한다.
- [x] 모든 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 도메인 계층이 외부 프레임워크에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 환경 값이 전역 상수처럼 사용되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 플래그 조합이 아니라 명시적 상태로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.

  - Added Phase 003 release smoke checklist validation.
  - Added root `.tasks/release-smoke.md` for Extension Development Host and release candidate smoke.
  - Verified existing command registry vs package contribution drift test remains in place.
- [x] 생성하거나 수정한 파일을 기록한다.

  - Created `.tasks/task001.md`.
  - Created `.tasks/release-smoke.md`.
  - Created `test/scripts/release-smoke-checklist.test.mjs`.
  - Updated `.tasks/task001.md` progress and completion report.
- [x] 실행한 테스트 명령과 결과를 기록한다.

  - `node --test test/scripts/release-smoke-checklist.test.mjs` failed first with `ENOENT` for missing `.tasks/release-smoke.md`.
  - `node --test test/scripts/release-smoke-checklist.test.mjs` passed after adding `.tasks/release-smoke.md`.
  - `npm test` passed: 215 tests, 0 failures.
  - `npm run build` passed: architecture ok, extension manifest ok, build smoke ok.
  - `npm run release:gate` passed: tests, architecture, manifest, build, docs.
- [x] 검증한 항목을 기록한다.

  - Phase 003 smoke checklist exists.
  - Phase 003 smoke checklist includes required sections.
  - Phase 003 smoke checklist includes Extension Host, Project Skills visibility, default repository, Git URL/path install, Codex/Claude badge, Analyze/Diagnostics, current window open, remove/delete separation, watcher refresh, and stale analysis signals.
  - Existing command registry/package contribution test passed as part of `npm test`.
  - Release gate now validates the root smoke checklist file.
- [x] 남은 위험 요소를 기록한다.

  - Extension Development Host GUI smoke was documented but not manually executed in this task.
  - Diagnostics persistence and stale analysis behavior are not implemented yet; they remain Phase 003.2 work.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.

  - Next task should start Phase 003.2-A Diagnostics DTO/read model Tidy First cleanup.
  - Next task must not implement persistence yet.
  - Next task should add mapper tests for diagnostic source/target/category/severity/recommendation preservation.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.
- [x] 도달했다면 추가 태스크를 생성하지 않는다.
- [x] 도달하지 못했다면 남은 목표를 정리한다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
- [x] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작한다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [ ] `plan.md`의 최종 목표에 도달했다.
- [ ] 필수 요구사항이 불명확하여 더 이상 안전하게 진행할 수 없다.
- [ ] 외부 정보, 권한, 비밀값, 접근 권한이 없어 진행할 수 없다.
- [ ] `AGENTS.md` 원칙과 충돌하는 요구사항이 발견되었다.
- [ ] 테스트 또는 검증 환경이 없어 완료 여부를 판단할 수 없다.
- [ ] 코드베이스 구조가 계획과 크게 달라 태스크 재설계가 필요하다.
- [ ] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.