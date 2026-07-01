# Task 005. Repository Snapshot Commit Use Case

## 1. Task Purpose

- [x] Main Repository의 변경 사항을 사용자가 명시적으로 snapshot commit 후보로 저장할 수 있는 Application use case를 추가한다.
- [x] 이 태스크가 `.tasks/plan.md`의 Phase 004.3 "Local Git Repository Versioning" 목표 중 snapshot commit use case에 기여함을 기록한다.
- [x] 이 태스크 완료 후 snapshot commit은 Git repository에서만 실행되고, Git이 없거나 repository가 아니면 Product Log failure와 typed diagnostic으로 종료되어야 한다.

## 2. Current Context

- [x] Task 003에서 repository index와 stable source identity 기반이 구현되었다.
- [x] Task 004에서 optional `versionControlPort`와 local Git status read model이 구현되었다.
- [x] 이번 태스크를 시작해야 하는 이유: 사용자가 Main Repository 변경 상태를 확인한 뒤 audit 가능한 local snapshot을 만들 수 있어야 backup/restore와 release evidence 흐름으로 확장할 수 있다.
- [x] 현재 확인된 제약 사항: snapshot commit은 사용자가 명시적으로 실행할 때만 수행한다. 자동 commit, background commit, UI command 노출은 이번 태스크에 포함하지 않는다.

## 3. Scope

### Included

- [x] Application use case `createRepositorySnapshot`을 추가한다.
- [x] `VersionControlPort`에 snapshot creation method를 추가하고 fake port test로 검증한다.
- [x] `LocalGitVersionControlPort`에 `git add`와 `git commit` 기반 snapshot method를 구현한다.

### Excluded

- [x] VSCode command, picker, tree title button 노출은 이번 태스크에서 다루지 않는다.
- [x] remote push, branch creation, tag creation은 이번 태스크에서 다루지 않는다.
- [x] file-level diff preview와 backup compare는 이번 태스크에서 다루지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] `createRepositorySnapshot` use case를 구현한다.
- [x] 입력: `context.mainRepositoryPath`, `input.message`, optional `input.paths`, `versionControlPort`.
- [x] 출력: snapshot result, diagnostics, Product Log events, explicit steps.
- [x] 성공 조건: message와 port가 유효하면 versionControlPort가 호출되고 snapshot id 또는 commit hash가 반환된다.
- [x] 실패 조건: missing message, missing port, port failure는 typed diagnostic으로 반환하고 Git side effect를 수행하지 않는다.

### Functional Unit 2

- [x] local Git snapshot adapter method를 구현한다.
- [x] 입력: repository path, commit message, included paths.
- [x] 출력: commit hash 또는 typed diagnostic.
- [x] 성공 조건: `git add -- <paths>` 후 `git commit -m <message>`와 `git rev-parse HEAD`를 순서대로 실행한다.
- [x] 실패 조건: Git unavailable, not Git repository, empty commit은 typed diagnostic으로 반환한다.

### Functional Unit 3

- [x] Application export와 composition wiring을 추가한다.
- [x] 입력: existing use case bundle.
- [x] 출력: tests에서 직접 호출 가능한 use case export.
- [x] 성공 조건: Presentation command는 추가하지 않는다.
- [x] 실패 조건: UI command가 safety confirmation 없이 노출되지 않는다.

## 5. Architecture Notes

- [x] 변경되는 계층은 Application과 Infrastructure다.
- [x] Domain에는 Git command나 process execution 개념을 추가하지 않는다.
- [x] Application은 snapshot request validation과 Product Log event 생성만 담당한다.
- [x] Infrastructure는 Git command execution과 stdout parsing만 담당한다.
- [x] 외부 프로세스 접근은 `LocalGitVersionControlPort` adapter에만 위치한다.
- [x] 새 설정, global state, hidden environment lookup을 추가하지 않는다.

## 6. Configuration Rules

- [x] 새 설정을 추가하지 않는다.
- [x] Git binary path를 설정 파일로 추가하지 않는다.
- [x] `mainRepositoryPath`는 RuntimeContext에서 전달된 값을 사용한다.
- [x] commit message는 use case input으로만 받는다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지한다.

## 7. Logging Requirements

### Product Log

- [x] 성공 시 `repository.version.snapshot.created`를 기록한다.
- [x] 실패 시 `repository.version.snapshot.failed`를 기록한다.
- [x] Product Log payload는 reason, includedPathCount, commitHash presence만 포함하고 raw path list, commit message body, stdout, stderr를 포함하지 않는다.

### Field Debug Log

- [x] command sequence detail은 Field Debug Log 후보로만 둔다.
- [x] path는 repository-relative path만 허용한다.
- [x] stderr/stdout raw body는 기록하지 않는다.
- [x] 보존 범위와 사용 범위를 새로 확장하지 않는다.

### Development Log

- [x] fake command runner call summary는 test-only detail로만 둔다.
- [x] 프로덕션 기본 동작에 포함하지 않는다.
- [x] 임시 로그를 만들지 않는다.

## 8. State Machine Requirements

- [x] snapshot creation은 explicit steps contract로 관리한다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록: `ValidatingInput`, `CheckingVersionPort`, `StagingChanges`, `CreatingCommit`, `ReadingCommitHash`, `Completed`, `Failed`.
- [x] 이벤트 목록: `InputValid`, `InputInvalid`, `VersionPortAvailable`, `GitAddSucceeded`, `GitCommitSucceeded`, `GitCommitFailed`, `CommitHashReadSucceeded`.
- [x] 전이 조건: validation failure는 side effect 이전에 종료한다.
- [x] 실패 상태: `Failed`.
- [x] 종료 상태: `Completed`, `Failed`.
- [x] 상태 전이는 use case tests에서 steps와 port call order로 검증한다.

## 9. TDD Plan

- [x] 실패하는 Application use case 테스트를 먼저 작성한다.
- [x] 실패하는 local Git adapter 테스트를 먼저 작성한다.
- [x] 정상 케이스 테스트: valid snapshot input이 port를 호출하고 commit hash를 반환한다.
- [x] 실패 케이스 테스트: missing message와 missing port는 side effect 없이 failed result를 반환한다.
- [x] 실패 케이스 테스트: Git adapter empty commit과 not Git repository를 typed diagnostic으로 반환한다.
- [x] 외부 의존성은 fake version control port와 fake command runner로 대체한다.
- [x] 설정 값 전달 방식 테스트: use case는 `context.mainRepositoryPath`와 explicit input만 사용한다.
- [x] 로그 정책 검증 테스트: Product Log에 commit message body와 raw Git output이 포함되지 않는다.
- [x] 상태 전이는 steps와 command order로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 실패하는 Application use case 테스트를 먼저 작성한다.
- [x] 실패하는 local Git adapter snapshot 테스트를 먼저 작성한다.
- [x] 최소 Application use case를 작성한다.
- [x] Application export를 추가한다.
- [x] 최소 Infrastructure adapter method를 작성한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] Product Log event를 정책에 맞게 추가한다.
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
  - Application use case `createRepositorySnapshot`을 추가했다.
  - snapshot validation, missing port handling, port failure handling, Product Log event를 구현했다.
  - `LocalGitVersionControlPort.createSnapshot`을 추가해 `git add`, `git commit`, `git rev-parse HEAD` 순서로 snapshot을 생성한다.
  - empty commit, non-Git repository, missing Git command를 typed diagnostic으로 반환한다.
  - use case export와 composition bundle wiring을 추가했지만 VSCode command는 노출하지 않았다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - `src/application/repository/repository-management-use-cases.js`
  - `src/application/index.js`
  - `src/infrastructure/filesystem/local-git-version-control-port.js`
  - `src/extension-composition.js`
  - `test/application/repository-management-use-cases.test.mjs`
  - `test/infrastructure/local-git-version-control-port.test.mjs`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `node --test test/application/repository-management-use-cases.test.mjs test/infrastructure/local-git-version-control-port.test.mjs` 통과
  - `node --test test/extension-composition.test.mjs test/extension-activation.test.mjs` 통과
  - `npm test` 통과: 276 tests, 276 pass
  - `npm run build` 통과
  - `npm run release:gate` 통과
- [x] 검증한 항목을 기록한다.
  - missing message는 port side effect 전에 실패한다.
  - missing version port는 Git command 없이 typed diagnostic으로 실패한다.
  - success Product Log에는 commit message body, raw path list, stdout, stderr가 포함되지 않는다.
  - adapter command runner는 테스트 더블로 대체 가능하다.
  - Git command execution은 Infrastructure adapter에만 존재한다.
- [x] 남은 위험 요소를 기록한다.
  - snapshot use case는 아직 VSCode command로 노출되지 않았다.
  - snapshot 전에 사용자에게 변경 요약을 보여주는 confirmation flow가 없다.
  - rollback 또는 amend flow는 없다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - Phase 004.4 Backup Compare/Restore Lifecycle로 넘어가기 전에 snapshot command 노출 여부를 판단해야 한다.
  - 계획 우선순위상 다음은 backup compare summary use case다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다. Phase 004.3의 Git status와 snapshot 기반은 완료했지만 Phase 004 전체 목표에는 도달하지 않았다.
- [x] 해당 없음: 최종 목표에 아직 도달하지 않아 추가 태스크 생성을 중단하지 않았다.
- [x] 도달하지 못했다면 남은 목표를 정리한다. 남은 목표는 backup compare/restore lifecycle, analyzer policy pack, target profile governance, diagnostics remediation, release candidate readiness다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다. 다음 우선순위는 Phase 004.4 Backup Compare/Restore Lifecycle이다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다. 다음 태스크는 backup comparison summary use case와 comparison port contract까지만 포함해야 한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 결정한다. 다음 파일은 `.tasks/task006.md`다.
- [x] 다음 태스크를 `task006.md`로 생성했다.
- [x] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작했다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [x] 해당 없음: `plan.md`의 최종 목표에는 아직 도달하지 않았다.
- [x] 해당 없음: 필수 요구사항이 명확하여 진행을 계속할 수 있었다.
- [x] 해당 없음: 추가 외부 정보, 권한, 비밀값, 접근 권한 없이 검증 가능한 범위에서 진행했다.
- [x] 해당 없음: `AGENTS.md` 원칙과 충돌하는 요구사항은 발견되지 않았다.
- [x] 해당 없음: 테스트와 검증 환경으로 완료 여부를 판단했다.
- [x] 해당 없음: 태스크 재설계가 필요한 구조 차이는 발견되지 않았다.
- [x] 해당 없음: 사용자 결정이 필요한 아키텍처 선택지는 발생하지 않았다.
