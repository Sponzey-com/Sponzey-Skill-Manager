# Task 006. Source Applied And Diagnostic Detail DTO Enrichment

## 1. Task Purpose

- [x] `Show Skill Detail` 결과를 source/applied/diagnostic detail union으로 정규화한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.3의 detail read model 중 source, applied, diagnostic 범위를 수행한다.
- [x] 완료 후 tree item payload만으로 detail DTO가 충분한 상태 정보를 제공해야 한다.

## 2. Current Context

- [x] Task 005는 Diagnostics item에 source payload와 context menu를 추가했다.
- [x] 현재 `getSkillDetail`은 source와 applied detail만 제한적으로 반환한다.
- [x] 현재 diagnostic payload가 있어도 source payload가 같이 있으면 source detail이 먼저 반환된다.
- [x] 현재 source detail은 compatibility, analysisStatus, dependencies, sourceHash, description을 충분히 포함하지 않는다.
- [x] 현재 applied detail은 target client/scope/applyMode/hash 정보가 부족하다.

## 3. Scope

### Included

- [x] source detail에 description, riskLevel, analysisStatus, lastAnalyzedAt, dependencies, compatibility, appliedTargetCount, sourceHash를 포함한다.
- [x] applied detail에 targetId, clientType, scope, targetPath, applyMode, syncStatus, sourceId, sourceHash, targetHash, status를 포함한다.
- [x] diagnostic detail에 category, severity, sourceId, targetId, recommendation, filePath, line, relatedCommands를 포함한다.
- [x] `input.diagnostic`이 있으면 source/applied보다 diagnostic detail을 우선 반환한다.

### Excluded

- [x] backup detail DTO는 후속 태스크로 넘긴다.
- [x] command result renderer next-action 문구 변경은 제외한다.
- [x] Webview detail panel은 추가하지 않는다.
- [x] 외부 filesystem metadata read를 추가하지 않는다.
- [x] 새 설정을 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] Source detail DTO enrichment를 구현한다.
- [x] 입력: source tree item payload and optional source files result.
- [x] 출력: enriched source detail DTO.
- [x] 성공 조건: source detail에 analysis/risk/dependency/compatibility/hash fields가 보존된다.
- [x] 실패 조건: tree row에서 보이던 metadata가 detail 조회 후 사라진다.

### Functional Unit 2

- [x] Applied detail DTO enrichment를 구현한다.
- [x] 입력: appliedSkill tree item payload and optional target payload.
- [x] 출력: enriched applied detail DTO.
- [x] 성공 조건: applied detail에 client/scope/applyMode/hash/sync status가 포함된다.
- [x] 실패 조건: managed copy/symlink 상태와 target context를 detail에서 구분할 수 없다.

### Functional Unit 3

- [x] Diagnostic detail DTO를 구현한다.
- [x] 입력: diagnostic tree item payload with optional source/target payload.
- [x] 출력: diagnostic detail DTO with related command IDs.
- [x] 성공 조건: diagnostic detail이 source detail보다 우선하고 open/detail related commands를 표현한다.
- [x] 실패 조건: Diagnostics item detail이 source detail로 오인되어 diagnostic category/severity/recommendation이 사라진다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Application`, `Tests`, `Task documentation`.
- [x] Domain 계층은 변경하지 않는다.
- [x] Infrastructure 계층은 변경하지 않는다.
- [x] Presentation 계층은 변경하지 않는다.
- [x] Detail composition은 Application use case 책임으로 둔다.
- [x] 외부 파일 읽기는 기존 `skillRepository.readSourceSkillFiles` port만 사용한다.
- [x] diagnostic detail은 외부 I/O를 수행하지 않는다.
- [x] settings/env/process global을 읽지 않는다.

Changed layers:

- [x] Application
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Existing source file read through `skillRepository.readSourceSkillFiles` only.

RuntimeContext fields used:

- [x] None.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 새 configuration contribution을 추가하지 않는다.
- [x] 환경 값은 읽지 않는다.
- [x] 런타임 중간 설정 변경을 추가하지 않는다.
- [x] Detail use case는 함수 입력과 injected ports만 사용한다.

## 7. Logging Requirements

### Product Log

- [x] Detail 조회 성공은 Product Log를 추가하지 않는다.
- [x] Detail 조회 실패는 기존 failure result만 사용하고 새 Product Log event를 만들지 않는다.

### Field Debug Log

- [x] Field Debug Log를 추가하지 않는다.
- [x] Detail mapping 결과를 로그로 남기지 않는다.

### Development Log

- [x] 테스트 실행 output만 Development Log 성격으로 취급한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 추가하지 않는다.

Product Log events:

- [x] None.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] Runtime state machine은 explicit steps contract로 표현한다.
- [x] 상태 목록: `ResolvingItem`, `LoadingRelatedMetadata`, `MappingDetail`, `Completed`.
- [x] 실패 상태: `UnsupportedItem`, `SourceReadFailed`.
- [x] 종료 상태: `Completed`.
- [x] 상태 전이는 result `steps`와 tests로 검증한다.

State machine required:

- [x] Explicit steps contract only; no separate state machine class.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: source detail enrichment.
- [x] 테스트 대상: applied detail enrichment.
- [x] 테스트 대상: diagnostic detail priority and related commands.
- [x] 외부 의존성은 fake skillRepository로 대체한다.
- [x] 설정 값 전달 방식 테스트는 새 설정이 없음을 build/manifest validation으로 검증한다.
- [x] 로그 정책 검증은 runtime event 추가가 없음을 result로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

First failing tests:

- [x] `test/application/skill-operation-use-cases.test.mjs` should fail because source detail drops analysis metadata.
- [x] `test/application/skill-operation-use-cases.test.mjs` should fail because applied detail drops target/client/hash metadata.
- [x] `test/application/skill-operation-use-cases.test.mjs` should fail because diagnostic detail is not supported.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 source/applied/diagnostic item의 detail command를 확인한다.

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
- [x] 최소 구현으로 source detail fields를 추가한다.
- [x] 최소 구현으로 applied detail fields를 추가한다.
- [x] 최소 구현으로 diagnostic detail branch를 추가한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 추가되지 않았는지 확인한다.
- [x] 설정 값 전달 방식이 변경되지 않았는지 확인한다.
- [x] 로그가 추가되지 않았는지 확인한다.
- [x] 중복과 구조 문제를 정리한다.
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
- [x] 복잡한 흐름이 플래그 조합이 아니라 명시적 steps로 표현되었다.
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

- Enriched source detail DTO with description, analysisStatus, lastAnalyzedAt, sourceHash, lastAnalyzedSourceHash, dependencies, compatibility, diagnostics, appliedTargetCount, and files.
- Enriched applied detail DTO with applyMode, targetId, clientType, scope, targetRootPath, sourceHash, targetHash, lastCheckedAt, syncStatus, and diagnostics.
- Added diagnostic detail branch before source/applied branches so Diagnostics view detail actions preserve diagnostic category/severity/recommendation/location.
- Added related command IDs for source-backed diagnostics.
- Created or updated:
  - `src/application/skill/skill-operation-use-cases.js`
  - `test/application/skill-operation-use-cases.test.mjs`
- Verified first failing tests:
  - `node --test test/application/skill-operation-use-cases.test.mjs` failed before implementation and passed after implementation.
- Verified final commands:
  - `npm test` passed with 227 tests.
  - `npm run build` passed.
- Remaining risks:
  - Backup detail DTO is still not implemented.
  - Command result renderer next-action wording remains unchanged.
  - Manual Extension Host smoke for detail actions is still pending for release readiness.
- Follow-up:
  - Task 007 should implement backup detail DTO and backup item detail command contribution, or split command result renderer next-action if backup scope grows.

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