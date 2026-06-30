# Task 009. Create And Import Source Skills

## 1. Task Purpose

- [x] 이 태스크의 목적은 Main Repository에 source skill을 생성하고 외부 skill folder를 import하는 MVP 유스케이스를 구현하는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 6 목표인 `CreateSkill`, `ImportSkillToMainRepository`, name conflict handling, optional post-import analysis를 다룬다.
- [x] 이 태스크 완료 후 create/import는 Global/Project Target을 자동 변경하지 않고 Main Repository source만 생성해야 한다.

## 2. Current Context

- [x] Task 001에서 scaffold와 architecture guard를 완료했다.
- [x] Task 002에서 RuntimeContext와 설정 경계를 완료했다.
- [x] Task 003에서 core domain model과 policies를 완료했다.
- [x] Task 004에서 in-memory skill parser/analyzer를 완료했다.
- [x] Task 005에서 main repository filesystem storage를 완료했다.
- [x] Task 006에서 target scan/classification을 완료했다.
- [x] Task 007에서 safe target copy/remove primitive를 완료했다.
- [x] Task 008에서 RefreshSkills read model 유스케이스를 완료했다.
- [x] 이번 태스크를 시작해야 하는 이유는 사용자가 source skill을 Main Repository에 만들거나 가져올 수 있어야 apply/transfer 기능으로 이어질 수 있기 때문이다.

## 3. Scope

### Included

- [x] `createSkill({ context, input, skillRepository })` application 유스케이스를 만든다.
- [x] `importSkillToMainRepository({ context, input, skillRepository, analyzer })` application 유스케이스를 만든다.
- [x] repository adapter에 `createSourceSkill` write primitive를 추가한다.
- [x] repository adapter에 `importSourceSkill` write primitive를 추가한다.
- [x] name conflict는 overwrite하지 않고 typed conflict result로 반환한다.
- [x] import 후 optional analysis는 input flag로만 실행한다.

### Excluded

- [x] create/import 후 target에 자동 apply하지 않는다.
- [x] VSCode command와 tree view를 구현하지 않는다.
- [x] target write/remove/symlink apply를 구현하지 않는다.
- [x] import conflict rename UI를 구현하지 않는다.
- [x] settings reader나 environment 접근을 추가하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] source skill 생성 유스케이스를 구현한다.
- [x] 입력은 `context.mainRepositoryPath`, `name`, `description`, `body`다.
- [x] 출력은 created source DTO와 Product Log 후보 event다.
- [x] 성공 조건은 `skills/<name>/SKILL.md`만 생성되고 target store가 호출되지 않는 것이다.
- [x] 실패 조건은 invalid name이나 existing source가 overwrite되는 것이다.

### Functional Unit 2

- [x] 외부 skill folder import 유스케이스를 구현한다.
- [x] 입력은 `context.mainRepositoryPath`, external source path, target skill name, optional analysis flag다.
- [x] 출력은 imported source DTO, optional analysis result, Product/Field Debug Log 후보 event다.
- [x] 성공 조건은 Main Repository에만 copy되고 target path가 변경되지 않는 것이다.
- [x] 실패 조건은 import가 apply까지 수행하거나 conflict를 overwrite하는 것이다.

### Functional Unit 3

- [x] repository filesystem write primitive를 구현한다.
- [x] `createSourceSkill`은 minimal `SKILL.md` template을 기록한다.
- [x] `importSourceSkill`은 external folder를 `skills/<name>`으로 copy하고 `.sponzey-source.json` origin metadata를 기록한다.
- [x] success/failure는 throw가 아니라 typed result로 반환한다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `application/source`와 `infrastructure/filesystem`이다.
- [x] Application은 concrete infrastructure class를 import하지 않는다.
- [x] Infrastructure는 filesystem write만 수행하고 create/import policy를 대신 결정하지 않는다.
- [x] Domain/Application에는 filesystem import를 추가하지 않는다.
- [x] create/import는 apply/remove/transfer와 분리된 유스케이스로 유지한다.
- [x] template 생성 정책은 Presentation에 두지 않는다.

## 6. Configuration Rules

- [x] create/import는 `RuntimeContext`로 전달된 `mainRepositoryPath`만 사용한다.
- [x] create/import 중 settings reader, environment, config file을 재조회하지 않는다.
- [x] repository path를 전역 상수로 저장하지 않는다.
- [x] optional analysis 여부는 input flag로만 받는다.

## 7. Logging Requirements

### Product Log

- [x] 실제 Product Log 출력은 하지 않는다.
- [x] output `events`에 `skill.created`, `skill.imported`, `skill.create.failed`, `skill.import.failed` 후보를 포함한다.
- [x] Product Log 후보는 name, source path, diagnostic count 수준으로 제한한다.

### Field Debug Log

- [x] 실제 Field Debug Log 출력은 하지 않는다.
- [x] conflict, validation, optional analysis detail은 Field Debug Log 후보 event로만 반환한다.
- [x] imported file content나 skill body 전문을 event/message에 포함하지 않는다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 debug print를 남기지 않는다.

## 8. State Machine Requirements

- [x] `importSkillToMainRepository`는 `steps` 배열로 상태 전이를 노출한다.
- [x] import 상태는 `ValidatingInput`, `LoadingSourceFolder`, `CheckingNameConflict`, `WritingMainRepository`, `WritingMetadata`, `OptionalAnalysis`, `Completed`로 정의한다.
- [x] create 상태는 `ValidatingInput`, `CheckingNameConflict`, `WritingMainRepository`, `Completed`로 정의한다.
- [x] 실패 상태는 `InvalidInput`, `NameConflictBlocked`, `WriteFailed`, `AnalysisFailed`로 표현한다.
- [x] 상태 전이는 테스트 가능해야 한다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] create 테스트는 source skill이 main repository에만 생성되는지 검증한다.
- [x] create invalid name 테스트는 repository write가 호출되지 않는지 검증한다.
- [x] import 테스트는 external folder copy와 `.sponzey-source.json` metadata를 검증한다.
- [x] conflict 테스트는 existing source를 overwrite하지 않는지 검증한다.
- [x] optional analysis 테스트는 input flag가 true일 때만 analyzer가 호출되는지 검증한다.
- [x] fake port를 사용해 application 유스케이스를 filesystem 없이 검증한다.
- [x] adapter test는 temp directory만 사용한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 작성한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현을 작성한다.
- [x] 계층 간 의존성을 확인한다.
- [x] Application이 concrete infrastructure를 import하지 않는지 확인한다.
- [x] 외부 파일시스템 접근이 infrastructure 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] 실제 logger 출력 없이 event 후보만 반환하는지 확인한다.
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
- [x] 테스트 더블로 외부 의존성을 대체할 수 있다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 플래그 조합이 아니라 명시적 상태로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

- [x] 수행한 변경 사항을 요약한다.
  - `createSkill` application 유스케이스를 추가했다.
  - `importSkillToMainRepository` application 유스케이스를 추가했다.
  - create/import가 `context.mainRepositoryPath`만 사용하고 target store를 호출하지 않는 계약을 테스트로 고정했다.
  - import 후 optional analysis는 `runAnalysisAfterImport` input flag가 true일 때만 analyzer port를 호출하도록 했다.
  - `FileSystemSkillRepository.createSourceSkill` write primitive를 추가했다.
  - `FileSystemSkillRepository.importSourceSkill` write primitive를 추가했다.
  - source name conflict와 source path traversal을 typed error result로 반환하도록 했다.
  - imported source에는 `.sponzey-source.json` origin metadata를 기록하도록 했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 생성: `src/application/source/source-skill-use-cases.js`
  - 수정: `src/application/index.js`
  - 수정: `src/infrastructure/filesystem/file-system-skill-repository.js`
  - 생성: `test/application/source-skill-use-cases.test.mjs`
  - 수정: `test/infrastructure/file-system-skill-repository.test.mjs`
  - 수정: `.tasks/task009.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 43 tests / 43 pass
  - `npm run check:architecture`: 통과, 13 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - create가 main repository source만 생성하고 target을 자동 변경하지 않는지 확인했다.
  - create invalid name이 repository write 전에 차단되는지 확인했다.
  - import가 external folder를 main repository `skills/<name>`으로 copy하는지 확인했다.
  - import가 `.sponzey-source.json` origin metadata를 기록하는지 확인했다.
  - conflict가 existing source를 overwrite하지 않는지 확인했다.
  - optional analysis가 input flag true일 때만 실행되는지 확인했다.
  - Application이 concrete infrastructure adapter를 import하지 않는지 확인했다.
  - filesystem import가 infrastructure 계층에만 존재하는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - import copy 중 metadata write 실패 시 partial copy rollback은 아직 없다.
  - imported folder의 `SKILL.md` 존재 여부와 manifest validation은 adapter primitive에서 강제하지 않는다.
  - conflict rename flow는 아직 없다.
  - create/import 결과가 RefreshSkills cache/index에 자동 반영되는 흐름은 아직 없다.
  - apply/remove/transfer 유스케이스는 아직 없다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 Phase 7의 apply/remove application 유스케이스를 구현해야 한다.
  - apply는 risk policy를 target write 전에 적용해야 한다.
  - apply는 copy mode부터 연결하고, symlink apply creation은 별도 기능 단위로 분리할 수 있다.
  - remove는 source 삭제 없이 target entry만 제거하고 external target 삭제를 기본 차단해야 한다.

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
  - 다음 태스크 파일명은 `.tasks/task010.md`로 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - 다음 태스크는 copy apply와 safe remove application 유스케이스만 다룬다.
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
