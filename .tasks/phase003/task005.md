# Task 005. Diagnostics Explorer Grouping And Source Actions

## 1. Task Purpose

- [x] Diagnostics view를 flat list에서 severity/category/source를 식별할 수 있는 explorer 구조로 바꾼다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 003.2-C "Diagnostics grouping, stale marker, detail action" 중 Presentation 중심 범위를 수행한다.
- [x] 완료 후 사용자는 Diagnostics view에서 위험 수준과 category를 먼저 보고, source가 연결된 diagnostic에서 `SKILL.md` 열기와 detail 확인을 실행할 수 있어야 한다.

## 2. Current Context

- [x] Task 004는 persisted analysis metadata를 refresh read model에 병합했다.
- [x] 현재 Diagnostics tree는 diagnostic item을 루트 바로 아래에 flat list로 표시한다.
- [x] 현재 diagnostic item은 diagnostic DTO는 보존하지만 source command payload를 갖지 않는다.
- [x] 현재 diagnostics view에는 diagnostic source를 대상으로 하는 context menu command가 없다.
- [x] source read model에는 `analysisStatus`가 있지만 main repository row description에서 stale 상태를 보여주지 않는다.

## 3. Scope

### Included

- [x] Diagnostics tree를 `severity -> category -> diagnostic item` 구조로 grouping한다.
- [x] source가 식별되는 diagnostic item에 `source` payload와 `contextValue: "sponzeyDiagnosticWithSource"`를 부여한다.
- [x] diagnostics view context menu에 `Show Skill Detail`과 `Open SKILL.md`를 source diagnostic item용으로 추가한다.
- [x] source row description에 `analysis stale` marker를 표시한다.
- [x] 기존 diagnostic DTO payload 보존 규칙을 유지한다.

### Excluded

- [x] Application read model schema는 변경하지 않는다.
- [x] Infrastructure adapter는 변경하지 않는다.
- [x] 새로운 command를 추가하지 않는다.
- [x] Webview 기반 diagnostic detail panel은 추가하지 않는다.
- [x] Analyze notification action text 변경은 제외한다.

## 4. Functional Units

### Functional Unit 1

- [x] Diagnostics grouping mapper를 구현한다.
- [x] 입력: read model `diagnostics` array.
- [x] 출력: Diagnostics root children grouped by severity and category.
- [x] 성공 조건: warning dependency diagnostic은 `warning` group의 `dependency` category 아래에 표시된다.
- [x] 실패 조건: diagnostic이 flat list로만 표시되어 severity/category 탐색이 불가능하다.

### Functional Unit 2

- [x] Diagnostic item source payload와 context menu를 구현한다.
- [x] 입력: diagnostic `sourceId`, main repository source read model.
- [x] 출력: diagnostic tree item with `diagnostic`, `source`, and source-capable `contextValue`.
- [x] 성공 조건: Diagnostics view에서 source diagnostic에 `Open SKILL.md`와 `Show Skill Detail` context menu가 기여된다.
- [x] 실패 조건: diagnostic item에서 source command가 input prompt로 다시 돌아가거나 source payload를 잃는다.

### Functional Unit 3

- [x] Source row stale marker를 구현한다.
- [x] 입력: source read model `analysisStatus`.
- [x] 출력: source row description containing `analysis stale` only when stale.
- [x] 성공 조건: stale source가 Main Repository에서 즉시 구분된다.
- [x] 실패 조건: stale 상태가 Diagnostics를 열기 전에는 보이지 않는다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Presentation`, `Manifest`, `Tests`, `Task documentation`.
- [x] Domain 계층은 변경하지 않는다.
- [x] Application 계층은 변경하지 않는다.
- [x] Infrastructure 계층은 변경하지 않는다.
- [x] Presentation mapper는 read model 데이터를 표시 구조로만 변환한다.
- [x] Diagnostic grouping policy는 tree display policy로 유지하고 위험 판단 로직을 재구현하지 않는다.
- [x] 외부 I/O를 추가하지 않는다.
- [x] VSCode settings, process env, filesystem에 접근하지 않는다.

Changed layers:

- [x] Presentation
- [x] Manifest
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] None.

RuntimeContext fields used:

- [x] None.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 새 configuration contribution을 추가하지 않는다.
- [x] 환경 값은 읽지 않는다.
- [x] 런타임 중간 설정 변경을 추가하지 않는다.
- [x] Presentation mapper는 함수 입력으로 받은 read model만 사용한다.

## 7. Logging Requirements

### Product Log

- [x] Product Log를 추가하지 않는다.
- [x] UI grouping 변경은 runtime Product Log event를 생성하지 않는다.

### Field Debug Log

- [x] Field Debug Log를 추가하지 않는다.
- [x] Diagnostic grouping 결과를 로그로 남기지 않는다.

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

- [x] Runtime state machine은 필요하지 않다.
- [x] Tree mapping은 pure transformation으로 유지한다.
- [x] 상태 목록: `MappingDiagnostics`, `GroupingBySeverity`, `GroupingByCategory`, `MappingDiagnosticItems`, `Completed`.
- [x] 실패 상태는 runtime state로 두지 않고 tests에서 invalid read model 입력을 검증한다.
- [x] 종료 상태: mapped tree items returned.

State machine required:

- [x] No separate state machine class.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: `mapSkillsReadModelToTreeItems` diagnostics grouping.
- [x] 테스트 대상: diagnostic item source payload and context value.
- [x] 테스트 대상: diagnostics view context menu manifest contribution.
- [x] 테스트 대상: source stale marker description.
- [x] 외부 의존성은 사용하지 않는다.
- [x] 설정 값 전달 방식 테스트는 새 설정이 없음을 manifest/build validation으로 검증한다.
- [x] 로그 정책 검증은 runtime event 추가가 없음을 코드 변경 범위로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

First failing tests:

- [x] `test/presentation/tree-view-model.test.mjs` should fail because diagnostics are not grouped.
- [x] `test/presentation/tree-view-model.test.mjs` should fail because diagnostic source payload is not attached.
- [x] `test/presentation/tree-view-model.test.mjs` should fail because diagnostics context menu contributions are missing.
- [x] `test/presentation/tree-view-model.test.mjs` should fail because stale source description does not show `analysis stale`.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 Analyze 후 Diagnostics view grouping과 source item context menu를 확인한다.

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
- [x] 최소 구현으로 Diagnostics grouping mapper를 추가한다.
- [x] 최소 구현으로 diagnostic item source payload를 추가한다.
- [x] 최소 구현으로 diagnostics view context menu manifest를 추가한다.
- [x] 최소 구현으로 source stale description marker를 추가한다.
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
- [x] 유스케이스가 변경되지 않았고 명시적 입력/출력 원칙을 훼손하지 않는다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 I/O가 추가되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 유지되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 상태머신이 필요한 runtime flow를 새로 만들지 않았다.
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

- Changed Diagnostics view mapping from a flat list to `severity -> category -> diagnostic item`.
- Added diagnostic item context values:
  - `sponzeyDiagnosticWithSource` when the diagnostic has a known source.
  - `sponzeyDiagnostic` when the diagnostic has no source action payload.
- Attached source payloads to source-backed diagnostic items so existing `Open SKILL.md` and `Show Skill Detail` commands can run without prompting for a source.
- Added Diagnostics view context menu contributions for `Show Skill Detail` and `Open SKILL.md`.
- Added `analysis stale` marker to Main Repository source row descriptions when `analysisStatus === "stale"`.
- Updated manifest validation to allow diagnostics-specific tree item context values.
- Created or updated:
  - `src/presentation/tree-view-model.js`
  - `package.json`
  - `scripts/extension-manifest-rules.mjs`
  - `test/presentation/tree-view-model.test.mjs`
  - `test/presentation/tree-data-provider.test.mjs`
  - `test/extension-activation.test.mjs`
- Verified first failing tests:
  - `node --test test/presentation/tree-view-model.test.mjs` failed before implementation and passed after implementation.
  - `npm test` initially failed on activation/tree-provider/manifest drift and passed after updating those contracts.
- Verified final commands:
  - `node --test test/extension-activation.test.mjs` passed.
  - `node --test test/presentation/tree-data-provider.test.mjs` passed.
  - `node --test test/scripts/extension-manifest-rules.test.mjs` passed.
  - `npm run build` passed.
  - `npm test` passed with 225 tests.
- Remaining risks:
  - Diagnostic detail still uses existing source detail behavior and does not yet provide a dedicated diagnostic detail DTO.
  - Analyze notification still does not offer a direct "open Diagnostics" action text.
  - Source/applied/backup detail read models still need product-level enrichment in Phase 003.3.
- Follow-up:
  - Task 006 should implement source/applied/backup/diagnostic detail read model enrichment without changing Infrastructure boundaries.

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
