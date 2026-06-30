# Task 007. Safe Target Copy And Remove Primitives

## 1. Task Purpose

- [x] 이 태스크의 목적은 target write/remove의 최소 안전 primitive를 구현하는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 4 목표 중 safe recursive copy, overwrite 기본 거부, safe remove를 다룬다.
- [x] 이 태스크 완료 후 infrastructure adapter는 source skill을 target에 managed copy로 복사하고, target entry만 제거하며 source를 삭제하지 않아야 한다.

## 2. Current Context

- [x] Task 001에서 scaffold와 architecture guard를 완료했다.
- [x] Task 002에서 RuntimeContext와 설정 경계를 완료했다.
- [x] Task 003에서 core domain model과 policies를 완료했다.
- [x] Task 004에서 in-memory skill parser/analyzer를 완료했다.
- [x] Task 005에서 main repository filesystem storage를 완료했다.
- [x] Task 006에서 target scan/classification을 완료했다.
- [x] 이번 태스크를 시작해야 하는 이유는 apply/remove 유스케이스가 사용할 write primitive가 필요하기 때문이다.

## 3. Scope

### Included

- [x] `copySkillToTarget({ sourcePath, targetRootPath, skillName, metadata })`를 구현한다.
- [x] destination이 이미 존재하면 overwrite를 기본 거부한다.
- [x] `skillName` path traversal을 거부한다.
- [x] managed copy 생성 후 `.sponzey-applied.json` metadata를 기록한다.
- [x] `removeTargetEntry({ targetPath })`를 구현한다.
- [x] remove는 target entry만 제거하고 source path를 건드리지 않는다.

### Excluded

- [x] symlink apply creation은 구현하지 않는다.
- [x] apply/remove application use case는 구현하지 않는다.
- [x] delete source skill 기능은 구현하지 않는다.
- [x] conflict confirmation UI는 구현하지 않는다.
- [x] VSCode command와 tree view는 구현하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] safe managed copy를 구현한다.
- [x] 입력은 source path, target root path, skill name, metadata다.
- [x] 출력은 `{ ok, targetPath, metadataPath, error }` 형태의 result다.
- [x] 성공 조건은 source directory가 target root 아래 `skillName` directory로 복사되고 metadata가 기록되는 것이다.
- [x] 실패 조건은 destination overwrite 또는 path traversal이 허용되는 것이다.

### Functional Unit 2

- [x] safe target remove를 구현한다.
- [x] 입력은 명시적인 target entry path다.
- [x] 출력은 `{ ok, removedPath, removedKind, error }` 형태의 result다.
- [x] 성공 조건은 symlink target entry 또는 managed copy directory만 제거되고 source directory가 남아 있는 것이다.
- [x] 실패 조건은 symlink가 가리키는 source나 main repository source가 삭제되는 것이다.

### Functional Unit 3

- [x] copy/remove failure를 typed result로 반환한다.
- [x] filesystem failure, overwrite rejection, path traversal rejection을 machine-readable error code로 구분한다.
- [x] 성공 조건은 Product/Field Debug Log로 변환 가능한 code와 message를 반환하는 것이다.
- [x] 실패 조건은 adapter가 console log를 출력하거나 throw를 그대로 노출하는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `infrastructure/filesystem`이다.
- [x] Infrastructure adapter는 안전한 filesystem operation만 수행한다.
- [x] ApplyConflictPolicy, RemovePolicy 같은 domain decision은 adapter가 대신 결정하지 않는다.
- [x] Domain과 Application에는 filesystem import를 추가하지 않는다.
- [x] adapter는 overwrite 기본 거부를 filesystem 안전장치로 수행하고, user confirmation 정책은 후속 use case에서 처리한다.

## 6. Configuration Rules

- [x] adapter는 target path와 source path를 설정에서 읽지 않는다.
- [x] 모든 path는 함수 input으로 명시 전달한다.
- [x] runtime 중간에 환경 값을 조회하거나 변경하지 않는다.
- [x] target root 기본값을 전역 상수로 두지 않는다.

## 7. Logging Requirements

### Product Log

- [x] Product Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] copy/remove result는 후속 application layer에서 `target.copy.completed`, `target.remove.completed`, `target.copy.rejected` event로 변환 가능해야 한다.

### Field Debug Log

- [x] Field Debug Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] overwrite/path traversal/filesystem failure는 `error.code`로 반환한다.
- [x] 파일 내용 전문이나 민감 정보를 error message에 포함하지 않는다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 debug print를 남기지 않는다.

## 8. State Machine Requirements

- [x] adapter 자체는 상태머신을 갖지 않는다.
- [x] copy/remove는 future Apply/Remove use case state machine의 side effect step으로 호출될 수 있게 작은 함수로 유지한다.
- [x] 실패 상태는 result `error.code`로 표현한다.
- [x] 복잡한 흐름을 boolean flag 조합으로 관리하지 않는다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] managed copy 테스트는 source fixture와 target root fixture를 temp directory에 만든다.
- [x] overwrite rejection 테스트는 이미 존재하는 target directory를 만든 뒤 `target-overwrite-rejected`를 검증한다.
- [x] path traversal rejection 테스트는 `skillName: "../escape"` 입력이 `target-path-traversal-rejected`를 반환하는지 검증한다.
- [x] remove symlink 테스트는 symlink만 제거되고 source directory가 남는지 검증한다.
- [x] remove directory 테스트는 target copy만 제거되고 source directory가 남는지 검증한다.
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
- [x] typed error result를 사용했는지 확인한다.
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
  - `FileSystemTargetStore.copySkillToTarget`을 추가했다.
  - source skill directory를 target root 아래 `skillName` directory로 recursive copy하도록 했다.
  - managed copy 생성 후 `.sponzey-applied.json` metadata를 기록하도록 했다.
  - destination이 이미 존재하면 `target-overwrite-rejected` error result를 반환하도록 했다.
  - `skillName` path traversal 또는 absolute path 입력은 `target-path-traversal-rejected` error result로 거부하도록 했다.
  - `FileSystemTargetStore.removeTargetEntry`를 추가해 symlink, directory, file target entry만 제거하도록 했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 수정: `src/infrastructure/filesystem/file-system-target-store.js`
  - 수정: `test/infrastructure/file-system-target-store.test.mjs`
  - 수정: `.tasks/task007.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 33 tests / 33 pass
  - `npm run check:architecture`: 통과, 11 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - safe copy가 source directory content와 nested reference file을 target으로 복사하는지 확인했다.
  - managed copy metadata가 `.sponzey-applied.json`에 JSON으로 기록되는지 확인했다.
  - overwrite가 기본 거부되는지 확인했다.
  - `../escape` path traversal이 거부되고 target root 밖에 파일이 생성되지 않는지 확인했다.
  - symlink remove가 symlink 자체만 제거하고 source directory의 `SKILL.md`를 남기는지 확인했다.
  - directory remove가 target copy directory만 제거하고 source directory의 `SKILL.md`를 남기는지 확인했다.
  - filesystem import가 infrastructure 계층에만 존재하는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - symlink apply creation은 아직 없다.
  - copy 중 metadata write 실패 시 partial copy rollback은 아직 없다.
  - directory hash와 copy verification은 아직 없다.
  - application use case가 아직 없으므로 domain policy와 confirmation 흐름은 연결되지 않았다.
  - remove operation은 adapter primitive이며, source 삭제 방지 domain policy는 후속 use case에서 반드시 함께 적용해야 한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 Phase 5의 `RefreshSkills` read model을 구현해야 한다.
  - `RefreshSkills`는 main repository source scan과 target scan output을 조합하되 adapter를 직접 생성하지 않고 포트/의존성 주입으로 받아야 한다.
  - read model은 main repository source를 inactive로 표시하고, managed/external/broken target status를 UI가 읽을 수 있는 DTO로 반환해야 한다.
  - Product Log와 Field Debug Log는 실제 출력 없이 use case output event 후보로 표현해야 한다.

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
  - 다음 태스크 파일명은 `.tasks/task008.md`로 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - 다음 태스크는 RefreshSkills read model 유스케이스만 다룬다.
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
