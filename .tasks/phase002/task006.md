# Task 006. Sync Read Model And Tree Mapping

## 1. Summary

- [x] 목적: Task 004/005의 metadata와 sync status를 `RefreshSkills` read model과 tree item에 연결한다.
- [x] 해결 문제: sync status가 계산되어도 tree와 command payload에 표시되지 않으면 사용자가 copy drift, missing source, broken symlink를 판단할 수 없다.
- [x] 완료 상태: Main Repository tree와 Global/Project tree가 `syncStatus`, `lastCheckedAt`, `appliedTargetCount`, hash summary를 read model 기반으로 표시한다.

## 2. Scope

### Included

- [x] `RefreshSkills` read model enrichment
- [x] source/applied tree item mapping for sync status
- [x] empty/error/degraded state display for metadata/index/sync failures

### Excluded

- [x] hash policy 구현 변경
- [x] copy update command
- [x] watcher refresh invalidation

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 003 read model enrichment
- [x] `.tasks/plan.md` 7.1 Metadata read model gate
- [x] `.tasks/plan.md` 8. Cross-Phase TDD Strategy
- [x] `AGENTS.md` 2. Architecture Rules, 10. Code Review Checklist

## 4. Dependencies

### Previous Tasks

- [x] Task 004. Repository Metadata Schema And Index Cache
- [x] Task 005. HashPort And Sync Status Policy

### Next Tasks

- [x] Task 007. Open Commands And Opener Port
- [x] Task 009. Copy Update With Sync Guard

## 5. Architecture Notes

- [x] 변경 계층: Application refresh use case/read model, Presentation tree mapper/tree provider
- [x] 의존 방향: Presentation은 read model을 표시만 하고 sync 계산을 재구현하지 않는다.
- [x] 도메인 책임: sync status value와 applied/source count semantics 제공
- [x] 유스케이스 책임: source list, target list, metadata, sync calculation output을 하나의 read model로 조합한다.
- [x] 인프라 책임: 없음. Task 004/005 port를 사용한다.
- [x] 외부 시스템 접근 위치: refresh use case가 port를 호출하며 Presentation은 filesystem을 직접 읽지 않는다.

## 6. Functional Requirements

- [x] source read model에 `riskLevel`, `lastAnalyzedAt`, `sourceHash`, `appliedTargetCount`를 포함한다.
- [x] applied read model에 `syncStatus`, `sourceHash`, `targetHash`, `lastCheckedAt`, `applyMode`를 포함한다.
- [x] tree item description/icon/contextValue가 `External`, `Broken Symlink`, `Missing Source`, `Target Changed` 같은 상태를 구분한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: refresh는 전달받은 RuntimeContext와 ports만 사용하고 settings를 재조회하지 않는다.
- [x] 로그 요구사항: refresh success/failure summary만 Product Log 후보로 반환하고 item별 detail은 Field Debug Log 후보로 제한한다.
- [x] 오류 처리: metadata/index/sync 일부 실패가 전체 tree failure로 확산되지 않고 degraded item diagnostic으로 표시된다.
- [x] 테스트 가능성: fake source repository, fake target store, fake sync calculator로 read model을 검증한다.
- [x] 유지보수성: tree mapper는 read model field를 표시하며 policy condition을 중복하지 않는다.

## 8. Implementation Steps

- [x] source/applied read model에 sync field가 포함되는 실패 테스트를 작성한다.
- [x] tree mapper가 sync status별 icon/description/contextValue를 반환하는 실패 테스트를 작성한다.
- [x] corrupt metadata diagnostic이 tree degraded item으로 표시되는 테스트를 작성한다.
- [x] `RefreshSkills` output DTO를 확장한다.
- [x] Presentation tree mapper를 read model field 기반으로 업데이트한다.
- [x] package menu context가 새 contextValue와 drift되지 않는지 manifest test를 갱신한다.
- [x] `npm test`, `npm run build`를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 read model mapper test를 먼저 작성한다.
- [x] RefreshSkills use case test를 fake ports로 작성한다.
- [x] 외부 repository/target/hash dependency는 테스트 더블로 대체한다.
- [x] RuntimeContext 전달 방식 테스트를 유지한다.
- [x] `skill.sync.calculated` summary event 후보가 count 중심인지 검증한다.
- [x] empty repository, missing target, broken symlink 오류 케이스를 테스트한다.
- [x] tree mapper field rename 정리는 기능 변경과 분리한다.

## 10. Validation Checklist

- [x] source와 applied item이 sync status와 applied count를 표시한다.
- [x] Presentation이 sync policy를 재구현하지 않는다.
- [x] Domain 계층은 tree item, VSCode ThemeIcon에 의존하지 않는다.
- [x] refresh 중 settings/env를 재조회하지 않는다.
- [x] RuntimeContext와 fake ports로 테스트가 가능하다.
- [x] 로그 event 후보는 Product/Field Debug로 구분된다.
- [x] tree mapper는 fake read model로 단위 테스트된다.
- [x] 복잡한 상태 전이는 Task 005 step contract를 사용한다.
- [x] read model 확장과 UX mapping 정리가 리뷰 가능한 단위로 분리된다.

## 11. Logging Requirements

### Product Log

- [x] `skill.sync.calculated`는 status별 count와 failure count만 기록한다.
- [x] Product Log에 개별 full path, full hash, SKILL.md content를 포함하지 않는다.

### Field Debug Log

- [x] sync item detail은 `sync.hash.compared` 또는 후속 Field Debug event에서 masked id로만 기록한다.
- [x] Field Debug Log는 기본 비활성이다.

### Development Log

- [x] tree mapper fixture detail은 테스트에서만 Development Log로 사용할 수 있다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 별도 상태머신은 만들지 않는다. RefreshSkills는 Task 005의 sync step output을 조합한다.
- [x] 상태 목록: `LoadingSources`, `LoadingTargets`, `MappingReadModel`, `Completed` step name을 테스트에 사용할 수 있다.
- [x] 이벤트 목록: `SourcesLoaded`, `TargetsLoaded`, `SyncCalculated`, `ReadModelMapped`
- [x] 전이 조건: partial failure는 degraded diagnostic으로 변환한다.
- [x] 실패 상태: `SourceScanFailed`, `TargetScanFailed`, `ReadModelMappingFailed`
- [x] 종료 상태: `CompletedWithDiagnostics` 또는 `Completed`
- [x] step output은 use case result로 테스트한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Metadata read model gate를 통과한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 007/008/009가 enriched read model을 command payload로 사용할 수 있다.
