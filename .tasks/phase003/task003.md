# Task 003. Analysis Metadata Store Port And Analyze Persistence

## 1. Task Purpose

- [x] Analyze 결과를 notification과 transient Diagnostics provider에만 의존하지 않도록 repository-local metadata store에 저장하는 첫 persistence 경계를 만든다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 003.2-B "analysis metadata port/store"에 기여한다.
- [x] 완료 후 `analyzeAllSkills`는 optional `analysisStore`와 `hashPort`를 통해 `.sponzey/analysis/` schema에 맞는 metadata write를 수행해야 한다.

## 2. Current Context

- [x] Task 001은 Phase 003 release smoke checklist와 release gate baseline을 만들었다.
- [x] Task 002는 Diagnostics tree item이 diagnostic DTO payload를 보존하도록 정리했다.
- [x] 현재 `analyzeAllSkills`는 summaries와 diagnostics만 반환하고 결과를 저장하지 않는다.
- [x] 현재 filesystem repository에는 `.sponzey/` directory는 있지만 `.sponzey/analysis/` metadata store는 없다.
- [x] refresh에서 persisted metadata를 읽어 source read model에 병합하는 작업은 아직 시작하지 않는다.
- [x] 이번 태스크는 metadata write boundary와 adapter safety만 다룬다.

## 3. Scope

### Included

- [x] `analyzeAllSkills`에 optional `analysisStore`와 `hashPort`를 추가하고 metadata write를 수행한다.
- [x] metadata schema에 `schemaVersion`, `skillId`, `sourceHash`, `analyzedAt`, `riskLevel`, `diagnostics`, `dependencies`, `compatibility`, `analyzerVersion`을 포함한다.
- [x] filesystem `FileSystemAnalysisStore`를 추가하고 `.sponzey/analysis/` 하위에 unsafe skill id를 안전하게 encoding해 저장한다.

### Excluded

- [x] RefreshSkills가 persisted metadata를 읽어 source read model에 병합하는 작업은 제외한다.
- [x] Diagnostics grouping by severity/category는 제외한다.
- [x] stale analysis marker는 제외한다.
- [x] unsupported metadata schema를 refresh diagnostic으로 표시하는 작업은 후속 task로 넘긴다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] `analyzeAllSkills` metadata write use case flow를 구현한다.
- [x] 입력: sources, analyzer output, optional hashPort output, context mainRepositoryPath.
- [x] 출력: analysisStore `writeAnalysisMetadata` calls and existing analysis result.
- [x] 성공 조건: 각 source마다 schemaVersion/sourceHash/riskLevel/diagnostics가 포함된 metadata가 write된다.
- [x] 실패 조건: metadata write 실패가 analysis 전체 실패로 전파되거나 diagnostics 없이 사라진다.

### Functional Unit 2

- [x] `FileSystemAnalysisStore`를 구현한다.
- [x] 입력: repositoryPath, metadata.
- [x] 출력: `.sponzey/analysis/<encoded-skill-id>.json`.
- [x] 성공 조건: unsafe skill id가 path traversal 없이 encoded filename으로 저장된다.
- [x] 실패 조건: `../` 같은 skill id가 analysis directory 밖에 파일을 쓴다.

### Functional Unit 3

- [x] Extension composition이 기본 filesystem analysis store와 hash port를 analyze use case에 주입하게 한다.
- [x] 입력: extension composition adapters.
- [x] 출력: production composition uses filesystem analysis store; tests can pass fake analysisStore.
- [x] 성공 조건: use case 내부에서 settings/env를 읽지 않고 DI로 받은 store만 사용한다.
- [x] 실패 조건: Application이 concrete Infrastructure class를 생성하거나 settings를 재조회한다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Application`, `Infrastructure`, `Extension composition`, `Tests`, `Task documentation`.
- [x] Domain 계층은 변경하지 않는다.
- [x] Application은 `analysisStore`와 `hashPort`를 port-like object로만 사용한다.
- [x] Infrastructure는 filesystem write를 담당하고 schema policy를 최소 validation한다.
- [x] Extension composition은 concrete filesystem adapter를 생성해 use case에 주입한다.
- [x] Presentation은 변경하지 않는다.
- [x] 외부 시스템 접근은 filesystem adapter에만 위치한다.
- [x] 전역 상태, 숨겨진 I/O, 암묵적 설정 접근을 추가하지 않는다.

Changed layers:

- [x] Application
- [x] Infrastructure
- [x] Extension composition
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Filesystem write in `FileSystemAnalysisStore` only.

RuntimeContext fields used:

- [x] `context.mainRepositoryPath`

New settings:

- [x] None.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 환경 값은 프로그램 시작 시 최초 1회만 수신한다는 기존 원칙을 변경하지 않는다.
- [x] 최초 수신 이후에는 환경 값을 전역 상수처럼 사용하지 않는다.
- [x] 환경 값은 context와 DI로 전달한다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 추가하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] Successful analysis keeps existing `skill.analysis.completed` Product Log event.
- [x] Metadata write failure adds `analysis.metadata.write.failed` Product Log event.
- [x] Product Log payload does not include full path, skill body, or raw secret-like values.

### Field Debug Log

- [x] Field Debug Log는 추가하지 않는다.
- [x] Future transition detail can use `analysis.metadata.transition`, but this task does not enable it.
- [x] 민감 정보 마스킹 기준 변경은 없다.
- [x] 보존 범위와 사용 범위 변경은 없다.

### Development Log

- [x] 테스트 실행 output만 Development Log 성격으로 취급한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 추가하지 않는다.
- [x] 테스트 전용 output은 Node test와 script 실행 결과에만 남긴다.

Product Log events:

- [x] `skill.analysis.completed`
- [x] `analysis.metadata.write.failed`

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] Runtime state machine은 explicit steps contract로 표현한다.
- [x] 상태 목록: `LoadingSources`, `ReadingSkillFiles`, `HashingSources`, `RunningRules`, `AggregatingDiagnostics`, `WritingAnalysisMetadata`, `Completed`.
- [x] 이벤트 목록: `SourcesLoaded`, `SourceHashed`, `RulesCompleted`, `MetadataWriteCompleted`, `MetadataWriteFailed`.
- [x] 전이 조건: `analysisStore`가 없으면 write step을 skip하고 기존 behavior를 유지한다.
- [x] 실패 상태: `SourceScanFailed`, `MetadataWriteFailed`.
- [x] 종료 상태: `Completed`.
- [x] 상태 전이는 result `steps`와 tests로 검증한다.

State machine required:

- [x] Explicit steps contract only; no separate state machine class.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: `analyzeAllSkills` metadata write calls.
- [x] 정상 케이스 테스트를 작성한다.
- [x] metadata write failure case 테스트를 작성한다.
- [x] unsafe skill id adapter test를 작성한다.
- [x] 외부 의존성은 fake analysisStore, fake hashPort, temp filesystem fixture로 대체한다.
- [x] 설정 값 전달 방식 테스트는 extension composition DI test로 검증한다.
- [x] 로그 정책 검증 테스트는 Product Log event result로 검증한다.
- [x] 상태 전이는 `steps`에 `HashingSources`, `WritingAnalysisMetadata`가 포함되는지 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

First failing tests:

- [x] `test/application/skill-operation-use-cases.test.mjs` failed because `analyzeAllSkills` did not write analysis metadata.
- [x] `test/infrastructure/file-system-analysis-store.test.mjs` failed until `FileSystemAnalysisStore` existed.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] `.tasks/release-smoke.md`의 Analyze/Diagnostics persistence checks는 후속 refresh integration task 이후 실행한다.

AGENTS.md rules checked:

- [x] Layered Architecture
- [x] Clean Architecture
- [x] Tidy First
- [x] TDD
- [x] Configuration Policy
- [x] Logging Policy
- [x] State Machine Policy

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 수정하거나 생성한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현으로 Application metadata write flow를 추가한다.
- [x] 최소 구현으로 FileSystemAnalysisStore를 추가한다.
- [x] Extension composition DI wiring을 추가한다.
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
- [x] 생성하거나 수정한 파일을 기록한다.
- [x] 실행한 테스트 명령과 결과를 기록한다.
- [x] 검증한 항목을 기록한다.
- [x] 남은 위험 요소를 기록한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.

Completion notes:

- Added `analysisStore` and `hashPort` inputs to `analyzeAllSkills` and wrote schemaVersion 1 metadata for each analyzed source.
- Added `FileSystemAnalysisStore` with encoded metadata filenames under `.sponzey/analysis/`.
- Wired the default filesystem analysis store through extension composition while keeping tests injectable with fakes.
- Added Product Log event `analysis.metadata.write.failed` for metadata write failures; kept successful analysis event `skill.analysis.completed`.
- Created or updated:
  - `src/application/skill/skill-operation-use-cases.js`
  - `src/infrastructure/filesystem/file-system-analysis-store.js`
  - `src/infrastructure/index.js`
  - `src/extension-composition.js`
  - `test/application/skill-operation-use-cases.test.mjs`
  - `test/infrastructure/file-system-analysis-store.test.mjs`
  - `test/extension-activation.test.mjs`
- Verified:
  - `node --test test/application/skill-operation-use-cases.test.mjs` passed.
  - `node --test test/infrastructure/file-system-analysis-store.test.mjs` passed.
  - `node --test test/extension-composition.test.mjs` passed.
  - `node --test test/extension-activation.test.mjs` passed.
  - `npm test` passed with 220 tests.
  - `npm run build` passed.
- Remaining risks:
  - Refresh does not read persisted metadata yet.
  - Stale marker is not computed yet.
  - Unsupported or malformed metadata is not surfaced by refresh yet.
- Follow-up:
  - Task 004 must connect persisted analysis metadata to `refreshSkills` read model before Diagnostics grouping.

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