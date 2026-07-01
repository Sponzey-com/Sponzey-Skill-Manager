# Task 004. Refresh Analysis Metadata Read Model Integration

## 1. Task Purpose

- [x] `analyzeAllSkills`가 저장한 repository-local analysis metadata를 `refreshSkills` read model에 연결한다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 003.2-B 잔여 항목과 Phase 003.2-C 진입 조건을 해결한다.
- [x] 완료 후 refresh는 Analyze 결과를 notification/transient provider에만 의존하지 않고 persisted metadata를 source read model과 Diagnostics에 반영해야 한다.

## 2. Current Context

- [x] Task 001은 Phase 003 release smoke checklist와 release gate baseline을 만들었다.
- [x] Task 002는 Diagnostics tree item이 diagnostic DTO payload를 보존하도록 정리했다.
- [x] Task 003은 `analysisStore.writeAnalysisMetadata`와 filesystem `.sponzey/analysis/` write adapter를 추가했다.
- [x] 현재 `refreshSkills`는 `analysisStore.readAnalysisMetadata`를 사용하지 않는다.
- [x] 현재 Analyze 후 refresh를 실행하면 persisted analysis diagnostics가 read model에 병합된다는 보장이 없다.
- [x] Diagnostics grouping, source detail action, tree command UX는 이번 태스크에서 구현하지 않는다.

## 3. Scope

### Included

- [x] `refreshSkills`가 optional `analysisStore.readAnalysisMetadata`를 통해 source별 persisted metadata를 읽는다.
- [x] source read model에 `riskLevel`, `lastAnalyzedAt`, `analysisStatus`, `diagnostics`, `dependencies`, `compatibility`, `sourceHash`를 병합한다.
- [x] persisted diagnostics를 refresh read model `diagnostics`에 source attribution과 함께 병합한다.
- [x] 현재 source hash와 metadata `sourceHash`가 다르면 `analysisStatus: "stale"`로 표시한다.
- [x] unsupported/invalid metadata를 refresh 실패로 전파하지 않고 diagnostic으로 표시한다.
- [x] extension composition이 refresh use case에도 `analysisStore`를 명시적으로 주입한다.

### Excluded

- [x] Diagnostics tree severity/category grouping은 제외한다.
- [x] Diagnostics item open/detail action은 제외한다.
- [x] Analyze notification action text 변경은 제외한다.
- [x] 새 설정 또는 auto analyze 설정은 추가하지 않는다.
- [x] metadata schema migration writer는 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] Refresh persisted metadata read flow를 구현한다.
- [x] 입력: `context.mainRepositoryPath`, scanned source list, optional `analysisStore`, optional `hashPort`.
- [x] 출력: source read model의 persisted analysis summary fields.
- [x] 성공 조건: metadata가 존재하는 source는 `riskLevel`, `lastAnalyzedAt`, `diagnostics`, `dependencies`, `compatibility`, `analysisStatus`를 가진다.
- [x] 실패 조건: read metadata가 있어도 source read model에 표시되지 않는다.

### Functional Unit 2

- [x] Persisted diagnostics를 refresh diagnostics에 병합한다.
- [x] 입력: metadata diagnostics array.
- [x] 출력: read model `diagnostics` entries with `sourceId`, `skillName`, `category`, `severity`, `recommendation`.
- [x] 성공 조건: refresh 후 Diagnostics provider가 analysis diagnostic payload를 잃지 않는다.
- [x] 실패 조건: Analyze 후 refresh에서 diagnostics가 사라진다.

### Functional Unit 3

- [x] Stale/invalid metadata 상태를 failure가 아닌 diagnostic/read model status로 표현한다.
- [x] 입력: current source hash, metadata `sourceHash`, metadata read error.
- [x] 출력: `analysisStatus: "current" | "stale" | "unknown"` and non-fatal diagnostics.
- [x] 성공 조건: stale hash는 source status로 표시되고 invalid/unsupported metadata는 refresh 전체를 실패시키지 않는다.
- [x] 실패 조건: invalid metadata가 refresh를 실패시키거나 stale 상태가 숨겨진다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Application`, `Infrastructure`, `Extension composition`, `Tests`, `Task documentation`.
- [x] Domain 계층은 변경하지 않는다.
- [x] Application은 `analysisStore`를 port-like object로만 사용한다.
- [x] Infrastructure는 filesystem metadata read와 schema validation 결과를 machine-readable result로 반환한다.
- [x] Extension composition은 concrete filesystem adapter를 생성하되 use case에는 DI로 전달한다.
- [x] Presentation tree grouping은 변경하지 않는다.
- [x] 외부 filesystem read는 `FileSystemAnalysisStore` 안에만 위치한다.
- [x] refresh use case는 VSCode settings, process env, global mutable state를 읽지 않는다.

Changed layers:

- [x] Application
- [x] Infrastructure
- [x] Extension composition
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Filesystem metadata read in `FileSystemAnalysisStore` only.

RuntimeContext fields used:

- [x] `context.mainRepositoryPath`

New settings:

- [x] None.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 환경 값은 프로그램 시작 시 최초 1회만 수신한다는 기존 원칙을 변경하지 않는다.
- [x] 최초 수신 이후에는 환경 값을 전역 상수처럼 사용하지 않는다.
- [x] metadata store는 extension composition에서 생성하고 refresh use case에는 명시적 인자로 전달한다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 추가하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] Successful refresh keeps existing `skills.refresh.completed` Product Log event.
- [x] Metadata read failure does not add Product Log unless it changes refresh completion state; in this task it is represented as Diagnostics only.
- [x] Product Log payload does not include full path, skill body, raw diagnostic body, or secret-like values.

### Field Debug Log

- [x] Metadata read summary may use `analysis.metadata.read.completed` only if existing logger route supports it through result events.
- [x] This task does not add new Field Debug Log events unless tests require explicit transition visibility.
- [x] Field Debug payload must use `sourceId`, `status`, and counts, not full source path.

### Development Log

- [x] 테스트 실행 output만 Development Log 성격으로 취급한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 추가하지 않는다.
- [x] 테스트 전용 output은 Node test와 script 실행 결과에만 남긴다.

Product Log events:

- [x] `skills.refresh.completed`
- [x] `skills.refresh.failed`

Field Debug Log events:

- [x] None by default.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] Runtime state machine은 explicit steps contract로 표현한다.
- [x] 상태 목록: `LoadingSources`, `HashingSources`, `LoadingAnalysisMetadata`, `LoadingTargets`, `MatchingSources`, `CalculatingReadModel`, `Completed`.
- [x] 이벤트 목록: `SourcesLoaded`, `SourceHashed`, `AnalysisMetadataLoaded`, `AnalysisMetadataMissing`, `AnalysisMetadataInvalid`, `ReadModelCalculated`.
- [x] 전이 조건: `analysisStore`가 없으면 `LoadingAnalysisMetadata` step을 skip하고 기존 behavior를 유지한다.
- [x] 실패 상태: `SourceScanFailed`, `TargetScanFailed`.
- [x] 비치명 상태: `AnalysisMetadataMissing`, `AnalysisMetadataInvalid`, `AnalysisMetadataUnsupportedVersion`, `AnalysisMetadataReadFailed`.
- [x] 종료 상태: `Completed`.
- [x] 상태 전이는 result `steps`와 tests로 검증한다.

State machine required:

- [x] Explicit steps contract only; no separate state machine class.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: `refreshSkills` persisted metadata read/merge flow.
- [x] 정상 케이스 테스트를 작성한다.
- [x] stale hash case 테스트를 작성한다.
- [x] unsupported/invalid metadata case 테스트를 작성한다.
- [x] filesystem adapter read validation 테스트를 작성한다.
- [x] 외부 의존성은 fake analysisStore, fake hashPort, temp filesystem fixture로 대체한다.
- [x] 설정 값 전달 방식 테스트는 extension composition refresh DI test로 검증한다.
- [x] 로그 정책 검증 테스트는 Product Log event가 path/body를 포함하지 않는지 result로 검증한다.
- [x] 상태 전이는 `steps`에 `LoadingAnalysisMetadata`가 포함되는지 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

First failing tests:

- [x] `test/application/refresh-skills.test.mjs` failed because `refreshSkills` did not read analysis metadata.
- [x] `test/infrastructure/file-system-analysis-store.test.mjs` failed for unsupported schema version handling until adapter returned `analysis-metadata-unsupported-version`.
- [x] `test/extension-composition.test.mjs` failed until refresh command passed `analysisStore` to `refreshSkills`.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] `.tasks/release-smoke.md`의 Analyze/Refresh persistence check는 자동 테스트 통과 후 후속 Diagnostics grouping task에서 수동 확인한다.

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
- [x] 최소 구현으로 Application metadata read flow를 추가한다.
- [x] 최소 구현으로 source read model metadata merge를 추가한다.
- [x] 최소 구현으로 persisted diagnostics merge를 추가한다.
- [x] 최소 구현으로 stale status 계산을 추가한다.
- [x] 최소 구현으로 FileSystemAnalysisStore read validation code를 명확히 분리한다.
- [x] Extension composition DI wiring을 refresh path에 추가한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] 필요한 로그를 정책에 맞게 유지한다.
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
- [x] 외부 filesystem read가 `FileSystemAnalysisStore` 밖에 추가되지 않는다.
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

- Added optional `analysisStore` read flow to `refreshSkills`.
- Merged persisted analysis metadata into source read model fields: `riskLevel`, `lastAnalyzedAt`, `analysisStatus`, `diagnostics`, `dependencies`, `compatibility`, and stale `lastAnalyzedSourceHash`.
- Merged persisted analysis diagnostics into refresh diagnostics with `sourceId` and `skillName`.
- Added non-fatal handling for unsupported analysis metadata schema versions.
- Wired `analysisStore` into the refresh path in extension composition.
- Created or updated:
  - `src/application/refresh/refresh-skills.js`
  - `src/infrastructure/filesystem/file-system-analysis-store.js`
  - `src/extension-composition.js`
  - `test/application/refresh-skills.test.mjs`
  - `test/infrastructure/file-system-analysis-store.test.mjs`
  - `test/extension-composition.test.mjs`
- Verified first failing tests:
  - `node --test test/application/refresh-skills.test.mjs` failed before implementation and passed after implementation.
  - `node --test test/infrastructure/file-system-analysis-store.test.mjs` failed before implementation and passed after implementation.
  - `node --test test/extension-composition.test.mjs` failed before implementation and passed after implementation.
- Verified final commands:
  - `npm test` passed with 224 tests.
  - `npm run build` passed.
- Remaining risks:
  - Diagnostics tree is still a flat list and does not yet group by severity/category.
  - Diagnostics item does not yet expose source open/detail actions.
  - Source tree display does not yet surface `analysisStatus` in a user-friendly description.
- Follow-up:
  - Task 005 must implement Diagnostics Explorer grouping and source action payloads using persisted diagnostics now available from refresh.

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
