# Task 015. Backup Catalog And Detail

## 1. Summary

- [x] 목적: backup snapshot을 source와 분리된 catalog로 scan하고 detail을 조회할 수 있게 한다.
- [x] 해결 문제: backup이 Main Repository source와 섞이면 snapshot 삭제/승격 의미가 흐려지고 target을 변경하지 않는 backup 원칙이 약해진다.
- [x] 완료 상태: `ListSkillBackups`와 `GetBackupDetail`이 backup metadata를 검증하고 valid/invalid backup을 read model과 diagnostics로 표시한다.

## 2. Scope

### Included

- [x] backup scan/list use case
- [x] backup detail use case
- [x] backup metadata validation diagnostics

### Excluded

- [x] promote backup to source
- [x] backup delete
- [x] dedicated custom webview

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 008 backup scan, backup tree/read model, backup detail
- [x] `.tasks/plan.md` 7.1 Backup catalog gate
- [x] `.tasks/plan.md` 13. Risk backup/source confusion
- [x] `AGENTS.md` 13.3 Backup vs Copy vs Move

## 4. Dependencies

### Previous Tasks

- [x] Task 013. Source Rename Delete And Impact Guard
- [x] Task 014. Source Archive Export And Zip Import

### Next Tasks

- [x] Task 016. Backup Promote And Delete
- [x] Task 019. Transfer Audit Trail And Event Wiring

## 5. Architecture Notes

- [x] 변경 계층: Domain backup value objects, Application backup use cases, Infrastructure backup store adapter, Presentation read model mapper
- [x] 의존 방향: Application depends on backup store port, Infrastructure implements scan/read.
- [x] 도메인 책임: backup identity, metadata validity, promoted/source separation semantics
- [x] 유스케이스 책임: backup list/detail DTO and diagnostics aggregation
- [x] 인프라 책임: backup root scan, metadata JSON parse, file summary read
- [x] 외부 시스템 접근 위치: filesystem scan/read는 Infrastructure backup store adapter에서만 수행한다.

## 6. Functional Requirements

- [x] backup scan은 valid backup metadata만 정상 목록에 포함하고 invalid metadata는 diagnostic으로 표시한다.
- [x] backup detail은 source origin, createdAt, operation type, source/target summary, diagnostics를 포함한다.
- [x] backup read model은 source read model과 다른 type/contextValue를 사용한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: backup root는 RuntimeContext main repository path에서 파생해 explicit adapter path로 전달한다.
- [x] 로그 요구사항: backup list 성공은 Product Log를 남기지 않고 metadata parse detail은 Field Debug Log로 제한한다.
- [x] 오류 처리: backup root missing, invalid metadata, unreadable snapshot, empty catalog를 구분한다.
- [x] 테스트 가능성: backup store는 fake port와 temp fixture adapter test로 검증한다.
- [x] 유지보수성: backup aggregate와 source aggregate를 type, command, context menu에서 분리한다.

## 8. Implementation Steps

- [x] valid/invalid backup metadata scan 실패 테스트를 작성한다.
- [x] backup detail DTO 실패 테스트를 작성한다.
- [x] backup tree/read model type separation 실패 테스트를 작성한다.
- [x] backup store port와 metadata parser를 구현한다.
- [x] `ListSkillBackups`와 `GetBackupDetail` use case를 구현한다.
- [x] Presentation tree/detail mapper에 backup section 또는 diagnostics view mapping을 연결한다.
- [x] `npm test`, `npm run build`를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 backup metadata parser test를 먼저 작성한다.
- [x] list/detail use case test를 fake backup store로 작성한다.
- [x] filesystem scan은 temp fixture adapter test로 검증한다.
- [x] backup root 전달 방식이 RuntimeContext 기반인지 테스트한다.
- [x] invalid metadata Field Debug Log 후보가 full path를 노출하지 않는지 검증한다.
- [x] missing root, invalid metadata, unreadable snapshot 오류 케이스를 테스트한다.
- [x] backup/source naming 정리는 기능 변경과 분리한다.

## 10. Validation Checklist

- [x] backup catalog가 source list와 분리되어 표시된다.
- [x] backup list/detail은 target을 변경하지 않는다.
- [x] Domain 계층은 filesystem backup scan에 의존하지 않는다.
- [x] backup 조회 중 settings/env를 재조회하지 않는다.
- [x] backup root는 RuntimeContext에서 명시 전달된다.
- [x] 로그 event는 list 성공을 과도하게 기록하지 않는다.
- [x] fake backup store로 테스트할 수 있다.
- [x] backup catalog scan은 read-only step contract로 충분하다.
- [x] backup/source 분리 정리와 catalog 기능 구현이 분리된다.

## 11. Logging Requirements

### Product Log

- [x] backup list 성공은 Product Log를 기록하지 않는다.
- [x] backup detail failure는 error code와 masked backup id만 Product Log 후보로 반환한다.

### Field Debug Log

- [x] backup metadata parse detail은 `backup.metadata.detail` 후보로 schema version, error category, masked backup id만 기록한다.
- [x] snapshot file contents와 full path는 기록하지 않는다.

### Development Log

- [x] backup fixture names와 fake store calls는 테스트에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 불필요하다. catalog/detail은 read-only flow다.
- [x] 상태 목록: `ScanningBackups`, `ParsingMetadata`, `MappingReadModel`, `Completed`
- [x] 이벤트 목록: `BackupRootScanned`, `MetadataParsed`, `InvalidMetadataFound`, `ReadModelMapped`
- [x] 전이 조건: invalid metadata는 diagnostic으로 변환하고 valid list scan은 계속한다.
- [x] 실패 상태: `BackupRootMissing`, `SnapshotUnreadable`, `MetadataInvalid`
- [x] 종료 상태: `CompletedWithDiagnostics` 또는 `Completed`
- [x] step output은 use case test로 검증한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Backup catalog gate의 namespace separation 조건이 충족된다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 016이 backup id/detail output을 사용해 promote/delete를 구현할 수 있다.