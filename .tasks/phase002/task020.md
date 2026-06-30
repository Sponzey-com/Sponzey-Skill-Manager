# Task 020. Transfer Audit Trail And Event Wiring

## 1. Summary

- [x] 목적: copy, backup, move, promote, conversion 같은 transfer operation의 audit trail을 저장하고 logger event wiring을 완성한다.
- [x] 해결 문제: transfer 결과가 tree notification으로만 남으면 어떤 source/target/backup 작업이 언제 수행되었는지 추적하기 어렵다.
- [x] 완료 상태: transfer audit store가 operation type, masked source/target reference, status, diagnostics, timestamp를 저장하고 logger port와 중복되지 않게 연결된다.

## 2. Scope

### Included

- [x] transfer operation audit store
- [x] copy/backup/move/promote/conversion event wiring
- [x] audit read model or diagnostic query baseline

### Excluded

- [x] remote telemetry
- [x] full user file history
- [x] release gate documentation

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 010 transfer operation audit store
- [x] `.tasks/plan.md` 10. Logging Strategy transfer events
- [x] `.tasks/plan.md` 13. Risk logger sensitive exposure
- [x] `AGENTS.md` 6. Logging Policy, 13.3 Backup vs Copy vs Move

## 4. Dependencies

### Previous Tasks

- [x] Task 012. Apply Mode Conversion And External-To-Managed Flow
- [x] Task 016. Backup Promote And Delete
- [x] Task 019. Logger Ports Adapters And Masking

### Next Tasks

- [x] Task 021. Watchers Debounce And Stale Analysis
- [x] Task 022. Release Gate Packaging And Documentation

## 5. Architecture Notes

- [x] 변경 계층: Application audit event DTO/port, Infrastructure audit store adapter, Presentation optional audit read model
- [x] 의존 방향: transfer use cases emit audit event DTO; Infrastructure persists audit records.
- [x] 도메인 책임: transfer operation type semantics and status value
- [x] 유스케이스 책임: operation id, operation type, status, diagnostics, source/target references 생성
- [x] 인프라 책임: `.sponzey/transfer-log.json` 또는 index store append/read adapter
- [x] 외부 시스템 접근 위치: audit file write/read는 Infrastructure audit adapter에서만 수행한다.

## 6. Functional Requirements

- [x] audit record는 operation type, operation id, source reference, destination reference, status, diagnostic codes, timestamp를 포함한다.
- [x] copy/backup/move/promote/conversion completed/blocked/failed result가 audit store에 기록된다.
- [x] audit record와 Product Log event는 역할이 구분되어 중복된 민감 정보를 기록하지 않는다.

## 7. Non-Functional Requirements

- [x] 설정 관리: audit store path는 RuntimeContext main repository path에서 파생해 explicit adapter path로 전달한다.
- [x] 로그 요구사항: Product Log는 summary, audit store는 masked references와 operation history, Field Debug Log는 transition detail로 분리한다.
- [x] 오류 처리: audit write failure는 primary operation result를 덮어쓰지 않고 secondary diagnostic으로 반환한다.
- [x] 테스트 가능성: fake audit store와 temp fixture adapter test를 모두 작성한다.
- [x] 유지보수성: audit schema version을 포함하고 corrupt audit file은 diagnostic + append recovery 전략을 가진다.

## 8. Implementation Steps

- [x] transfer audit record schema 실패 테스트를 작성한다.
- [x] copy/backup/move/promote/conversion operation이 audit record를 append하는 실패 테스트를 작성한다.
- [x] audit write failure가 primary operation을 실패로 덮지 않는 테스트를 작성한다.
- [x] audit store port와 filesystem adapter를 구현한다.
- [x] transfer use cases 또는 command wrapper에서 audit event wiring을 구현한다.
- [x] audit read baseline 또는 diagnostic command를 최소 구현한다.
- [x] `npm test`, `npm run build`를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 audit schema test를 먼저 작성한다.
- [x] use case/wrapper audit wiring test를 fake audit store로 작성한다.
- [x] audit filesystem adapter는 temp fixture로 검증한다.
- [x] audit store path가 RuntimeContext에서 전달되는지 테스트한다.
- [x] Product Log와 audit record payload masking을 각각 검증한다.
- [x] corrupt audit file, append failure, read failure 오류 케이스를 테스트한다.
- [x] audit event DTO 정리는 기능 wiring과 분리한다.

## 10. Validation Checklist

- [x] transfer operation history를 audit record로 추적할 수 있다.
- [x] audit store가 Domain 또는 UI에 직접 의존하지 않는다.
- [x] Domain 계층은 audit file write/read에 의존하지 않는다.
- [x] audit 중 settings/env를 재조회하지 않는다.
- [x] RuntimeContext와 explicit operation event로 audit path와 payload가 전달된다.
- [x] Product/Field/Development Log와 audit store 역할이 분리된다.
- [x] fake audit store로 외부 의존성을 대체할 수 있다.
- [x] transfer 상태머신 terminal/failure state가 audit event로 변환된다.
- [x] 기능 변경과 schema/adapter 정리가 분리된다.

## 11. Logging Requirements

### Product Log

- [x] Product Log는 transfer completed/blocked/failed summary만 기록한다.
- [x] audit payload 전체를 Product Log에 복제하지 않는다.

### Field Debug Log

- [x] transition detail은 existing `conversion.transition`, `backup.promote.transition`, `source.delete.transition` events를 사용한다.
- [x] Field Debug Log에는 full source/target path를 기록하지 않는다.

### Development Log

- [x] fake audit append order와 fixture file names는 테스트에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: audit store 자체에는 불필요하지만 transfer terminal/failure state mapping이 필요하다.
- [x] 상태 목록: `CollectingEvent`, `MaskingPayload`, `AppendingAuditRecord`, `Completed`
- [x] 이벤트 목록: `TransferCompleted`, `TransferBlocked`, `TransferFailed`, `AuditWritten`, `AuditWriteFailed`
- [x] 전이 조건: audit write failure는 secondary diagnostic으로만 추가한다.
- [x] 실패 상태: `AuditUnavailable`, `AuditWriteFailed`, `AuditCorrupt`
- [x] 종료 상태: `Completed` 또는 `CompletedWithAuditDiagnostic`
- [x] mapping은 fake audit store로 테스트한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] transfer audit trail이 민감 정보 없이 기록된다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 022 release smoke가 audit behavior를 검증할 수 있다.
