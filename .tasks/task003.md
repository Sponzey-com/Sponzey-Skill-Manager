# Task 003. Repository Index V2 Stable Source Identity

## 1. Task Purpose

- [x] Repository Index V2의 최소 동작을 도입해 Main Repository source skill이 folder name만이 아니라 repository-local index metadata로 식별될 수 있게 한다.
- [x] 이 태스크가 `.tasks/plan.md`의 Phase 004.2 "Repository Index V2 And Stable Source Identity" 목표에 기여함을 기록한다.
- [x] 이 태스크 완료 후 `refreshSkills`는 repository index store가 주입된 경우 stable `sourceId`, `sourceHash`, `indexStatus`, `lastIndexedAt`을 read model에 포함해야 한다.

## 2. Current Context

- [x] Task 001에서 Phase 004 baseline integrity가 검증되었다.
- [x] Task 002에서 `refreshSkills` source read model 조립 helper가 추출되어 index metadata를 병합할 위치가 명확해졌다.
- [x] 이번 태스크를 시작해야 하는 이유: Git versioning, backup compare/restore, diagnostics remediation은 stable source identity가 있어야 안전하게 확장할 수 있다.
- [x] 현재 확인된 제약 사항: Repository index metadata는 Main Repository의 `.sponzey/` 아래에만 기록한다. Source skill body와 `SKILL.md`는 변경하지 않는다.

## 3. Scope

### Included

- [x] Repository index domain policy를 추가한다.
- [x] `refreshSkills`에 선택적 `repositoryIndexStore` port를 추가한다.
- [x] filesystem repository index store를 `.sponzey/index.json` 기반으로 구현한다.

### Excluded

- [x] Git versioning, diff, snapshot commit은 이번 태스크에서 다루지 않는다.
- [x] rename detection과 content-hash 기반 identity reconciliation은 이번 태스크에서 다루지 않는다.
- [x] Presentation command, tree label, context menu 변경은 이번 태스크에서 다루지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] repository index policy를 정의한다.
- [x] 입력: scanned source list, existing index metadata, source hash map, current timestamp.
- [x] 출력: source별 index entry와 diagnostics.
- [x] 성공 조건: 기존 index entry가 있으면 `sourceId`를 보존하고, 없으면 기존 scan id를 보존한 deterministic source id를 생성한다.
- [x] 실패 조건: unsupported schema version은 refresh failure로 전파하지 않고 repository diagnostic으로 반환한다.

### Functional Unit 2

- [x] `refreshSkills`가 repository index store를 선택적으로 사용한다.
- [x] 입력: `repositoryIndexStore`, `context.mainRepositoryPath`, scanned sources.
- [x] 출력: read model source skill에 `sourceId`, `origin`, `indexStatus`, `lastIndexedAt`, `sourceHash`가 포함된다.
- [x] 성공 조건: index store가 없으면 기존 output이 유지된다.
- [x] 실패 조건: index read/write 실패는 diagnostic으로 남기고 source list refresh는 계속된다.

### Functional Unit 3

- [x] filesystem repository index store를 구현한다.
- [x] 입력: repository path, index metadata.
- [x] 출력: `.sponzey/index.json` read/write result.
- [x] 성공 조건: invalid JSON과 unsupported schema를 typed diagnostic으로 반환한다.
- [x] 실패 조건: source skill body나 target path를 변경하지 않는다.

## 5. Architecture Notes

- [x] 변경되는 계층은 Domain, Application, Infrastructure다.
- [x] Domain은 repository index policy와 value normalization만 담당한다.
- [x] Application은 index store port를 orchestration하고 read model에 index summary를 병합한다.
- [x] Infrastructure는 `.sponzey/index.json` 파일 read/write만 담당한다.
- [x] 외부 시스템 접근은 filesystem adapter에만 위치한다.
- [x] 필요한 포트는 `repositoryIndexStore`이며 Application use case input으로 명시 전달한다.
- [x] 전역 상태, 숨겨진 I/O, 암묵적 설정 접근을 추가하지 않는다.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 환경 값은 프로그램 시작 시 최초 1회만 수신한다는 기존 정책을 변경하지 않는다.
- [x] 최초 수신 이후 환경 값을 전역 상수처럼 사용하지 않는다.
- [x] repository index path는 `mainRepositoryPath`에서 파생하고 별도 설정으로 추가하지 않는다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지한다.

## 7. Logging Requirements

### Product Log

- [x] Repository index rebuild 성공/실패 Product Log가 필요한지 판단한다. 이번 태스크에서는 별도 Product Log를 추가하지 않고 기존 `skills.refresh.completed` event와 diagnostic payload로 제한한다.
- [x] 사용자 영향이 있는 index write failure는 `repository-index-write-failed` diagnostic으로 기록한다.
- [x] source body, full path, secret, raw metadata body를 기록하지 않는다.

### Field Debug Log

- [x] index entry count와 diagnostic count는 Field Debug Log 후보로만 둔다.
- [x] 활성화 조건은 기존 logging mode를 따른다.
- [x] path는 repository-relative path 또는 masked path로 제한한다.
- [x] 보존 범위와 사용 범위를 새로 확장하지 않는다.

### Development Log

- [x] fake repository index store call summary는 test-only detail로만 둔다.
- [x] 프로덕션 기본 동작에 포함하지 않는다.
- [x] 임시 로그를 만들지 않는다.

## 8. State Machine Requirements

- [x] repository index rebuild는 explicit steps contract로 관리한다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록: `ReadingIndex`, `ComputingIndex`, `WritingIndex`, `Completed`, `IndexUnavailable`.
- [x] 이벤트 목록: `IndexReadSucceeded`, `IndexMissing`, `IndexReadFailed`, `IndexComputed`, `IndexWriteSucceeded`, `IndexWriteFailed`.
- [x] 전이 조건: index store가 없으면 `IndexUnavailable`, unsupported schema는 diagnostic with source refresh continuation.
- [x] 실패 상태: `IndexReadFailed`, `IndexWriteFailed`.
- [x] 종료 상태: `Completed`, `IndexUnavailable`.
- [x] 상태 전이는 use case tests에서 step output과 diagnostics로 검증한다.

## 9. TDD Plan

- [x] 실패하는 refresh use case 테스트를 먼저 작성한다.
- [x] 테스트 대상 유스케이스는 `refreshSkills`다.
- [x] 정상 케이스 테스트: existing index entry sourceId가 read model에 보존된다.
- [x] 실패 케이스 테스트: unsupported index schema가 refresh failure가 아니라 diagnostic으로 반환된다.
- [x] 경계값 테스트: repositoryIndexStore가 없으면 기존 read model output이 유지된다.
- [x] 외부 의존성은 fake repository index store와 fake hash port로 대체한다.
- [x] 설정 값 전달 방식 테스트: index path 설정을 추가하지 않고 `context.mainRepositoryPath`만 사용한다.
- [x] 로그 정책 검증 테스트: 새 Product Log를 추가하지 않고 기존 Product Log payload에 raw metadata body가 포함되지 않음을 전체 회귀 테스트로 확인한다.
- [x] 상태 전이는 refresh steps 또는 index diagnostics로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 실패하는 refresh use case 테스트를 먼저 작성한다.
- [x] 실패하는 filesystem index store 테스트를 먼저 작성한다.
- [x] 최소 Domain policy를 작성한다.
- [x] 최소 Application orchestration을 작성한다.
- [x] 최소 Infrastructure filesystem store를 작성한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] 필요한 로그를 정책에 맞게 추가한다.
- [x] 상태 관리가 explicit steps로 표현되었는지 확인한다.
- [x] 중복과 구조 문제를 정리한다.
- [x] 모든 관련 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 도메인 계층이 외부 프레임워크에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 환경 값이 전역 상수처럼 사용되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 플래그 조합이 아니라 명시적 상태로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.
  - Repository index domain policy와 schema version을 추가했다.
  - `refreshSkills`가 선택적 `repositoryIndexStore`를 통해 index를 읽고 갱신하며, source read model에 `sourceId`, `origin`, `indexStatus`, `lastIndexedAt`, `sourceHash`를 병합한다.
  - filesystem adapter `FileSystemRepositoryIndexStore`를 추가하고 `.sponzey/index.json` read/write, missing metadata, invalid JSON, unsupported schema diagnostic을 구현했다.
  - extension composition은 기본 filesystem repository를 사용할 때만 기본 repository index store를 자동 주입하고, fake/custom repository adapter 사용 시에는 명시 주입된 store만 사용하도록 정리했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - `src/domain/policy/core-policies.js`
  - `src/domain/index.js`
  - `src/application/refresh/refresh-skills.js`
  - `src/application/repository/repository-management-use-cases.js`
  - `src/infrastructure/filesystem/file-system-repository-index-store.js`
  - `src/infrastructure/index.js`
  - `src/extension-composition.js`
  - `test/application/refresh-skills.test.mjs`
  - `test/infrastructure/file-system-repository-index-store.test.mjs`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `node --test test/application/refresh-skills.test.mjs test/infrastructure/file-system-repository-index-store.test.mjs` 통과
  - `node --test test/extension-activation.test.mjs test/extension-composition.test.mjs` 통과
  - `npm test` 통과: 264 tests, 264 pass
  - `npm run build` 통과
  - `npm run release:gate` 통과
- [x] 검증한 항목을 기록한다.
  - Repository index store가 없을 때 기존 read model output이 유지된다.
  - 기존 index sourceId가 있으면 read model과 rewritten index에 보존된다.
  - unsupported index schema는 refresh failure가 아니라 diagnostic으로 반환된다.
  - filesystem adapter는 `.sponzey/index.json`에만 기록한다.
  - Domain은 filesystem, VSCode, logger 구현체를 import하지 않는다.
- [x] 남은 위험 요소를 기록한다.
  - rename detection과 content-hash 기반 identity reconciliation은 아직 없다.
  - indexStatus는 현재 `indexed`/`unknown` 중심이며 source hash drift를 `stale`로 표현하는 정책은 후속 task에서 보강해야 한다.
  - Presentation row에서 sourceId/index metadata를 직접 노출하는 UX는 아직 없다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - Phase 004.3 Local Git Repository Versioning을 시작한다.
  - 다음 태스크는 Git status/snapshot 중 status read model까지만 제한한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다. Phase 004.2의 최소 repository index는 완료했지만 Phase 004 전체 목표에는 아직 도달하지 않았다.
- [x] 해당 없음: 최종 목표에 아직 도달하지 않아 추가 태스크 생성을 중단하지 않았다.
- [x] 도달하지 못했다면 남은 목표를 정리한다. 남은 목표는 local Git versioning, backup compare/restore lifecycle, analyzer policy pack, target profile governance, diagnostics remediation, release candidate readiness다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다. Phase dependency map에 따라 Phase 004.3 Local Git Repository Versioning을 다음으로 선택한다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다. task004는 Git availability/status read model과 optional port wiring까지만 포함한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 결정한다. 다음 파일은 `.tasks/task004.md`다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다. `.tasks/task004.md`를 생성했다.
- [x] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작한다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [x] 해당 없음: `plan.md`의 최종 목표에는 아직 도달하지 않았다.
- [x] 해당 없음: 필수 요구사항이 명확하여 진행을 계속할 수 있었다.
- [x] 해당 없음: 추가 외부 정보, 권한, 비밀값, 접근 권한 없이 검증 가능한 범위에서 진행했다.
- [x] 해당 없음: `AGENTS.md` 원칙과 충돌하는 요구사항은 발견되지 않았다.
- [x] 해당 없음: 테스트와 검증 환경으로 완료 여부를 판단했다.
- [x] 해당 없음: 태스크 재설계가 필요한 구조 차이는 발견되지 않았다.
- [x] 해당 없음: 사용자 결정이 필요한 아키텍처 선택지는 발생하지 않았다.
