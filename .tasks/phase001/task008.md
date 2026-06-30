# Task 008. RefreshSkills Read Model Use Case

## 1. Task Purpose

- [x] 이 태스크의 목적은 Main Repository source와 target scan 결과를 조합해 tree view가 사용할 read model을 만드는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 5 목표인 `RefreshSkills`, source/applied matching, diagnostics aggregation, log event 후보 생성을 다룬다.
- [x] 이 태스크 완료 후 Presentation 없이 application test만으로 Main Repository, Global Skills, Project Skills, Diagnostics read model을 검증할 수 있어야 한다.

## 2. Current Context

- [x] Task 001에서 scaffold와 architecture guard를 완료했다.
- [x] Task 002에서 RuntimeContext와 설정 경계를 완료했다.
- [x] Task 003에서 core domain model과 policies를 완료했다.
- [x] Task 004에서 in-memory skill parser/analyzer를 완료했다.
- [x] Task 005에서 main repository filesystem storage를 완료했다.
- [x] Task 006에서 target scan/classification을 완료했다.
- [x] Task 007에서 safe target copy/remove primitive를 완료했다.
- [x] 이번 태스크를 시작해야 하는 이유는 UI와 command를 만들기 전에 application read model 계약이 필요하기 때문이다.

## 3. Scope

### Included

- [x] `refreshSkills({ context, skillRepository, targetStore })` 유스케이스를 만든다.
- [x] main repository source scan 결과를 `mainRepositorySkills` read model로 변환한다.
- [x] global/project target scan 결과를 `globalSkills`, `projectSkills` read model로 변환한다.
- [x] source path와 applied skill source path를 기준으로 managed source를 matching한다.
- [x] external, broken, invalid target diagnostic을 diagnostics read model로 aggregate한다.
- [x] Product Log와 Field Debug Log로 변환 가능한 event 후보를 output에 포함한다.

### Excluded

- [x] 실제 VSCode tree view를 구현하지 않는다.
- [x] 실제 filesystem adapter를 직접 생성하지 않는다.
- [x] index cache write를 구현하지 않는다.
- [x] apply/remove/import command를 구현하지 않는다.
- [x] settings reader나 environment 접근을 추가하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] repository source read model을 만든다.
- [x] 입력은 `context.mainRepositoryPath`와 `skillRepository.scanSourceSkills` port다.
- [x] 출력은 `mainRepositorySkills` 배열이다.
- [x] 성공 조건은 source가 명시 적용 전 `inactive` 상태로 표시되는 것이다.
- [x] 실패 조건은 main repository source가 자동 active skill로 표시되는 것이다.

### Functional Unit 2

- [x] global/project target read model을 만든다.
- [x] 입력은 `context.globalTargets`, `context.projectTargets`, `targetStore.scanAppliedSkills` port다.
- [x] 출력은 scope별 target group과 applied skill item이다.
- [x] 성공 조건은 managed symlink/copy, external, broken classification이 보존되는 것이다.
- [x] 실패 조건은 target path를 settings에서 다시 읽거나 adapter를 유스케이스 내부에서 직접 생성하는 것이다.

### Functional Unit 3

- [x] diagnostics aggregation과 log event 후보를 만든다.
- [x] 입력은 target scan diagnostics와 scan count다.
- [x] 출력은 `diagnostics`와 `events`다.
- [x] 성공 조건은 refresh completed Product Log 후보와 target scan Field Debug Log 후보가 생성되는 것이다.
- [x] 실패 조건은 application 유스케이스가 실제 logger를 직접 호출하거나 console output을 남기는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `application/refresh`다.
- [x] `refreshSkills`는 port interface 형태의 dependency를 input으로 받는다.
- [x] Application은 concrete infrastructure class를 import하지 않는다.
- [x] Domain/Application에는 filesystem import를 추가하지 않는다.
- [x] Read model은 Presentation이 소비할 DTO이며 domain entity를 그대로 노출하지 않는다.
- [x] adapter failure는 use case output diagnostic과 Product Log 후보 event로 변환한다.

## 6. Configuration Rules

- [x] refresh는 `RuntimeContext`로 전달된 path만 사용한다.
- [x] refresh 중 settings reader, environment, config file을 재조회하지 않는다.
- [x] target path는 `context.globalTargets`와 `context.projectTargets`에서만 가져온다.
- [x] context를 전역 상수로 저장하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] 실제 Product Log 출력은 하지 않는다.
- [x] output `events`에 `skills.refresh.completed` 또는 `skills.refresh.failed` 후보를 포함한다.
- [x] Product Log 후보는 source count, target count, diagnostic count 수준으로 제한한다.

### Field Debug Log

- [x] 실제 Field Debug Log 출력은 하지 않는다.
- [x] output `events`에 target별 `target.scan.completed` 후보를 포함한다.
- [x] Field Debug 후보는 target id, scope, applied skill count, diagnostic count를 포함한다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 debug print를 남기지 않는다.

## 8. State Machine Requirements

- [x] `refreshSkills`는 `steps` 배열로 상태 전이를 노출한다.
- [x] 상태는 `LoadingSources`, `LoadingTargets`, `MatchingSources`, `CalculatingReadModel`, `Completed`로 정의한다.
- [x] 실패 상태는 `SourceScanFailed` 또는 `TargetScanFailed`로 표현한다.
- [x] 상태 전이는 테스트 가능해야 한다.
- [x] 복잡한 내부 흐름을 boolean flag 조합으로 관리하지 않는다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] source-only 테스트는 source가 inactive로 표시되는지 검증한다.
- [x] mixed target 테스트는 managed symlink, managed copy, external, broken diagnostic aggregation을 검증한다.
- [x] failure 테스트는 source scan failure가 `skills.refresh.failed` event와 diagnostic으로 변환되는지 검증한다.
- [x] fake port를 사용해 filesystem 없이 application 유스케이스를 검증한다.
- [x] 설정 값 전달 방식은 context input만 사용한다는 테스트와 architecture guard로 검증한다.
- [x] 상태 전이가 있다면 `steps` 배열을 검증한다.
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
  - `refreshSkills({ context, skillRepository, targetStore })` application 유스케이스를 추가했다.
  - main repository source scan 결과를 `mainRepositorySkills` read model로 변환했다.
  - global/project target scan 결과를 scope별 target group read model로 변환했다.
  - managed symlink/copy는 source path 또는 metadata source path로 main repository source와 matching하도록 했다.
  - external, broken, invalid target 상태를 read model status로 분리했다.
  - target scan diagnostic을 target id/path와 함께 aggregate했다.
  - Product Log와 Field Debug Log로 변환 가능한 event 후보를 output에 포함했다.
  - `steps` 배열로 `LoadingSources`, `LoadingTargets`, `MatchingSources`, `CalculatingReadModel`, `Completed` 전이를 노출했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 생성: `src/application/refresh/refresh-skills.js`
  - 수정: `src/application/index.js`
  - 생성: `test/application/refresh-skills.test.mjs`
  - 수정: `.tasks/task008.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 36 tests / 36 pass
  - `npm run check:architecture`: 통과, 12 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - main repository source가 명시 apply 전 `inactive`으로 표시되는지 확인했다.
  - managed symlink와 managed copy가 source에 matching되어 source 상태가 `applied`로 바뀌는지 확인했다.
  - external target skill이 `external` status와 `sourceId: null`로 표시되는지 확인했다.
  - broken symlink diagnostic이 target id/path와 함께 aggregate되는지 확인했다.
  - source scan failure가 `skills.refresh.failed` Product Log 후보와 diagnostic으로 변환되는지 확인했다.
  - application 유스케이스가 concrete infrastructure adapter를 import하지 않는지 확인했다.
  - 실제 logger 출력 없이 event 후보만 반환하는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - read model index cache write는 아직 없다.
  - Presentation tree view는 아직 없다.
  - target scan failure에 대한 세부 target id/path enrichment는 아직 제한적이다.
  - external symlink 전용 UI status는 아직 별도 테스트가 없다.
  - create/import/apply/remove/transfer 유스케이스는 아직 read model과 연결되지 않았다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 Phase 6의 source skill create/import 유스케이스를 구현해야 한다.
  - create/import는 main repository에만 쓰고 global/project target을 자동 변경하면 안 된다.
  - source name conflict는 overwrite하지 않고 typed conflict result로 반환해야 한다.
  - import 후 optional analysis는 input flag로만 실행해야 하며 settings를 재조회하면 안 된다.

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
  - 다음 태스크 파일명은 `.tasks/task009.md`로 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - 다음 태스크는 CreateSkill과 ImportSkillToMainRepository의 application 계약과 repository adapter write primitive를 다룬다.
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
