# Task 005. Main Repository Filesystem Storage

## 1. Task Purpose

- [x] 이 태스크의 목적은 Main Skill Repository의 실제 파일시스템 저장 경계를 구현하는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 4 목표 중 repository initializer, source scanner, metadata read/write를 다룬다.
- [x] 이 태스크 완료 후 infrastructure adapter는 temp directory에서 main repository 구조를 만들고, source skill 목록을 읽고, repository metadata를 roundtrip할 수 있어야 한다.

## 2. Current Context

- [x] Task 001에서 scaffold와 architecture guard를 완료했다.
- [x] Task 002에서 RuntimeContext와 설정 경계를 완료했다.
- [x] Task 003에서 core domain model과 policies를 완료했다.
- [x] Task 004에서 in-memory `SKILL.md` parser와 static analyzer를 완료했다.
- [x] 이번 태스크를 시작해야 하는 이유는 이후 scan, import, apply, transfer 유스케이스가 사용할 main repository storage adapter가 필요하기 때문이다.

## 3. Scope

### Included

- [x] `FileSystemSkillRepository` infrastructure adapter를 만든다.
- [x] Main repository 초기화 시 `skills/`, `backups/`, `.sponzey/` 디렉토리를 생성한다.
- [x] `skills/*/SKILL.md`가 있는 디렉토리만 source skill 후보로 scan한다.
- [x] `.sponzey/repository.json` metadata read/write roundtrip을 구현한다.
- [x] adapter error는 throw 중심이 아니라 typed result로 반환한다.

### Excluded

- [x] target scanner를 구현하지 않는다.
- [x] symlink/copy/external/broken link detection을 구현하지 않는다.
- [x] safe recursive copy/remove를 구현하지 않는다.
- [x] VSCode command, tree view, UI를 구현하지 않는다.
- [x] 설정 파일이나 환경 변수를 adapter 내부에서 읽지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] `initializeRepository({ repositoryPath })`를 구현한다.
- [x] 입력은 명시적인 repository path다.
- [x] 출력은 `{ ok, repositoryPath, createdDirectories, error }` 형태의 result다.
- [x] 성공 조건은 temp root 아래에 `skills/`, `backups/`, `.sponzey/`가 생성되는 것이다.
- [x] 실패 조건은 adapter가 숨겨진 설정, home directory, 환경 변수를 읽는 것이다.

### Functional Unit 2

- [x] `scanSourceSkills({ repositoryPath })`를 구현한다.
- [x] 입력은 명시적인 repository path다.
- [x] 출력은 `{ ok, sources, error }` 형태의 result다.
- [x] 성공 조건은 `skills/*/SKILL.md`가 있는 디렉토리만 반환하는 것이다.
- [x] 실패 조건은 `skills/*` 외부 디렉토리나 `SKILL.md`가 없는 디렉토리를 source로 반환하는 것이다.

### Functional Unit 3

- [x] `writeRepositoryMetadata({ repositoryPath, metadata })`와 `readRepositoryMetadata({ repositoryPath })`를 구현한다.
- [x] metadata 파일 경로는 `.sponzey/repository.json`으로 고정한다.
- [x] 성공 조건은 JSON metadata가 같은 adapter로 roundtrip되는 것이다.
- [x] 실패 조건은 JSON parse error가 throw로 새어 나오거나 application/domain 계층에 filesystem 구현이 들어가는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `infrastructure/filesystem`이다.
- [x] Infrastructure adapter는 filesystem을 직접 사용할 수 있지만 use case decision을 결정하지 않는다.
- [x] Domain과 Application에는 filesystem import를 추가하지 않는다.
- [x] Adapter는 `SkillSource` domain factory를 사용할 수 있지만, 정책 판단은 하지 않는다.
- [x] Adapter는 Product Log, Field Debug Log, Development Log를 직접 출력하지 않는다.
- [x] Application 유스케이스가 필요할 때 adapter result를 log event로 변환한다.

## 6. Configuration Rules

- [x] adapter는 path를 설정 파일, 환경 변수, singleton에서 읽지 않는다.
- [x] 모든 path는 함수 input으로 명시 전달한다.
- [x] repository path는 runtime 중간에 재조회하지 않는다.
- [x] external setting을 전역 상수처럼 보관하지 않는다.
- [x] metadata는 repository 내부 상태 파일이며 외부 설정 파일로 취급하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] Product Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] adapter result는 후속 application layer에서 `repository.initialized`, `repository.scan.completed`, `repository.metadata.updated` event로 변환 가능해야 한다.
- [x] Product Log 후보 정보는 path와 count 수준으로 제한한다.

### Field Debug Log

- [x] Field Debug Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] failure result에는 machine-readable `code`를 포함한다.
- [x] filesystem error message는 테스트 가능한 범위에서만 포함하고 민감한 파일 내용은 포함하지 않는다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 debug print를 남기지 않는다.

## 8. State Machine Requirements

- [x] adapter 자체는 상태머신을 갖지 않는다.
- [x] repository initialize/scan/read/write는 future use case state machine의 side effect step으로 호출될 수 있게 작은 함수로 유지한다.
- [x] 복잡한 흐름을 boolean flag 조합으로 관리하지 않는다.
- [x] 실패는 typed result의 `error.code`로 표현한다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상 adapter는 `FileSystemSkillRepository`다.
- [x] repository init 테스트는 temp directory에서만 실행한다.
- [x] source scan 테스트는 `skills/valid/SKILL.md`, `skills/no-skill/README.md`, `outside/SKILL.md` fixture를 만든다.
- [x] metadata roundtrip 테스트는 `.sponzey/repository.json` write/read를 검증한다.
- [x] invalid JSON 테스트는 typed parse error result를 검증한다.
- [x] 외부 의존성은 temp directory로 제한한다.
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
  - `FileSystemSkillRepository` infrastructure adapter를 추가했다.
  - `initializeRepository({ repositoryPath })`가 명시적으로 받은 repository path 아래에 `skills/`, `backups/`, `.sponzey/` 디렉토리를 생성하도록 했다.
  - `scanSourceSkills({ repositoryPath })`가 `skills/*/SKILL.md`가 있는 디렉토리만 `SkillSource` 후보로 반환하도록 했다.
  - `writeRepositoryMetadata`와 `readRepositoryMetadata`가 `.sponzey/repository.json`을 roundtrip하도록 했다.
  - invalid JSON과 filesystem failure를 throw로 노출하지 않고 typed result로 반환하도록 했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 생성: `src/infrastructure/filesystem/file-system-skill-repository.js`
  - 수정: `src/infrastructure/index.js`
  - 생성: `test/infrastructure/file-system-skill-repository.test.mjs`
  - 수정: `.tasks/task005.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 26 tests / 26 pass
  - `npm run check:architecture`: 통과, 10 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - filesystem import가 infrastructure 계층에만 추가되었는지 확인했다.
  - adapter가 환경 변수, home directory, 설정 파일, singleton에서 path를 읽지 않는지 확인했다.
  - temp directory 기반 테스트만 사용해 실제 global/project skill target을 건드리지 않는지 확인했다.
  - metadata parse failure가 typed error `repository-metadata-invalid-json`으로 반환되는지 확인했다.
  - source scan이 `skills/*/SKILL.md` 외부 경로와 `SKILL.md` 없는 디렉토리를 source로 반환하지 않는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - directory hash, safe recursive copy/remove, symlink/copy/external/broken link detection은 아직 없다.
  - filesystem failure result는 현재 공통 `filesystem-operation-failed`이며 operation별 세부 error code는 후속 태스크에서 확장해야 한다.
  - repository metadata schema validation은 아직 없고 JSON parse 가능 여부만 검증한다.
  - path traversal 방어는 아직 safe write/copy 태스크에서 별도로 구현해야 한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 target store scanner와 managed/external/broken target detection을 구현해야 한다.
  - symlink detection은 플랫폼 차이를 고려해 typed capability/error result를 반환해야 한다.
  - managed copy는 `.sponzey-applied.json` metadata를 기준으로 식별해야 한다.
  - safe remove/copy는 source를 삭제하지 않는 policy 테스트와 함께 별도 태스크로 분리해야 한다.

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
  - 다음 태스크 파일명은 `.tasks/task006.md`로 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - 다음 태스크는 target filesystem scan과 applied skill classification만 다룬다.
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
