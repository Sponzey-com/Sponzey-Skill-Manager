# Task 012. Apply Mode Conversion And External-To-Managed Flow

## 1. Summary

- [x] 목적: applied skill의 symlink/copy 모드를 안전하게 전환하고 external target skill을 Main Repository 중심 관리 상태로 전환한다.
- [x] 해결 문제: 사용자가 적용 방식을 바꾸거나 외부 skill을 관리 대상으로 가져올 때 target overwrite, source 혼동, 사용자 수정 손실 위험이 있다.
- [x] 완료 상태: `ConvertAppliedSkillMode`와 `ImportExternalAppliedSkillAndReplaceTarget`가 confirmation, sync guard, metadata write, result verification을 수행한다.

## 2. Scope

### Included

- [x] symlink -> copy conversion
- [x] copy -> symlink conversion
- [x] external -> managed copy/symlink flow

### Excluded

- [x] copy update from source
- [x] source delete/export/import
- [x] backup catalog/promote

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 006 convert symlink to copy, convert copy to symlink
- [x] `.tasks/plan.md` Phase 006 external to managed copy/symlink
- [x] `.tasks/plan.md` 7.1 Transfer state gate
- [x] `AGENTS.md` 13.3 Backup vs Copy vs Move, 13.4 Symlink vs Copy Apply

## 4. Dependencies

### Previous Tasks

- [x] Task 009. Analyze Commands And Copy Update With Sync Guard
- [x] Task 011. Analyzer Security Dependency Compatibility Rules

### Next Tasks

- [x] Task 013. Source Rename Delete And Impact Guard
- [x] Task 016. Backup Promote And Delete

## 5. Architecture Notes

- [x] 변경 계층: Domain conversion policy, Application conversion/import use cases, Infrastructure source/target adapters, Presentation confirmation input
- [x] 의존 방향: Presentation은 confirmation만 수집하고 conversion decision은 Domain/Application에 둔다.
- [x] 도메인 책임: conversion allowed/block rule, external preservation rule, sync guard
- [x] 유스케이스 책임: loading applied skill, calculating sync, planning conversion, calling source/target ports, verifying metadata
- [x] 인프라 책임: target directory remove/copy/symlink, source import, metadata write
- [x] 외부 시스템 접근 위치: filesystem write/remove/symlink는 Infrastructure adapters에서만 수행한다.

## 6. Functional Requirements

- [x] symlink -> copy는 source를 유지하고 target symlink를 제거한 뒤 source content를 target directory로 copy한다.
- [x] copy -> symlink는 target changed 상태에서 confirmation 없이는 block하고, confirmation 후 target copy를 symlink로 바꾼다.
- [x] external -> managed는 먼저 Main Repository에 source를 copy/import하고 target replace 여부를 explicit confirmation으로 받는다.

## 7. Non-Functional Requirements

- [x] 설정 관리: destructive/overwrite behavior를 settings로 숨기지 않고 explicit confirmation input으로만 허용한다.
- [x] 로그 요구사항: conversion completed/blocked는 Product Log, transition/hash detail은 Field Debug Log로 분리한다.
- [x] 오류 처리: target missing, source missing, external import conflict, local modification, verification failure를 구분한다.
- [x] 테스트 가능성: source repository, target store, sync calculator, analyzer는 fake ports로 대체한다.
- [x] 유지보수성: external skill은 기본 보존 정책을 유지하고 replace는 명시 input 없이는 실행하지 않는다.

## 8. Implementation Steps

- [x] symlink -> copy conversion 실패 테스트를 작성한다.
- [x] copy -> symlink target changed block 실패 테스트를 작성한다.
- [x] external -> managed source import 후 target metadata write 실패 테스트를 작성한다.
- [x] conversion state machine 또는 step contract를 구현한다.
- [x] source/target adapter port 호출을 최소 구현한다.
- [x] command input collector에 confirmation DTO를 연결한다.
- [x] `npm test`, `npm run build`, manifest check를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 conversion use case test를 먼저 작성한다.
- [x] external-to-managed use case test를 fake ports로 작성한다.
- [x] filesystem write/remove/symlink는 fake target store로 대체한다.
- [x] confirmation input이 settings가 아닌 DTO로 전달되는지 테스트한다.
- [x] `conversion.transition`, conversion completed/blocked event 후보를 검증한다.
- [x] target changed, conflict, write failure, verification failure 오류 케이스를 테스트한다.
- [x] shared transfer metadata helper 정리는 Tidy First로 분리한다.

## 10. Validation Checklist

- [x] symlink/copy conversion이 source를 삭제하지 않는다.
- [x] external skill은 confirmation 없이 target replace 되지 않는다.
- [x] conversion policy는 UI handler나 filesystem adapter에 없다.
- [x] conversion 중 settings/env를 재조회하지 않는다.
- [x] RuntimeContext, item payload, explicit confirmation으로 input이 전달된다.
- [x] 로그 event는 Product/Field Debug로 분리된다.
- [x] fake ports로 외부 의존성을 대체할 수 있다.
- [x] conversion 상태 전이가 명시적으로 테스트된다.
- [x] 기능 변경과 transfer helper 정리가 분리된다.

## 11. Logging Requirements

### Product Log

- [x] conversion completed는 operation type, apply mode before/after, masked target id만 기록한다.
- [x] conversion blocked는 block reason과 required confirmation만 기록한다.

### Field Debug Log

- [x] `conversion.transition`은 operation id, fromState, toState, event, masked target id를 기록한다.
- [x] hash comparison detail은 masked id와 hash prefix로 제한한다.

### Development Log

- [x] fake target operation order는 테스트에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 필요하다. filesystem write, confirmation, verification failure가 있다.
- [x] 상태 목록: `ValidatingInput`, `LoadingAppliedSkill`, `CalculatingSync`, `PlanningConversion`, `WaitingForConfirmation`, `WritingTarget`, `WritingMetadata`, `VerifyingResult`, `Completed`
- [x] 이벤트 목록: `ConversionRequested`, `SyncCalculated`, `PlanCreated`, `ConfirmationProvided`, `TargetWritten`, `MetadataWritten`, `Verified`
- [x] 전이 조건: local modification과 external replace는 confirmation 없이는 write 단계로 이동하지 않는다.
- [x] 실패 상태: `InvalidInput`, `TargetMissing`, `SourceMissing`, `LocalModificationBlocked`, `ConflictDetected`, `WriteFailed`, `VerificationFailed`
- [x] 종료 상태: `Completed`
- [x] 상태 전이는 fake ports와 transition tests로 검증한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Transfer state gate를 통과한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 013/016이 transfer policy와 metadata output을 이어받을 수 있다.
