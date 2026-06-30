# Task 005. HashPort And Sync Status Policy

## 1. Summary

- [x] 목적: source와 applied copy target의 hash를 비교해 sync status를 계산하는 port와 정책을 만든다.
- [x] 해결 문제: copy 적용본이 source와 drift 되었는지 알 수 없어 update/convert/delete 같은 후속 기능에서 사용자 수정 손실 위험이 높다.
- [x] 완료 상태: hash adapter와 pure sync policy가 `In Sync`, `Source Changed`, `Target Changed`, `Both Changed`, `Missing Source`, `Missing Target`, `External`, `Broken Symlink`를 반환한다.

## 2. Scope

### Included

- [x] `HashPort` 또는 equivalent directory hash port 정의
- [x] filesystem hash adapter 구현
- [x] sync status domain/application policy 구현

### Excluded

- [x] tree badge/icon rendering
- [x] copy update 실행
- [x] watcher triggered recalculation

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 003 directory hash service
- [x] `.tasks/plan.md` Phase 003 copy sync status
- [x] `.tasks/plan.md` 7.1 Sync status gate
- [x] `AGENTS.md` 7. State Machine Policy, 8. TDD Policy

## 4. Dependencies

### Previous Tasks

- [x] Task 004. Repository Metadata Schema And Index Cache

### Next Tasks

- [x] Task 006. Sync Read Model And Tree Mapping
- [x] Task 009. Copy Update With Sync Guard

## 5. Architecture Notes

- [x] 변경 계층: Application hash port, Infrastructure filesystem hash adapter, Domain sync status policy
- [x] 의존 방향: sync decision은 Domain/Application에 있고 Infrastructure는 bytes/file traversal/hash calculation만 수행한다.
- [x] 도메인 책임: hash comparison result와 status value object 정의
- [x] 유스케이스 책임: source/applied metadata와 HashPort output을 조합해 sync status를 계산한다.
- [x] 인프라 책임: directory traversal, ignored metadata handling, stable ordering, hash failure conversion
- [x] 외부 시스템 접근 위치: filesystem traversal은 Infrastructure hash adapter에서만 수행한다.

## 6. Functional Requirements

- [x] 동일 source/target hash는 `In Sync`를 반환한다.
- [x] source hash만 바뀌면 `Source Changed`, target hash만 바뀌면 `Target Changed`, 둘 다 바뀌면 `Both Changed`를 반환한다.
- [x] missing source, missing target, external skill, broken symlink는 별도 status와 diagnostic을 반환한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: hash 대상 path는 RuntimeContext에서 파생된 repository/target path 또는 explicit input으로 전달한다.
- [x] 로그 요구사항: sync summary는 Product Log count, hash detail은 Field Debug Log masked id로 제한한다.
- [x] 오류 처리: read permission failure, missing path, symlink loop, hash failure를 typed diagnostic으로 변환한다.
- [x] 테스트 가능성: sync policy는 filesystem 없이 pure test로, hash adapter는 temp fixture로 테스트한다.
- [x] 유지보수성: initial version은 correctness를 우선하고 performance optimization은 후속 watcher/incremental task로 남긴다.

## 8. Implementation Steps

- [x] `In Sync`, `Source Changed`, `Target Changed`, `Both Changed` pure policy 실패 테스트를 작성한다.
- [x] missing source/target/external/broken symlink 실패 테스트를 작성한다.
- [x] filesystem hash adapter가 deterministic hash를 반환하는 temp fixture 테스트를 작성한다.
- [x] `HashPort` interface와 sync status value object를 구현한다.
- [x] metadata sourceHash/targetHash와 current hash를 비교하는 use case helper를 작성한다.
- [x] adapter가 policy를 결정하지 않도록 architecture guard 또는 review test를 추가한다.
- [x] `npm test`, `npm run build`를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 sync policy test를 먼저 작성한다.
- [x] sync calculation use case test를 fake HashPort로 작성한다.
- [x] filesystem hash adapter는 temp fixture로 검증한다.
- [x] RuntimeContext 또는 explicit path input 전달 테스트를 작성한다.
- [x] `skill.sync.calculated`, `sync.hash.compared` event 후보 payload masking 검증을 작성한다.
- [x] permission denied, missing path, broken symlink 오류 케이스를 테스트한다.
- [x] hash traversal helper 정리는 기능 구현과 분리한다.

## 10. Validation Checklist

- [x] sync status 값이 plan.md에 정의된 모든 상태를 포함한다.
- [x] filesystem adapter가 sync policy를 결정하지 않는다.
- [x] Domain 계층은 filesystem traversal에 의존하지 않는다.
- [x] hash 대상 path는 중간 settings 재조회 없이 전달된다.
- [x] 외부 환경 값은 RuntimeContext 또는 explicit input으로만 전달된다.
- [x] 로그는 Product summary와 Field Debug detail로 분리된다.
- [x] HashPort를 fake로 대체할 수 있다.
- [x] sync calculation step은 `LoadingIndex -> HashingSource -> HashingTarget -> ComparingHashes -> UpdatingIndex`로 테스트된다.
- [x] hash port 도입 정리와 sync status 기능 구현이 분리된다.

## 11. Logging Requirements

### Product Log

- [x] `skill.sync.calculated`는 status별 count, failed count, masked repository id만 포함한다.
- [x] Product Log에는 full path, file list, hash input content를 포함하지 않는다.

### Field Debug Log

- [x] `sync.hash.compared`는 operation id, masked source id, masked target id, previous/current hash prefix 정도만 기록한다.
- [x] Field Debug Log는 명시 활성화된 경우에만 기록한다.

### Development Log

- [x] temp fixture traversal detail은 테스트에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 명시 step contract가 필요하다. 파일 읽기와 index update 실패 분기가 있다.
- [x] 상태 목록: `LoadingIndex`, `HashingSource`, `HashingTarget`, `ComparingHashes`, `UpdatingIndex`, `Completed`
- [x] 이벤트 목록: `IndexLoaded`, `SourceHashed`, `TargetHashed`, `HashesCompared`, `IndexUpdated`, `FailureDetected`
- [x] 전이 조건: missing source/target은 hash 단계 실패가 아니라 sync status terminal result로 변환한다.
- [x] 실패 상태: `IndexUnreadable`, `SourceUnreadable`, `TargetUnreadable`, `HashFailed`, `IndexWriteFailed`
- [x] 종료 상태: `Completed`
- [x] step transition은 fake HashPort와 fake index port로 테스트한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Sync status gate의 policy와 hash adapter 조건이 충족된다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 006과 Task 009가 sync status output을 이어받을 수 있다.
