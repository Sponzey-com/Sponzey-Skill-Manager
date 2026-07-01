# Task 004. Local Git Version Status Read Model

## 1. Task Purpose

- [x] Main Repository가 local Git repository인 경우 version status를 read model로 확인할 수 있게 한다.
- [x] 이 태스크가 `.tasks/plan.md`의 Phase 004.3 "Local Git Repository Versioning" 목표 중 Git availability detection과 repository status summary에 기여함을 기록한다.
- [x] 이 태스크 완료 후 Git이 없거나 Main Repository가 Git repo가 아니어도 refresh가 실패하지 않고 `versionStatus`가 `unavailable` 또는 `not-git-repository`로 표현되어야 한다.

## 2. Current Context

- [x] Task 001에서 Phase 004 baseline integrity가 검증되었다.
- [x] Task 002에서 `refreshSkills` source read model 조립 구조가 정리되었다.
- [x] Task 003에서 repository index metadata와 stable source identity의 최소 기반이 구현되었다.
- [x] 이번 태스크를 시작해야 하는 이유: backup compare, snapshot commit, release evidence는 Main Repository 변경 상태를 안전하게 읽는 version status port가 있어야 확장할 수 있다.
- [x] 현재 확인된 제약 사항: Git은 core runtime requirement가 아니다. Git command execution은 Infrastructure adapter에만 위치해야 한다.

## 3. Scope

### Included

- [x] `VersionControlPort`의 최소 status 조회 계약을 `refreshSkills`에 선택적으로 연결한다.
- [x] Git status result를 Application read model의 `repositoryVersion`으로 정규화한다.
- [x] local Git filesystem adapter를 command runner 주입 방식으로 구현하고 `git status --porcelain=v1` 출력을 요약한다.

### Excluded

- [x] snapshot commit 생성은 이번 태스크에서 다루지 않는다.
- [x] file-level diff viewer와 backup compare는 이번 태스크에서 다루지 않는다.
- [x] VSCode tree button, command palette command, context menu 노출은 이번 태스크에서 다루지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] `refreshSkills`가 선택적 `versionControlPort`를 통해 repository version status를 조회한다.
- [x] 입력: `context.mainRepositoryPath`, optional `versionControlPort`.
- [x] 출력: `readModel.repositoryVersion`.
- [x] 성공 조건: port가 없으면 기존 read model output이 유지된다.
- [x] 실패 조건: port failure는 refresh failure가 아니라 `repositoryVersion.status: "unavailable"`과 diagnostic으로 표현된다.

### Functional Unit 2

- [x] version status normalization을 구현한다.
- [x] 입력: port result의 raw status entries, git availability, repository state.
- [x] 출력: `status`, `changedFileCount`, `sourceChangeCount`, `backupChangeCount`, `metadataChangeCount`, `lastCheckedAt`.
- [x] 성공 조건: `skills/`, `backups/`, `.sponzey/` path prefix별 변경 수가 계산된다.
- [x] 실패 조건: raw Git output이나 absolute path를 Product Log 또는 read model diagnostic body에 노출하지 않는다.

### Functional Unit 3

- [x] `LocalGitVersionControlPort` infrastructure adapter를 구현한다.
- [x] 입력: repository path.
- [x] 출력: normalized command result 또는 typed diagnostic.
- [x] 성공 조건: command runner는 테스트 더블로 대체 가능하다.
- [x] 실패 조건: Git command execution이 Domain 또는 Application에 들어가지 않는다.

## 5. Architecture Notes

- [x] 변경되는 계층은 Application과 Infrastructure다. Domain에는 Git command 개념을 추가하지 않는다.
- [x] Application은 `versionControlPort` result를 read model DTO로 정규화한다.
- [x] Infrastructure는 `git status --porcelain=v1` 실행과 stdout parsing만 담당한다.
- [x] 외부 프로세스 접근은 `LocalGitVersionControlPort` adapter에만 위치한다.
- [x] 새 포트는 `refreshSkills` input으로 명시 전달한다.
- [x] 전역 상태, 숨겨진 I/O, 암묵적 설정 접근을 추가하지 않는다.

## 6. Configuration Rules

- [x] 새 설정을 추가하지 않는다.
- [x] Git binary path를 외부 설정으로 추가하지 않고 기본 `git` command만 adapter 내부 기본값으로 사용한다.
- [x] Git capability는 runtime 중 전역 상수로 저장하지 않는다.
- [x] `mainRepositoryPath`는 RuntimeContext에서 use case input으로 전달된 값만 사용한다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지한다.

## 7. Logging Requirements

### Product Log

- [x] 이번 태스크에서는 새 Product Log event를 추가하지 않는다.
- [x] 사용자 영향이 있는 refresh 실패가 아니므로 Git unavailable은 Product Log가 아니라 read model status와 diagnostic으로 제한한다.
- [x] raw Git output, absolute file list, secret, skill body를 Product Log에 기록하지 않는다.

### Field Debug Log

- [x] status category count는 Field Debug Log 후보로만 둔다.
- [x] 활성화 조건은 기존 logging mode를 따른다.
- [x] path는 repository-relative path만 허용한다.
- [x] 보존 범위와 사용 범위를 새로 확장하지 않는다.

### Development Log

- [x] fake command runner call summary는 test-only detail로만 둔다.
- [x] 프로덕션 기본 동작에 포함하지 않는다.
- [x] 임시 로그를 만들지 않는다.

## 8. State Machine Requirements

- [x] repository version status 조회는 explicit steps contract로 관리한다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록: `VersionStatusUnavailable`, `CheckingVersionStatus`, `VersionStatusReady`, `VersionStatusFailed`.
- [x] 이벤트 목록: `VersionPortMissing`, `GitStatusSucceeded`, `GitUnavailable`, `GitRepositoryMissing`, `GitStatusFailed`.
- [x] 전이 조건: port가 없으면 `VersionStatusUnavailable`, Git repo가 아니면 `not-git-repository`, command failure는 diagnostic continuation.
- [x] 실패 상태: `VersionStatusFailed`.
- [x] 종료 상태: `VersionStatusUnavailable`, `VersionStatusReady`.
- [x] 상태 전이는 refresh steps 또는 read model status로 검증한다.

## 9. TDD Plan

- [x] 실패하는 refresh use case 테스트를 먼저 작성한다.
- [x] 테스트 대상 유스케이스는 `refreshSkills`다.
- [x] 정상 케이스 테스트: dirty Git status가 repository version summary로 매핑된다.
- [x] 실패 케이스 테스트: Git unavailable 또는 not Git repository result가 refresh failure가 아니라 unavailable status로 반환된다.
- [x] 경계값 테스트: `versionControlPort`가 없으면 기존 read model output이 유지된다.
- [x] 외부 의존성은 fake version control port와 fake command runner로 대체한다.
- [x] 설정 값 전달 방식 테스트: Git status는 `context.mainRepositoryPath`만 받는다.
- [x] 로그 정책 검증 테스트: raw Git stdout을 Product Log에 넣지 않는다.
- [x] 상태 전이는 refresh steps 또는 read model status로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 실패하는 refresh use case 테스트를 먼저 작성한다.
- [x] 실패하는 local Git adapter 테스트를 먼저 작성한다.
- [x] 최소 Application normalization을 작성한다.
- [x] 최소 Infrastructure adapter를 작성한다.
- [x] extension composition에 default adapter를 실제 filesystem repository 경로에만 연결한다.
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
- [x] 도메인 계층이 Git, filesystem, child_process에 의존하지 않는다.
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
  - `refreshSkills`에 선택적 `versionControlPort`를 추가하고 `readModel.repositoryVersion` summary를 생성했다.
  - Git status failure는 refresh failure가 아니라 `repositoryVersion.status: "unavailable"`과 diagnostic으로 표현되게 했다.
  - `LocalGitVersionControlPort`를 추가해 `git status --porcelain=v1 --untracked-files=all` output을 repository-relative entries로 변환한다.
  - extension composition은 기본 filesystem repository 사용 시에만 default version control port를 자동 주입하고, fake/custom repository adapter 경로는 명시 주입된 port만 사용하도록 유지했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - `src/application/refresh/refresh-skills.js`
  - `src/application/repository/repository-management-use-cases.js`
  - `src/infrastructure/filesystem/local-git-version-control-port.js`
  - `src/infrastructure/index.js`
  - `src/extension-composition.js`
  - `test/application/refresh-skills.test.mjs`
  - `test/infrastructure/local-git-version-control-port.test.mjs`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `node --test test/application/refresh-skills.test.mjs test/infrastructure/local-git-version-control-port.test.mjs` 통과
  - `node --test test/extension-activation.test.mjs test/extension-composition.test.mjs` 통과
  - `npm test` 통과: 270 tests, 270 pass
  - `npm run build` 통과
  - `npm run release:gate` 통과
- [x] 검증한 항목을 기록한다.
  - Version control port가 없으면 기존 read model output이 유지된다.
  - Dirty Git output은 source, backup, metadata change count로 요약된다.
  - Git command missing은 `git-unavailable` warning diagnostic으로 변환된다.
  - non-Git repository는 refresh failure가 아니라 `not-git-repository` status로 표현된다.
  - `child_process` 접근은 Infrastructure adapter에만 존재한다.
- [x] 남은 위험 요소를 기록한다.
  - snapshot commit use case와 command는 아직 없다.
  - file-level diff summary와 UI 표시가 아직 없다.
  - Git status summary는 read model에 존재하지만 tree row나 command palette에 노출되지 않았다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 snapshot commit use case를 Application port 뒤에서 구현하고, 실제 Git commit은 Infrastructure adapter로 제한한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다. Phase 004.3의 status read model은 완료했지만 snapshot commit, backup lifecycle, analyzer policy, target governance, remediation, release readiness가 남아 있다.
- [x] 해당 없음: 최종 목표에 아직 도달하지 않아 추가 태스크 생성을 중단하지 않았다.
- [x] 도달하지 못했다면 남은 목표를 정리한다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다. Phase 004.3을 닫기 위해 snapshot commit use case를 다음 작업으로 선택한다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다. task005는 snapshot commit Application use case와 local Git adapter method까지만 포함한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 결정한다. 다음 파일은 `.tasks/task005.md`다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다. `.tasks/task005.md`를 생성했다.
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
