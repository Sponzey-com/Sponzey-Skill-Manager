# Task 021. Watchers Debounce And Stale Analysis

## 1. Summary

- [x] 목적: Main Repository와 target file changes를 감지해 debounced refresh를 수행하고 stale analysis/missing source/target 상태를 표시한다.
- [x] 해결 문제: 사용자가 파일을 외부에서 수정해도 tree가 stale 상태를 보여주지 않으면 sync status와 risk status를 신뢰할 수 없다.
- [x] 완료 상태: watcher lifecycle이 RuntimeSession recomposition과 연결되고, duplicate watcher 없이 refresh invalidation과 stale marker가 동작한다.

## 2. Scope

### Included

- [x] `WatcherPort` and fake watcher test harness
- [x] debounce refresh controller
- [x] stale analysis marker and missing source/target detection

### Excluded

- [x] incremental hash optimization
- [x] release packaging
- [x] external telemetry

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 011 watchers, refresh invalidation, stale analysis
- [x] `.tasks/plan.md` 7.1 Watcher lifecycle gate
- [x] `.tasks/plan.md` 10. Logging Strategy watcher events
- [x] `AGENTS.md` 7. State Machine Policy, 5. Runtime Environment Handling

## 4. Dependencies

### Previous Tasks

- [x] Task 001. RuntimeSession And Explicit Recomposition
- [x] Task 006. Sync Read Model And Tree Mapping
- [x] Task 019. Logger Ports Adapters And Masking

### Next Tasks

- [x] Task 022. Release Gate Packaging And Documentation

## 5. Architecture Notes

- [x] 변경 계층: Application refresh invalidation use case, Infrastructure watcher adapter, Presentation/extension debounce controller, RuntimeSession dispose contract
- [x] 의존 방향: watcher adapter emits events; Application/Presentation boundary requests refresh; Domain does not know watcher.
- [x] 도메인 책임: stale analysis status and missing source/target value semantics
- [x] 유스케이스 책임: refresh recomputation and stale/missing diagnostic output
- [x] 인프라 책임: filesystem watcher registration/dispose/event emission
- [x] 외부 시스템 접근 위치: file watching은 Infrastructure watcher adapter에서만 수행한다.

## 6. Functional Requirements

- [x] watcher event는 read model을 직접 mutate하지 않고 debounced refresh invalidation을 요청한다.
- [x] source `SKILL.md` 변경 시 `analysisStatus: stale`을 표시한다.
- [x] runtime recomposition 시 old watcher dispose가 호출되고 새 RuntimeContext path로 watcher가 재등록된다.

## 7. Non-Functional Requirements

- [x] 설정 관리: watcher paths는 RuntimeContext에서 전달하며 watcher 중간에 settings를 재조회하지 않는다.
- [x] 로그 요구사항: watcher registration failure는 Product Log, event/debounce detail은 Field Debug Log로 분리한다.
- [x] 오류 처리: watcher registration failure, refresh failure, tree update failure를 구분한다.
- [x] 테스트 가능성: watcher tests는 fake watcher port와 fake timer/debounce scheduler를 사용한다.
- [x] 유지보수성: watcher adapter는 sync/analyzer policy를 결정하지 않는다.

## 8. Implementation Steps

- [x] watcher event가 debounced refresh를 한 번만 호출하는 실패 테스트를 작성한다.
- [x] source change event가 stale analysis marker를 유발하는 실패 테스트를 작성한다.
- [x] recomposition 시 old watcher dispose가 호출되는 실패 테스트를 작성한다.
- [x] `WatcherPort`와 fake watcher harness를 구현한다.
- [x] debounce controller와 RuntimeSession watcher lifecycle 연결을 구현한다.
- [x] RefreshSkills output에 stale/missing status를 연결한다.
- [x] `npm test`, `npm run build`를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 watcher lifecycle test를 먼저 작성한다.
- [x] refresh invalidation use case test를 fake watcher/fake timer로 작성한다.
- [x] filesystem watcher는 fake port로 대체하고 adapter smoke는 temp directory만 사용한다.
- [x] watcher path가 RuntimeContext에서 전달되는지 테스트한다.
- [x] `watcher.registration.failed`, `watcher.event.received`, `watcher.debounce.completed` event 후보를 검증한다.
- [x] registration failure, refresh failure, duplicate watcher 오류 케이스를 테스트한다.
- [x] debounce controller 정리는 기능 변경과 분리한다.

## 10. Validation Checklist

- [x] 파일 변경 후 tree refresh가 debounce되어 한 번만 실행된다.
- [x] stale analysis와 missing source/target 상태가 표시된다.
- [x] Domain 계층은 watcher API에 의존하지 않는다.
- [x] watcher 중 settings/env를 재조회하지 않는다.
- [x] RuntimeContext와 explicit watcher registration input으로 path가 전달된다.
- [x] 로그 event는 Product/Field Debug로 분리된다.
- [x] fake watcher와 fake timer로 테스트할 수 있다.
- [x] watcher refresh state가 명시적으로 테스트된다.
- [x] 기능 변경과 debounce/lifecycle 정리가 분리된다.

## 11. Logging Requirements

### Product Log

- [x] `watcher.registration.failed`는 masked target id와 failure code만 기록한다.
- [x] 정상 file event는 Product Log에 기록하지 않는다.

### Field Debug Log

- [x] `watcher.event.received`와 `watcher.debounce.completed`는 event type, masked path id, debounce count만 기록한다.
- [x] full path와 file contents는 기록하지 않는다.

### Development Log

- [x] fake timer ticks와 fake watcher events는 테스트에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 필요하다. invalidation, debounce, refresh, tree update, failure 분기가 있다.
- [x] 상태 목록: `Idle`, `Invalidated`, `Debouncing`, `Refreshing`, `UpdatingTree`, `Idle`
- [x] 이벤트 목록: `WatcherEventReceived`, `DebounceElapsed`, `RefreshStarted`, `RefreshCompleted`, `TreeUpdated`, `FailureDetected`
- [x] 전이 조건: debounce window 안의 여러 event는 하나의 refresh로 합쳐진다.
- [x] 실패 상태: `WatcherRegistrationFailed`, `RefreshFailed`, `TreeUpdateFailed`
- [x] 종료 상태: `Idle`
- [x] 상태 전이는 fake timer와 fake watcher로 테스트한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Watcher lifecycle gate를 통과한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 022 release smoke가 watcher/stale analysis 흐름을 검증할 수 있다.
