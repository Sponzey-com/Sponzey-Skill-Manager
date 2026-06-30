# Task 006. Target Store Scan And Classification

## 1. Task Purpose

- [x] 이 태스크의 목적은 Global/Project Skill Target 디렉토리를 읽어 applied skill 후보를 분류하는 infrastructure adapter를 구현하는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 4 목표 중 target scanner와 symlink/copy/external/broken link detection의 읽기 부분을 다룬다.
- [x] 이 태스크 완료 후 target scanner는 symlink, managed copy, external skill, broken symlink를 temp directory fixture에서 구분할 수 있어야 한다.

## 2. Current Context

- [x] Task 001에서 scaffold와 architecture guard를 완료했다.
- [x] Task 002에서 RuntimeContext와 설정 경계를 완료했다.
- [x] Task 003에서 core domain model과 policies를 완료했다.
- [x] Task 004에서 in-memory skill parser/analyzer를 완료했다.
- [x] Task 005에서 main repository initializer, source scanner, repository metadata roundtrip을 완료했다.
- [x] 이번 태스크를 시작해야 하는 이유는 이후 RefreshSkills read model과 remove/apply/transfer 유스케이스가 target 상태를 안전하게 읽어야 하기 때문이다.

## 3. Scope

### Included

- [x] `FileSystemTargetStore` infrastructure adapter를 만든다.
- [x] `scanAppliedSkills({ targetPath, knownSourcePaths })`를 구현한다.
- [x] target entry가 known source path를 가리키는 symlink이면 `managed-symlink`로 분류한다.
- [x] target entry가 `.sponzey-applied.json` metadata를 가진 directory이면 `managed-copy`로 분류한다.
- [x] target entry가 `SKILL.md`를 가진 directory이고 managed metadata가 없으면 `external`로 분류한다.
- [x] target entry가 깨진 symlink이면 `broken-symlink`와 diagnostic을 반환한다.

### Excluded

- [x] target write, copy, symlink creation을 구현하지 않는다.
- [x] remove/delete 동작을 구현하지 않는다.
- [x] RefreshSkills read model을 구현하지 않는다.
- [x] VSCode UI와 command를 구현하지 않는다.
- [x] settings reader나 environment 접근을 추가하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] target directory scanner를 구현한다.
- [x] 입력은 `{ targetPath, knownSourcePaths }`다.
- [x] 출력은 `{ ok, appliedSkills, diagnostics }` 형태의 result다.
- [x] 성공 조건은 temp target directory의 entry를 이름순으로 읽는 것이다.
- [x] 실패 조건은 scanner가 runtime 설정이나 home directory를 암묵적으로 읽는 것이다.

### Functional Unit 2

- [x] managed symlink와 broken symlink를 분류한다.
- [x] known source path로 resolve되는 symlink는 `managed-symlink`다.
- [x] resolve할 수 없는 symlink는 `broken-symlink`이며 warning diagnostic을 반환한다.
- [x] 성공 조건은 broken symlink가 throw 없이 result에 포함되는 것이다.

### Functional Unit 3

- [x] managed copy와 external directory를 분류한다.
- [x] `.sponzey-applied.json` metadata가 있는 directory는 `managed-copy`다.
- [x] `SKILL.md`만 있고 metadata가 없는 directory는 `external`이다.
- [x] 성공 조건은 metadata parse failure가 typed diagnostic으로 반환되는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `infrastructure/filesystem`이다.
- [x] Domain과 Application에는 filesystem import를 추가하지 않는다.
- [x] Infrastructure adapter는 filesystem fact를 읽고 typed result로 반환한다.
- [x] Adapter는 remove/apply/transfer 정책을 결정하지 않는다.
- [x] Target classification은 read model 준비를 위한 adapter output이며, domain policy decision이 아니다.
- [x] Adapter는 로그를 직접 출력하지 않는다.

## 6. Configuration Rules

- [x] adapter는 target path를 설정에서 읽지 않는다.
- [x] `targetPath`와 `knownSourcePaths`는 함수 input으로 명시 전달한다.
- [x] runtime 중간에 환경 값을 조회하거나 변경하지 않는다.
- [x] target path 기본값을 전역 상수로 두지 않는다.

## 7. Logging Requirements

### Product Log

- [x] Product Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] scan 결과는 후속 application layer에서 `target.scan.completed` event로 변환 가능해야 한다.
- [x] Product Log 후보 정보는 count와 target scope 수준으로 제한한다.

### Field Debug Log

- [x] Field Debug Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] broken symlink와 invalid metadata는 diagnostic code로 반환한다.
- [x] 파일 내용 전문이나 민감 정보를 diagnostic message에 포함하지 않는다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 debug print를 남기지 않는다.

## 8. State Machine Requirements

- [x] adapter 자체는 상태머신을 갖지 않는다.
- [x] target scan은 future RefreshSkills state machine의 side effect step으로 호출될 수 있게 작은 함수로 유지한다.
- [x] 실패 상태는 result diagnostic code로 표현한다.
- [x] 복잡한 흐름을 boolean flag 조합으로 관리하지 않는다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상 adapter는 `FileSystemTargetStore`다.
- [x] managed symlink 테스트는 temp main source와 temp target symlink fixture를 사용한다.
- [x] managed copy 테스트는 `.sponzey-applied.json` metadata fixture를 사용한다.
- [x] external 테스트는 `SKILL.md`만 있는 directory fixture를 사용한다.
- [x] broken symlink 테스트는 존재하지 않는 target을 가리키는 symlink fixture를 사용한다.
- [x] invalid metadata 테스트는 typed diagnostic을 검증한다.
- [x] 설정 값 전달 방식은 adapter가 input path만 사용한다는 테스트와 architecture guard로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 작성한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현을 작성한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 파일시스템 접근이 infrastructure 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] adapter가 직접 로그를 출력하지 않는지 확인한다.
- [x] typed diagnostic/result를 사용했는지 확인한다.
- [x] 모든 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 도메인 계층이 외부 프레임워크에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 환경 값이 전역 상수처럼 사용되지 않는다.
- [x] 외부 API, DB, 파일시스템, 네트워크 접근이 경계 계층에만 존재한다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

- [x] 수행한 변경 사항을 요약한다.
  - `FileSystemTargetStore` infrastructure adapter를 추가했다.
  - `scanAppliedSkills({ targetPath, knownSourcePaths })`가 target directory를 이름순으로 scan하도록 했다.
  - known source path로 resolve되는 symlink를 `managed-symlink`로 분류했다.
  - `.sponzey-applied.json` metadata가 있는 directory를 `managed-copy`로 분류했다.
  - `SKILL.md`만 있고 managed metadata가 없는 directory를 `external`로 분류했다.
  - 깨진 symlink를 `broken-symlink`로 분류하고 warning diagnostic을 반환하도록 했다.
  - invalid `.sponzey-applied.json`은 throw하지 않고 `invalid-applied-metadata` diagnostic과 `invalid-managed-copy` result로 반환하도록 했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 생성: `src/infrastructure/filesystem/file-system-target-store.js`
  - 수정: `src/infrastructure/index.js`
  - 생성: `test/infrastructure/file-system-target-store.test.mjs`
  - 수정: `.tasks/task006.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 29 tests / 29 pass
  - `npm run check:architecture`: 통과, 11 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - filesystem import가 infrastructure 계층에만 존재하는지 확인했다.
  - scanner가 target path와 known source paths를 input으로만 받는지 확인했다.
  - scanner가 설정 파일, 환경 변수, home directory를 조회하지 않는지 확인했다.
  - broken symlink가 throw 없이 typed diagnostic으로 반환되는지 확인했다.
  - invalid managed metadata가 파일 내용 전문을 diagnostic message에 포함하지 않는지 확인했다.
  - target write, remove, copy, symlink creation 정책을 adapter scan에 섞지 않았는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - symlink 생성/삭제 기능과 symlink capability detection은 아직 없다.
  - safe recursive copy와 overwrite 기본 거부는 아직 없다.
  - safe remove는 아직 없으며 source 삭제 방지 검증도 다음 태스크에서 필요하다.
  - `external-symlink`는 구현되어 있지만 아직 별도 테스트와 read model 반영이 없다.
  - target scan result는 아직 application read model로 집계되지 않는다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 safe filesystem write primitive를 다뤄야 한다.
  - safe copy는 destination overwrite를 기본 거부하고 `.sponzey-applied.json`을 기록해야 한다.
  - safe remove는 target entry만 제거하고 main source를 절대 삭제하지 않는 테스트를 포함해야 한다.
  - apply/import use case는 이 adapter를 직접 생성하지 말고 port 또는 명시 dependency로 주입받아야 한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.
- [x] 도달했다면 추가 태스크를 생성하지 않는다.
- [x] 도달하지 못했다면 남은 목표를 정리한다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 결정한다.
  - 다음 태스크 파일명은 `.tasks/task007.md`로 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - 다음 태스크는 safe copy/remove filesystem primitive만 다룬다.
- [x] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작한다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [x] `plan.md`의 최종 목표에 도달했다.
- [x] 필수 요구사항이 불명확하여 더 이상 안전하게 진행할 수 없다.
- [x] 외부 정보, 권한, 비밀값, 접근 권한이 없어 진행할 수 없다.
- [x] `AGENTS.md` 원칙과 충돌하는 요구사항이 발견되었다.
- [x] 테스트 또는 검증 환경이 없어 완료 여부를 판단할 수 없다.
- [x] 코드베이스 구조가 계획과 크게 달라 태스크 재설계가 필요하다.
- [x] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.
