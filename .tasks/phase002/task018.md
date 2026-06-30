# Task 018. Global Custom Targets And Compatibility UX

## 1. Summary

- [x] 목적: Global Target과 custom client target을 명확히 추가/삭제하고 analyzer compatibility result를 apply 선택에 표시한다.
- [x] 해결 문제: Codex/Claude/custom target 의미가 UI에서 섞이면 Main Repository와 target을 혼동하거나 incompatible skill을 잘못 적용할 수 있다.
- [x] 완료 상태: Global Skills tree가 client type별로 그룹화되고 custom target은 label/clientType/path를 가지며 compatibility warning이 apply UX에 표시된다.

## 2. Scope

### Included

- [x] global target add/remove hardening
- [x] custom target label/clientType/targetPath support
- [x] compatibility warning display in apply target choices

### Excluded

- [x] multi-root project target selection
- [x] analyzer compatibility rule implementation
- [x] logger infrastructure

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 009 global target add/remove UX hardening
- [x] `.tasks/plan.md` Phase 009 custom client type and compatibility display
- [x] `.tasks/plan.md` 12.1 target management boundary
- [x] `AGENTS.md` 13.1 Main Repository vs Global Target, 13.5 Risk Policy

## 4. Dependencies

### Previous Tasks

- [x] Task 011. Analyzer Security Dependency Compatibility Rules
- [x] Task 017. Multi-Root Project Target Management

### Next Tasks

- [x] Task 019. Logger Ports Adapters And Masking
- [x] Task 021. Watchers Debounce And Stale Analysis

## 5. Architecture Notes

- [x] 변경 계층: RuntimeContext target definitions, Application target registry, Presentation input collector/tree mapper, Infrastructure settings writer
- [x] 의존 방향: target validation policy는 Domain/Application에 있고 settings writer는 Infrastructure에 둔다.
- [x] 도메인 책임: target identity, client type, source/target collision, compatibility warning semantics
- [x] 유스케이스 책임: add/remove target, target choice enrichment, confirmation guard
- [x] 인프라 책임: VSCode settings update and path existence/writable check adapter
- [x] 외부 시스템 접근 위치: path existence/writable check는 Infrastructure validation adapter에서만 수행한다.

## 6. Functional Requirements

- [x] Global Skills tree는 Codex, Claude, custom client type별로 target을 그룹화한다.
- [x] custom target add command는 label, clientType, targetPath를 수집하고 validation result를 반환한다.
- [x] apply target selection은 analyzer compatibility warning과 risk summary를 표시한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: target 추가/삭제는 settings writer port로만 수행하고 성공 후 explicit recomposition을 호출한다.
- [x] 로그 요구사항: target add/remove completed/blocked는 Product Log, validation detail은 Field Debug Log로 분리한다.
- [x] 오류 처리: invalid path, not writable, main repository overlap, duplicate target, incompatible skill warning을 구분한다.
- [x] 테스트 가능성: settings writer, path validator, analyzer compatibility result는 fake로 대체한다.
- [x] 유지보수성: custom client type을 hard-coded UI branch가 아니라 target registry data로 처리한다.

## 8. Implementation Steps

- [x] custom target input collector 실패 테스트를 작성한다.
- [x] Global Skills tree client type grouping 실패 테스트를 작성한다.
- [x] apply target choice compatibility warning 실패 테스트를 작성한다.
- [x] target registry DTO를 custom target에 맞게 확장한다.
- [x] settings writer add/remove command와 recomposition을 연결한다.
- [x] package manifest command/menu contribution을 갱신한다.
- [x] `npm test`, `npm run build`, manifest check를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 custom target use case test를 먼저 작성한다.
- [x] target selection Presentation test를 fake compatibility result로 작성한다.
- [x] settings/path validation/analyzer dependency는 테스트 더블로 대체한다.
- [x] settings writer result 후 recomposition 호출 테스트를 작성한다.
- [x] target add/remove Product event와 `target.validation.detail` Field Debug event 후보를 검증한다.
- [x] duplicate, overlap, not writable, incompatible warning 케이스를 테스트한다.
- [x] target registry DTO 정리는 기능 변경과 분리한다.

## 10. Validation Checklist

- [x] Codex/Claude/custom target이 UI와 read model에서 구분된다.
- [x] Main Repository를 Global Target으로 암묵 취급하지 않는다.
- [x] Domain 계층은 VSCode settings/path API에 의존하지 않는다.
- [x] target add/remove 중 settings/env를 숨겨진 helper로 읽지 않는다.
- [x] RuntimeContext와 explicit command input으로 target 정보가 전달된다.
- [x] 로그 event는 Product/Field Debug로 분리된다.
- [x] fake ports로 외부 의존성을 대체할 수 있다.
- [x] target management step contract가 테스트된다.
- [x] 기능 변경과 command/menu 정리가 분리된다.

## 11. Logging Requirements

### Product Log

- [x] target add/remove completed는 target scope, client type, masked target id, result code만 기록한다.
- [x] blocked event는 duplicate/overlap/not writable reason만 기록한다.

### Field Debug Log

- [x] `target.validation.detail`은 path classification, writable check result, client type을 masked id로 기록한다.
- [x] full path와 user file content는 기록하지 않는다.

### Development Log

- [x] fake target registry and path validator calls는 테스트에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: target add/remove flow에는 명시 step contract가 필요하다.
- [x] 상태 목록: `SelectingTarget`, `ValidatingTarget`, `CheckingOverlap`, `CheckingAppliedEntries`, `WaitingForConfirmation`, `WritingSettings`, `RebuildingRuntime`, `Completed`
- [x] 이벤트 목록: `TargetSelected`, `TargetValidated`, `OverlapChecked`, `ConfirmationProvided`, `SettingsWritten`, `RuntimeRebuilt`
- [x] 전이 조건: duplicate/overlap/not writable이면 settings write로 이동하지 않는다.
- [x] 실패 상태: `SelectionCancelled`, `TargetRejected`, `SettingsWriteFailed`, `RuntimeRebuildFailed`
- [x] 종료 상태: `Completed`
- [x] 상태 전이는 fake ports로 테스트한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Global/custom target UX가 Extension Host에서 검증된다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 019가 target add/remove events를 logger port에 연결할 수 있다.
