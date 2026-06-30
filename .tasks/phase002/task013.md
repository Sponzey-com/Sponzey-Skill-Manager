# Task 013. Source Rename Delete And Impact Guard

## 1. Summary

- [x] 목적: Main Repository source rename/delete를 applied target impact analysis와 backup guard를 포함해 안전하게 구현한다.
- [x] 해결 문제: source delete와 target remove가 혼동되거나, symlink applied target이 있는 source를 삭제해 link break와 데이터 손실이 발생할 수 있다.
- [x] 완료 상태: `RenameSourceSkill`과 `DeleteSourceSkill`이 conflict, applied impact, confirmation, optional backup, verification을 명확히 처리한다.

## 2. Scope

### Included

- [x] source rename use case
- [x] source delete use case with applied impact analysis
- [x] delete-before-backup option and confirmation guard

### Excluded

- [x] zip export/import
- [x] backup catalog tree
- [x] target remove command 변경

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 007 rename source, delete source, applied target impact analysis
- [x] `.tasks/plan.md` 7.1 Source lifecycle safety gate
- [x] `.tasks/plan.md` 13. Risk source delete data loss
- [x] `AGENTS.md` 13.2 Remove vs Delete, 13.3 Backup vs Copy vs Move

## 4. Dependencies

### Previous Tasks

- [x] Task 012. Apply Mode Conversion And External-To-Managed Flow

### Next Tasks

- [x] Task 014. Source Archive Export And Zip Import
- [x] Task 015. Backup Catalog And Detail

## 5. Architecture Notes

- [x] 변경 계층: Domain source lifecycle policy, Application rename/delete use cases, Infrastructure source repository/backup adapter, Presentation confirmation input
- [x] 의존 방향: delete/rename policy는 Domain/Application에 있고 filesystem adapter는 rename/delete/copy만 수행한다.
- [x] 도메인 책임: source delete vs applied remove 구분, applied impact risk, backup recommended rule
- [x] 유스케이스 책임: impact analysis, confirmation guard, optional backup plan, source rename/delete output
- [x] 인프라 책임: source directory rename/delete, backup snapshot write
- [x] 외부 시스템 접근 위치: filesystem mutation은 Infrastructure repository/backup adapter에서만 수행한다.

## 6. Functional Requirements

- [x] rename은 existing source conflict와 invalid name/path traversal을 block한다.
- [x] delete는 applied symlink/copy impact count를 계산하고 confirmation 없이는 risky delete를 block한다.
- [x] delete with backup은 backup snapshot을 먼저 만든 뒤 source를 삭제하고 target copy는 삭제하지 않는다.

## 7. Non-Functional Requirements

- [x] 설정 관리: delete default behavior는 settings로 바꾸지 않고 explicit confirmation/backup option DTO로 전달한다.
- [x] 로그 요구사항: source rename/delete completed/blocked는 Product Log, applied impact detail은 Field Debug Log로 분리한다.
- [x] 오류 처리: source missing, name conflict, applied risk, backup failure, delete failure, verification failure를 구분한다.
- [x] 테스트 가능성: source repository, target store, backup store는 fake ports로 대체한다.
- [x] 유지보수성: source delete command와 applied remove command의 이름, result code, tests를 분리한다.

## 8. Implementation Steps

- [x] rename conflict block 실패 테스트를 작성한다.
- [x] applied symlink가 있는 source delete가 confirmation 없이 block되는 실패 테스트를 작성한다.
- [x] delete with backup이 backup snapshot을 만든 뒤 source를 삭제하는 실패 테스트를 작성한다.
- [x] source lifecycle policy와 impact analysis use case를 구현한다.
- [x] source repository/backup store port 호출을 구현한다.
- [x] Presentation confirmation input을 command handler에 연결한다.
- [x] `npm test`, `npm run build`, manifest check를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 source lifecycle policy test를 먼저 작성한다.
- [x] rename/delete use case test를 fake ports로 작성한다.
- [x] filesystem mutation은 fake repository/backup store로 대체한다.
- [x] confirmation과 backup option이 explicit input으로 전달되는지 테스트한다.
- [x] `skill.source.rename.completed`, `skill.source.delete.completed`, `skill.source.delete.blocked`, `source.delete.transition` event 후보를 검증한다.
- [x] source missing, conflict, applied impact, backup failure 오류 케이스를 테스트한다.
- [x] source lifecycle naming 정리는 기능 변경과 분리한다.

## 10. Validation Checklist

- [x] source delete는 applied remove와 다른 command/use case/result code다.
- [x] delete는 target copy를 삭제하지 않는다.
- [x] delete policy가 UI handler나 filesystem adapter에 없다.
- [x] delete/rename 중 settings/env를 재조회하지 않는다.
- [x] RuntimeContext, source id, confirmation, backup option으로 input이 전달된다.
- [x] 로그 event는 Product/Field Debug로 분리된다.
- [x] fake ports로 외부 의존성을 대체할 수 있다.
- [x] delete 상태 전이가 명시적으로 테스트된다.
- [x] 기능 변경과 naming/mapper 정리가 분리된다.

## 11. Logging Requirements

### Product Log

- [x] `skill.source.rename.completed`는 old/new source id와 result code만 기록한다.
- [x] `skill.source.delete.completed`와 `skill.source.delete.blocked`는 impact count와 block reason만 기록한다.

### Field Debug Log

- [x] `source.delete.transition`은 state transition, masked source id, impact category를 기록한다.
- [x] applied target full path와 skill body는 기록하지 않는다.

### Development Log

- [x] fake repository operation order는 테스트에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: delete에는 필요하고 rename은 conflict guard step으로 충분하다.
- [x] 상태 목록: `ValidatingInput`, `LoadingSource`, `FindingAppliedTargets`, `PlanningBackup`, `WaitingForConfirmation`, `WritingBackup`, `DeletingSource`, `VerifyingTargets`, `Completed`
- [x] 이벤트 목록: `DeleteRequested`, `ImpactAnalyzed`, `BackupPlanned`, `ConfirmationProvided`, `BackupWritten`, `SourceDeleted`, `TargetsVerified`
- [x] 전이 조건: applied impact risk가 있으면 confirmation 또는 backup plan 없이는 delete로 이동하지 않는다.
- [x] 실패 상태: `InvalidInput`, `SourceMissing`, `AppliedTargetRiskBlocked`, `BackupFailed`, `DeleteFailed`, `VerificationFailed`
- [x] 종료 상태: `Completed`
- [x] 상태 전이는 fake ports로 테스트한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Source lifecycle safety gate를 통과한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 014와 Task 015가 source lifecycle/backup contract를 이어받을 수 있다.