# Task 004. Repository Metadata Schema And Index Cache

## 1. Summary

- [x] 목적: Main Repository source metadata와 applied metadata를 정규화하고 repository index cache contract를 정의한다.
- [x] 해결 문제: source와 applied skill 상태 비교에 필요한 id, origin, hash, analysis timestamp, apply mode 정보가 일관되지 않으면 sync status와 detail UX를 안정적으로 만들 수 없다.
- [x] 완료 상태: metadata schema, index load/save adapter, corrupt index recovery diagnostic이 테스트로 고정된다.

## 2. Scope

### Included

- [x] source metadata schema normalization
- [x] applied metadata schema normalization
- [x] `.sponzey/index.json` 또는 extension storage 기반 index adapter contract

### Excluded

- [x] directory hash 계산 구현
- [x] tree sync badge rendering
- [x] watcher 기반 incremental update

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 003 RepositoryIndex cache
- [x] `.tasks/plan.md` Phase 003 source/applied metadata normalization
- [x] `.tasks/plan.md` 12.2 Port And Adapter Rules
- [x] `AGENTS.md` 2. Architecture Rules, 3. Dependency Direction, 8. TDD Policy

## 4. Dependencies

### Previous Tasks

- [x] Task 002. Main Repository Setup Wizard And Initialization
- [x] Task 003. Repository Command UX And Smoke Baseline

### Next Tasks

- [x] Task 005. HashPort And Sync Status Policy
- [x] Task 006. Sync Read Model And Tree Mapping

## 5. Architecture Notes

- [x] 변경 계층: Domain value objects, Application repository/index ports, Infrastructure filesystem index adapter
- [x] 의존 방향: Application은 index port에 의존하고 Infrastructure가 JSON load/save를 구현한다.
- [x] 도메인 책임: metadata value validation, source/applied identity, index corruption diagnostic code 정의
- [x] 유스케이스 책임: refresh 또는 repository scan 시 metadata를 normalize하고 cache를 source of truth로 오인하지 않는다.
- [x] 인프라 책임: `.sponzey/index.json` read/write, parse error conversion, atomic-ish write strategy
- [x] 외부 시스템 접근 위치: filesystem JSON 접근은 Infrastructure adapter에서만 수행한다.

## 6. Functional Requirements

- [x] source metadata는 `id`, `originType`, `createdAt`, `updatedAt`, `lastAnalyzedAt`, `riskLevel`, `sourceHash`를 포함한다.
- [x] applied metadata는 `sourceSkillId`, `sourcePath`, `applyMode`, `installedAt`, `sourceHash`, `targetHash`를 포함한다.
- [x] corrupt index load는 refresh failure가 아니라 typed diagnostic과 full rescan fallback으로 처리된다.

## 7. Non-Functional Requirements

- [x] 설정 관리: index path는 RuntimeContext의 main repository path에서 파생하고 use case 내부 settings 재조회는 금지한다.
- [x] 로그 요구사항: index corruption summary는 Product Log 후보, parse detail은 Field Debug Log 후보로 분리한다.
- [x] 오류 처리: invalid metadata, missing metadata, parse failure, write failure를 구분한다.
- [x] 테스트 가능성: index adapter는 temp fixture로, metadata normalization은 pure test로 검증한다.
- [x] 유지보수성: index는 cache이며 filesystem source of truth를 대체하지 않는다는 contract를 문서화한다.

## 8. Implementation Steps

- [x] invalid source metadata를 typed diagnostic으로 변환하는 실패 테스트를 작성한다.
- [x] applied metadata missing field normalization 실패 테스트를 작성한다.
- [x] corrupt index load가 diagnostic + rescan request를 반환하는 실패 테스트를 작성한다.
- [x] metadata value object 또는 mapper 최소 구현을 작성한다.
- [x] index port와 filesystem adapter를 작성한다.
- [x] refresh path에서 index absence와 corruption을 구분한다.
- [x] `npm test`, `npm run build`, architecture guard를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 metadata parser test를 먼저 작성한다.
- [x] repository/index use case test를 fake index port로 작성한다.
- [x] filesystem index adapter는 temp directory fixture로 검증한다.
- [x] RuntimeContext에서 index path가 전달되는지 테스트한다.
- [x] index corruption log event 후보가 민감 정보를 제외하는지 검증한다.
- [x] parse failure, missing file, write failure 오류 케이스를 테스트한다.
- [x] mapper 중복 제거는 Tidy First로 분리한다.

## 10. Validation Checklist

- [x] source/applied metadata schema가 문서화되고 테스트로 고정된다.
- [x] index가 없어도 full rescan으로 동작한다.
- [x] Domain 계층이 filesystem JSON read/write에 의존하지 않는다.
- [x] index path는 런타임 중 settings 재조회로 만들지 않는다.
- [x] RuntimeContext 또는 explicit path value로 index adapter에 전달된다.
- [x] 로그 event 후보는 Product/Field Debug로 분리된다.
- [x] fake index port로 외부 의존성을 대체할 수 있다.
- [x] index load/save에는 단순 step contract를 두고 상태머신은 만들지 않는다.
- [x] schema 정리와 sync status 기능 변경이 분리된다.

## 11. Logging Requirements

### Product Log

- [x] `skill.sync.calculated`는 이 태스크에서 기록하지 않고, 향후 sync calculation summary에만 사용한다.
- [x] index corruption으로 사용자 refresh 결과가 degraded 되면 Product Log 후보에는 count와 error code만 포함한다.

### Field Debug Log

- [x] index parse failure detail은 masked repository id, schema version, error category만 기록한다.
- [x] raw index JSON과 full path는 기록하지 않는다.

### Development Log

- [x] temp fixture file names와 fake index calls는 test harness에서만 기록한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 불필요하다. index load/save는 1~2단계 adapter operation이다.
- [x] 상태 목록: `LoadingIndex`, `WritingIndex` 정도의 step name만 test helper에서 사용한다.
- [x] 이벤트 목록: `IndexMissing`, `IndexLoaded`, `IndexCorrupt`, `IndexWritten`
- [x] 전이 조건: corrupt index는 full rescan fallback으로 이동한다.
- [x] 실패 상태: `IndexUnreadable`, `IndexWriteFailed`
- [x] 종료 상태: `IndexAvailable`, `RescanRequired`
- [x] step output은 use case test에서 검증한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Metadata read model gate의 schema 기반 선행 조건이 충족된다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 005가 `sourceHash`, `targetHash`, index port를 이어받을 수 있다.