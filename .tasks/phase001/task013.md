# Task 013. Move Applied Skill To Main Repository

## 1. Task Purpose

- [x] 이 태스크의 목적은 target에 존재하는 applied skill을 Main Repository로 move하는 application 유스케이스를 구현하는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 8 목표 중 `MoveAppliedSkillToMainRepository`와 explicit target cleanup confirmation을 다룬다.
- [x] 이 태스크 완료 후 move는 copy to main 성공 이후, 사용자가 target cleanup을 명시 확인한 경우에만 target entry를 제거해야 한다.

## 2. Current Context

- [x] Task 001에서 scaffold와 architecture guard를 완료했다.
- [x] Task 002에서 RuntimeContext와 설정 경계를 완료했다.
- [x] Task 003에서 core domain model과 policies를 완료했다.
- [x] Task 004에서 in-memory skill parser/analyzer를 완료했다.
- [x] Task 005에서 main repository filesystem storage를 완료했다.
- [x] Task 006에서 target scan/classification을 완료했다.
- [x] Task 007에서 safe target copy/remove primitive를 완료했다.
- [x] Task 008에서 RefreshSkills read model 유스케이스를 완료했다.
- [x] Task 009에서 create/import source skill 유스케이스를 완료했다.
- [x] Task 010에서 copy apply와 safe remove 유스케이스를 완료했다.
- [x] Task 011에서 symlink apply primitive와 mode branch를 완료했다.
- [x] Task 012에서 target skill copy/backup to main repository를 완료했다.
- [x] 이번 태스크를 시작해야 하는 이유는 MVP 요구사항이 target skill move to main repository를 포함하기 때문이다.

## 3. Scope

### Included

- [x] `moveAppliedSkillToMainRepository({ context, input, skillRepository, targetStore })` application 유스케이스를 만든다.
- [x] cleanup confirmation이 없으면 move를 차단한다.
- [x] cleanup confirmation이 있으면 copy to main을 먼저 수행한다.
- [x] copy 성공 후 target store `removeTargetEntry`를 호출한다.
- [x] copy failure 시 target cleanup을 수행하지 않는다.
- [x] move result와 Product Log 후보 event를 반환한다.

### Excluded

- [x] 새로운 filesystem primitive를 만들지 않는다.
- [x] conflict rename UI를 구현하지 않는다.
- [x] backup restore/promote를 구현하지 않는다.
- [x] VSCode command와 tree view를 구현하지 않는다.
- [x] directory hash verification을 구현하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] move confirmation gate를 구현한다.
- [x] 입력은 `cleanupConfirmed` flag다.
- [x] 출력은 blocked result 또는 proceed result다.
- [x] 성공 조건은 confirmation 없이는 repository copy와 target remove가 모두 호출되지 않는 것이다.

### Functional Unit 2

- [x] copy then cleanup move flow를 구현한다.
- [x] copy to main repository가 성공한 뒤 target remove를 수행한다.
- [x] 성공 조건은 output이 created source와 removed target entry를 모두 포함하는 것이다.
- [x] 실패 조건은 copy 실패 후 target cleanup이 수행되는 것이다.

### Functional Unit 3

- [x] move failure를 typed result로 반환한다.
- [x] copy conflict와 remove failure는 diagnostic으로 반환한다.
- [x] 성공 조건은 Product Log 후보 event가 완료/차단/실패를 구분하는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `application/transfer`다.
- [x] Application은 concrete infrastructure class를 import하지 않는다.
- [x] Filesystem copy/remove는 repository port와 target store port 뒤에 둔다.
- [x] Domain/Application에는 filesystem import를 추가하지 않는다.
- [x] target cleanup confirmation은 Presentation이 수집해 use case input으로 전달해야 한다.

## 6. Configuration Rules

- [x] move는 `RuntimeContext`로 전달된 `mainRepositoryPath`만 사용한다.
- [x] target path와 confirmation flag는 input DTO에서만 받는다.
- [x] settings reader, environment, config file을 재조회하지 않는다.
- [x] confirmation state를 전역 변수로 저장하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] 실제 Product Log 출력은 하지 않는다.
- [x] output `events`에 `skill.transfer.move.completed`, `skill.transfer.move.blocked`, `skill.transfer.failed` 후보를 포함한다.
- [x] Product Log 후보는 skill name, target id, result code 수준으로 제한한다.

### Field Debug Log

- [x] 실제 Field Debug Log 출력은 하지 않는다.
- [x] confirmation block, copy failure, cleanup failure는 diagnostic code로 반환한다.
- [x] skill file content는 event/message에 포함하지 않는다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 debug print를 남기지 않는다.

## 8. State Machine Requirements

- [x] move 상태는 `ValidatingInput`, `CheckingCleanupConfirmation`, `LoadingTargetSkill`, `CheckingNameConflict`, `WritingMainRepository`, `OptionalTargetCleanup`, `Completed`로 정의한다.
- [x] 실패 상태는 `CleanupConfirmationRequired`, `NameConflictBlocked`, `CleanupFailed`로 표현한다.
- [x] 상태 전이는 테스트 가능해야 한다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] confirmation missing 테스트는 repository와 target store가 호출되지 않는지 검증한다.
- [x] move success 테스트는 copy 후 remove 순서를 검증한다.
- [x] copy conflict 테스트는 remove가 호출되지 않는지 검증한다.
- [x] remove failure 테스트는 copied source result와 cleanup failure diagnostic을 반환하는지 검증한다.
- [x] fake port를 사용해 application 유스케이스를 filesystem 없이 검증한다.
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
  - `moveAppliedSkillToMainRepository` application 유스케이스를 추가했다.
  - cleanup confirmation이 없으면 repository copy와 target remove가 모두 호출되지 않는 blocked result를 반환하도록 했다.
  - cleanup confirmation이 있으면 copy to main repository를 먼저 수행하고, 성공 후 target cleanup을 수행하도록 했다.
  - copy conflict가 발생하면 target cleanup을 수행하지 않도록 했다.
  - move 완료/차단/실패를 Product Log 후보 event로 표현하도록 했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 수정: `src/application/transfer/transfer-use-cases.js`
  - 수정: `src/application/index.js`
  - 수정: `test/application/transfer-use-cases.test.mjs`
  - 수정: `.tasks/task013.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 60 tests / 60 pass
  - `npm run check:architecture`: 통과, 15 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - cleanup confirmation이 없으면 copy/remove port가 호출되지 않는지 확인했다.
  - move success에서 repository copy가 target remove보다 먼저 호출되는지 확인했다.
  - move success output이 copied source와 removed target entry를 모두 포함하는지 확인했다.
  - copy conflict 발생 시 target remove가 호출되지 않는지 확인했다.
  - Application이 concrete infrastructure adapter를 import하지 않는지 확인했다.
  - filesystem import가 infrastructure 계층에만 존재하는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - cleanup failure가 발생했을 때 copied source rollback은 아직 없다.
  - move origin metadata는 `target-move`로 기록되지만 adapter-level test는 copy primitive 재사용 수준이다.
  - Presentation confirmation UI는 아직 없다.
  - VSCode command, tree view, extension contribution metadata는 아직 없다.
  - release packaging과 manual smoke는 아직 없다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 Presentation/extension command registry와 package contribution metadata를 구현해야 한다.
  - command handler는 유스케이스를 호출하고 result를 표시하는 역할만 해야 하며 domain policy를 재구현하면 안 된다.
  - VSCode API 직접 의존은 presentation/extension boundary에만 있어야 한다.
  - 테스트 환경에서는 VSCode runtime 없이 command descriptor와 handler wiring을 검증해야 한다.

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
  - 다음 태스크 파일명은 `.tasks/task014.md`로 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - 다음 태스크는 VSCode command contribution metadata와 presentation command registry/wiring을 다룬다.
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
