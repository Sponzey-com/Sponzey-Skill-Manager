# Task 016. Backup Promote And Delete

## 1. Summary

- [x] 목적: backup snapshot을 정식 Main Repository source로 승격하고, backup snapshot 삭제를 source 삭제와 분리된 use case로 제공한다.
- [x] 해결 문제: backup을 source와 동일하게 취급하면 snapshot 삭제가 source 삭제처럼 오해되거나 promoted source와 backup metadata가 불일치할 수 있다.
- [x] 완료 상태: `PromoteBackupToSkillSource`와 backup delete use case가 conflict guard, metadata update, target 불변 보장을 테스트로 만족한다.

## 2. Scope

### Included

- [x] promote backup to source
- [x] promoted backup metadata update
- [x] backup delete without deleting promoted source

### Excluded

- [x] backup scan/detail 구현
- [x] source archive import/export
- [x] transfer audit storage persistence

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 008 promote backup to source
- [x] `.tasks/plan.md` Phase 008 backup delete
- [x] `.tasks/plan.md` 10. Logging Strategy `skill.backup.promote.completed`
- [x] `AGENTS.md` 13.3 Backup vs Copy vs Move, 13.8 State Machine Choice

## 4. Dependencies

### Previous Tasks

- [x] Task 015. Backup Catalog And Detail

### Next Tasks

- [x] Task 019. Transfer Audit Trail And Event Wiring
- [x] Task 022. Release Gate Packaging And Documentation

## 5. Architecture Notes

- [x] 변경 계층: Domain backup promotion policy, Application promote/delete use cases, Infrastructure backup/source stores, Presentation guarded commands
- [x] 의존 방향: promote use case는 backup/source ports에 의존하고 filesystem copy/delete는 Infrastructure에서 수행한다.
- [x] 도메인 책임: backup/source namespace separation, promotion conflict rule, backup delete safety rule
- [x] 유스케이스 책임: validation, conflict check, copy backup to source, source metadata write, backup metadata update
- [x] 인프라 책임: backup snapshot read/delete, source directory write, metadata persistence
- [x] 외부 시스템 접근 위치: filesystem mutation은 Infrastructure backup/source adapters에서만 수행한다.

## 6. Functional Requirements

- [x] promote는 backup content를 `skills/<name>` 아래 source로 생성하고 existing source conflict를 overwrite하지 않는다.
- [x] promoted source metadata는 `originType: backup-promoted`와 source backup reference를 기록한다.
- [x] backup delete는 promoted source와 target을 삭제하지 않고 snapshot만 삭제한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: backup root와 source root는 RuntimeContext에서 전달하고 promote name은 explicit input으로 받는다.
- [x] 로그 요구사항: promote completed/blocked는 Product Log, promotion transition detail은 Field Debug Log로 분리한다.
- [x] 오류 처리: backup missing, invalid metadata, name conflict, write failure, metadata update failure를 구분한다.
- [x] 테스트 가능성: backup store와 source repository는 fake ports로 대체한다.
- [x] 유지보수성: backup delete command와 source delete command는 command id, result code, test name에서 분리한다.

## 8. Implementation Steps

- [x] promote conflict block 실패 테스트를 작성한다.
- [x] promote success가 `backup-promoted` source metadata를 기록하는 실패 테스트를 작성한다.
- [x] backup delete가 promoted source를 삭제하지 않는 실패 테스트를 작성한다.
- [x] promote state machine 또는 transition contract를 구현한다.
- [x] backup/source store port 호출과 metadata update를 구현한다.
- [x] Presentation command와 confirmation input을 연결한다.
- [x] `npm test`, `npm run build`, manifest check를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 promote use case test를 먼저 작성한다.
- [x] backup delete use case test를 fake ports로 작성한다.
- [x] backup/source filesystem dependencies는 테스트 더블로 대체한다.
- [x] RuntimeContext root와 explicit promote name 전달 방식을 테스트한다.
- [x] `skill.backup.promote.completed`, `backup.promote.transition` event 후보를 검증한다.
- [x] backup missing, invalid metadata, conflict, write failure 오류 케이스를 테스트한다.
- [x] backup/source terminology 정리는 기능 변경과 분리한다.

## 10. Validation Checklist

- [x] promoted source는 Main Repository `skills/` 아래에만 생성된다.
- [x] backup promote/delete는 target을 변경하지 않는다.
- [x] promote policy가 UI handler나 filesystem adapter에 없다.
- [x] promote/delete 중 settings/env를 재조회하지 않는다.
- [x] RuntimeContext, backup id, promote name, confirmation으로 input이 전달된다.
- [x] 로그 event는 Product/Field Debug로 분리된다.
- [x] fake ports로 외부 의존성을 대체할 수 있다.
- [x] promote 상태 전이가 명시적으로 테스트된다.
- [x] 기능 변경과 naming/metadata 정리가 분리된다.

## 11. Logging Requirements

### Product Log

- [x] `skill.backup.promote.completed`는 backup id, promoted source id, result code만 기록한다.
- [x] promote blocked event는 conflict reason 또는 invalid metadata code만 기록한다.

### Field Debug Log

- [x] `backup.promote.transition`은 operation id, fromState, toState, masked backup id를 기록한다.
- [x] snapshot full path와 file content는 기록하지 않는다.

### Development Log

- [x] fake backup/source operation order는 테스트에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 필요하다. backup read, conflict check, source write, metadata update 실패 분기가 있다.
- [x] 상태 목록: `ValidatingInput`, `LoadingBackup`, `CheckingNameConflict`, `CopyingBackupToSource`, `WritingSourceMetadata`, `UpdatingBackupMetadata`, `Completed`
- [x] 이벤트 목록: `PromoteRequested`, `BackupLoaded`, `ConflictChecked`, `SourceCopied`, `SourceMetadataWritten`, `BackupMetadataUpdated`
- [x] 전이 조건: name conflict는 source write로 이동하지 않는다.
- [x] 실패 상태: `InvalidInput`, `BackupMissing`, `InvalidBackupMetadata`, `NameConflictBlocked`, `WriteFailed`
- [x] 종료 상태: `Completed`
- [x] 상태 전이는 fake ports로 테스트한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Backup catalog gate의 promote/delete 조건이 충족된다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 019가 promote/copy/backup/move operation을 audit trail로 기록할 수 있다.