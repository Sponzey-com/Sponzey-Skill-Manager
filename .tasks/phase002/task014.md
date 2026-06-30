# Task 014. Source Archive Export And Portable Archive Import

## 1. Summary

- [x] 목적: Main Repository source를 portable archive bundle로 export하고 archive를 source로 import하는 안전한 archive flow를 구현한다.
- [x] 해결 문제: skill 공유/복구를 위해 archive 기능이 필요하지만 path traversal과 invalid metadata를 막지 않으면 repository가 오염될 수 있다.
- [x] 완료 상태: `ExportSourceSkill`과 `ImportSkillArchiveToMainRepository`가 archive port를 통해 동작하고, traversal guard와 conflict guard가 테스트된다.

## 2. Scope

### Included

- [x] source portable archive export
- [x] portable archive import to Main Repository source
- [x] archive path traversal and metadata validation guard

### Excluded

- [x] backup catalog promote
- [x] remote GitHub install
- [x] VSIX packaging

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 007 export source archive, import archive
- [x] `.tasks/plan.md` 12.2 `SkillArchiveStore`
- [x] `.tasks/plan.md` 16. Prohibited Implementation Patterns path safety implications
- [x] `AGENTS.md` 2. Architecture Rules, 11. Prohibited Patterns

## 4. Dependencies

### Previous Tasks

- [x] Task 013. Source Rename Delete And Impact Guard

### Next Tasks

- [x] Task 015. Backup Catalog And Detail
- [x] Task 020. Release Gate Packaging And Documentation

## 5. Architecture Notes

- [x] 변경 계층: Application archive use cases, Infrastructure archive adapter, Domain archive validation policy
- [x] 의존 방향: Application depends on repository/archive port, Infrastructure implements portable archive read/write.
- [x] 도메인 책임: archive entry path validation, source name validation, conflict policy
- [x] 유스케이스 책임: export/import orchestration, metadata validation, conflict output
- [x] 인프라 책임: portable archive creation/import, archive file handling
- [x] 외부 시스템 접근 위치: archive filesystem operations are in Infrastructure only.

## 6. Functional Requirements

- [x] export는 `SKILL.md`, source files, source metadata를 archive에 포함한다.
- [x] import는 archive name/source name conflict를 overwrite하지 않고 explicit conflict result를 반환한다.
- [x] archive entry path traversal, absolute path, parent directory escape를 차단한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: export destination과 import archive path는 explicit input이며 settings/env에서 중간 조회하지 않는다.
- [x] 로그 요구사항: export/import completed/failed는 Product Log, archive validation detail은 Field Debug Log로 분리한다.
- [x] 오류 처리: missing source, invalid archive, traversal detected, name conflict, write failure를 구분한다.
- [x] 테스트 가능성: archive store는 temp fixture로, use case는 fake archive store로 테스트한다.
- [x] 유지보수성: archive extraction은 staging directory를 사용하고 partial import cleanup contract를 둔다.

## 8. Implementation Steps

- [x] export archive가 `SKILL.md`와 metadata를 포함하는 실패 테스트를 작성한다.
- [x] portable archive import path traversal reject 실패 테스트를 작성한다.
- [x] import name conflict block 실패 테스트를 작성한다.
- [x] `SkillArchiveStore` port와 adapter contract를 정의한다.
- [x] export/import use case와 cleanup/failure output을 구현한다.
- [x] command descriptors와 input collector를 연결한다.
- [x] `npm test`, `npm run build`, manifest check를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 archive validation test를 먼저 작성한다.
- [x] export/import use case test를 fake archive store로 작성한다.
- [x] portable archive adapter는 temp fixture로 검증한다.
- [x] archive path와 destination이 explicit input으로 전달되는지 테스트한다.
- [x] export/import log event 후보가 full path를 노출하지 않는지 검증한다.
- [x] traversal, invalid archive, conflict, partial write failure 오류 케이스를 테스트한다.
- [x] archive adapter helper 정리는 기능 변경과 분리한다.

## 10. Validation Checklist

- [x] export/import command가 source lifecycle로 제공된다.
- [x] archive adapter가 domain policy를 결정하지 않는다.
- [x] Domain 계층은 archive library 또는 filesystem에 의존하지 않는다.
- [x] archive 작업 중 settings/env를 재조회하지 않는다.
- [x] archive path와 source name은 explicit input으로 전달된다.
- [x] 로그 event는 Product/Field Debug로 분리된다.
- [x] fake archive store로 use case를 테스트할 수 있다.
- [x] import/export는 explicit step contract로 오류를 표현한다.
- [x] 기능 변경과 adapter cleanup이 분리된다.

## 11. Logging Requirements

### Product Log

- [x] source export completed/failed는 source id, archive type, result code만 기록한다.
- [x] source import completed/failed는 origin type, source id, result code만 기록한다.

### Field Debug Log

- [x] archive validation detail은 entry count, rejected entry reason, masked archive id만 기록한다.
- [x] file contents와 full archive path는 기록하지 않는다.

### Development Log

- [x] temp archive fixture detail은 테스트에서만 Development Log로 사용할 수 있다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 명시 step contract가 필요하다. archive staging과 cleanup failure가 있다.
- [x] 상태 목록: `ValidatingInput`, `ReadingSource`, `WritingArchive`, `ValidatingArchive`, `StagingImport`, `WritingSource`, `CleaningUp`, `Completed`
- [x] 이벤트 목록: `ExportRequested`, `SourceRead`, `ArchiveWritten`, `ImportRequested`, `ArchiveValidated`, `SourceWritten`, `CleanupCompleted`
- [x] 전이 조건: traversal detected 또는 conflict detected 시 source write로 이동하지 않는다.
- [x] 실패 상태: `InvalidInput`, `SourceMissing`, `InvalidArchive`, `TraversalDetected`, `NameConflictBlocked`, `WriteFailed`, `CleanupFailed`
- [x] 종료 상태: `Completed`
- [x] step transition은 fake archive store로 테스트한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] source archive export/import가 path traversal guard와 함께 동작한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 020 release documentation이 archive 사용법을 문서화할 수 있다.
