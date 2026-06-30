# Task 017. Multi-Root Project Target Management

## 1. Summary

- [x] 목적: multi-root workspace에서 Project Skill Target을 명시적으로 선택하고 root별로 표시한다.
- [x] 해결 문제: workspace root를 암묵 선택하면 잘못된 프로젝트에 skill이 적용될 수 있고, project target pattern 관리가 사용자에게 불명확해진다.
- [x] 완료 상태: project apply command가 workspace root를 명시 선택하고, Project Skills tree가 root별 target group을 표시한다.

## 2. Scope

### Included

- [x] multi-root project target selection
- [x] Project Skills tree grouping by workspace root
- [x] project target pattern add/remove validation

### Excluded

- [x] Global/custom target management
- [x] watcher lifecycle
- [x] compatibility analyzer rule 구현

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 009 multi-root target selection
- [x] `.tasks/plan.md` Phase 009 project target pattern management
- [x] `.tasks/plan.md` 9. Configuration And Runtime Environment Policy workspace roots
- [x] `AGENTS.md` 5. Runtime Environment Handling, 13.1 Main Repository vs Global Target

## 4. Dependencies

### Previous Tasks

- [x] Task 001. RuntimeSession And Explicit Recomposition
- [x] Task 006. Sync Read Model And Tree Mapping

### Next Tasks

- [x] Task 018. Global Custom Targets And Compatibility UX
- [x] Task 021. Watchers Debounce And Stale Analysis

## 5. Architecture Notes

- [x] 변경 계층: RuntimeContext workspace roots, Application target registry/read model, Presentation input collector/tree mapper, Infrastructure settings writer
- [x] 의존 방향: workspace roots는 activation/recomposition에서 수신하고 use case에 명시 전달한다.
- [x] 도메인 책임: target path collision and project target identity validation
- [x] 유스케이스 책임: project target registry calculation, add/remove target pattern result, apply root selection requirement
- [x] 인프라 책임: VSCode workspaceFolders read adapter와 settings writer adapter
- [x] 외부 시스템 접근 위치: VSCode workspace/settings 접근은 Infrastructure adapter와 recomposition boundary에서만 수행한다.

## 6. Functional Requirements

- [x] project apply command는 multi-root workspace에서 target root를 사용자에게 명시 선택하게 한다.
- [x] Project Skills tree는 workspace root별로 project target을 그룹화한다.
- [x] project target pattern add/remove는 main repository overlap, invalid pattern, applied entries impact를 검증한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: workspace root 목록은 activation/recomposition에서 1회 수신하고 RuntimeContext로 전달한다.
- [x] 로그 요구사항: project target add/remove completed/blocked는 Product Log, validation detail은 Field Debug Log로 분리한다.
- [x] 오류 처리: no workspace root, ambiguous root, invalid target pattern, overlap, settings write failure를 구분한다.
- [x] 테스트 가능성: workspace reader, settings writer, target registry는 fake로 대체한다.
- [x] 유지보수성: project target selection을 command handler 안의 ad hoc path concatenation으로 구현하지 않는다.

## 8. Implementation Steps

- [x] multi-root project apply input collector가 root를 선택하는 실패 테스트를 작성한다.
- [x] Project Skills tree가 root별 group을 반환하는 실패 테스트를 작성한다.
- [x] target pattern overlap validation 실패 테스트를 작성한다.
- [x] RuntimeContext workspace roots 전달을 확인한다.
- [x] target registry calculation use case를 구현한다.
- [x] project target add/remove settings writer command와 recomposition 연결을 구현한다.
- [x] `npm test`, `npm run build`, manifest check를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 multi-root input collector test를 먼저 작성한다.
- [x] target registry use case test를 fake workspace roots로 작성한다.
- [x] settings writer와 workspace reader는 테스트 더블로 대체한다.
- [x] workspace root 수신이 recomposition boundary에 한정되는지 테스트한다.
- [x] `target.validation.detail` and target add/remove Product event 후보를 검증한다.
- [x] no root, ambiguous root, overlap, settings write failure 오류 케이스를 테스트한다.
- [x] tree grouping mapper 정리는 기능 변경과 분리한다.

## 10. Validation Checklist

- [x] project target은 workspace root별로 명확히 표시된다.
- [x] Main Repository와 project target overlap이 차단된다.
- [x] Domain 계층은 VSCode workspaceFolders에 의존하지 않는다.
- [x] workspace roots는 command 중간에 재조회되지 않는다.
- [x] RuntimeContext와 explicit selected root로 target path가 전달된다.
- [x] 로그 event는 Product/Field Debug로 분리된다.
- [x] fake workspace/settings ports로 테스트할 수 있다.
- [x] target management 상태 전이가 명시적으로 테스트된다.
- [x] 기능 변경과 tree grouping 정리가 분리된다.

## 11. Logging Requirements

### Product Log

- [x] project target add/remove completed는 target scope, client type, result code만 기록한다.
- [x] blocked event는 overlap or confirmation reason만 기록한다.

### Field Debug Log

- [x] `target.validation.detail`은 workspace root id, pattern classification, masked target id를 기록한다.
- [x] full workspace path는 기록하지 않는다.

### Development Log

- [x] fake workspace root fixture detail은 테스트에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: target add/remove에는 명시 step contract가 필요하다.
- [x] 상태 목록: `SelectingTarget`, `ValidatingTarget`, `CheckingOverlap`, `CheckingAppliedEntries`, `WaitingForConfirmation`, `WritingSettings`, `RebuildingRuntime`, `Completed`
- [x] 이벤트 목록: `TargetSelected`, `TargetValidated`, `OverlapChecked`, `AppliedEntriesChecked`, `ConfirmationProvided`, `SettingsWritten`, `RuntimeRebuilt`
- [x] 전이 조건: overlap 또는 applied entries risk는 confirmation/blocked policy를 통과해야 한다.
- [x] 실패 상태: `SelectionCancelled`, `TargetRejected`, `AppliedEntriesBlocked`, `SettingsWriteFailed`, `RuntimeRebuildFailed`
- [x] 종료 상태: `Completed`
- [x] 상태 전이는 fake ports로 테스트한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] multi-root project target 관리가 Extension Host에서 검증된다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 018이 global/custom target UX를 같은 target registry contract로 확장할 수 있다.
