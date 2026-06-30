# Task 010. Copy Apply And Safe Remove Use Cases

## 1. Task Purpose

- [x] 이 태스크의 목적은 source skill을 target에 copy mode로 적용하고, 적용된 target entry를 source 삭제 없이 제거하는 application 유스케이스를 구현하는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 7 목표 중 copy apply, risk blocking, remove safety, external remove blocking을 다룬다.
- [x] 이 태스크 완료 후 Critical risk는 target write 전에 차단되고, remove는 target entry만 제거해야 한다.

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
- [x] 이번 태스크를 시작해야 하는 이유는 source skill을 target에 실제 적용하고 제거하는 MVP 핵심 동작이 필요하기 때문이다.

## 3. Scope

### Included

- [x] `applySkillToTarget({ context, input, analyzer, targetStore })` application 유스케이스를 만든다.
- [x] copy apply mode만 구현한다.
- [x] risk analysis result를 domain `RiskPolicy`로 평가한다.
- [x] Critical risk는 target write 전에 차단한다.
- [x] High risk는 explicit confirmation 없이는 차단한다.
- [x] `removeAppliedSkill({ input, targetStore })` application 유스케이스를 만든다.
- [x] managed symlink/copy remove는 target entry만 제거한다.
- [x] external target remove는 기본 차단한다.

### Excluded

- [x] symlink apply creation은 구현하지 않는다.
- [x] switch apply mode는 구현하지 않는다.
- [x] VSCode command와 confirmation UI는 구현하지 않는다.
- [x] target scanner refresh 자동 호출은 구현하지 않는다.
- [x] transfer/copy/backup/move to main repository는 구현하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] copy apply 유스케이스를 구현한다.
- [x] 입력은 source DTO, target DTO, apply mode, confirmation flag다.
- [x] 출력은 applied result, diagnostics, events, steps다.
- [x] 성공 조건은 low risk source가 target store copy primitive로 전달되는 것이다.
- [x] 실패 조건은 Critical risk가 target write를 수행하는 것이다.

### Functional Unit 2

- [x] risk blocking을 구현한다.
- [x] analyzer output의 `riskLevel`을 domain `decideRiskPolicy`로 평가한다.
- [x] Critical은 항상 block, High는 confirmation 없으면 block, confirmation 있으면 proceed한다.
- [x] 성공 조건은 blocked result에 Product Log 후보 event와 diagnostic이 포함되는 것이다.

### Functional Unit 3

- [x] safe remove 유스케이스를 구현한다.
- [x] managed target entry는 target store remove primitive를 호출한다.
- [x] external target entry는 기본 차단한다.
- [x] 성공 조건은 remove output이 source 삭제 없이 target entry 제거 result를 반환하는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `application/apply`와 domain remove policy다.
- [x] Application은 concrete infrastructure class를 import하지 않는다.
- [x] Filesystem write/remove는 target store port 뒤에 둔다.
- [x] Domain/Application에는 filesystem import를 추가하지 않는다.
- [x] Presentation은 confirmation UI를 호출하고 confirmation result만 use case input으로 전달해야 한다.
- [x] adapter는 risk/remove policy를 대신 결정하지 않는다.

## 6. Configuration Rules

- [x] apply mode는 input에 명시되거나 `context.defaultApplyMode`에서만 온다.
- [x] apply/remove 중 settings reader, environment, config file을 재조회하지 않는다.
- [x] target path와 source path는 input DTO에서만 받는다.
- [x] confirmation state를 전역 변수로 저장하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] 실제 Product Log 출력은 하지 않는다.
- [x] output `events`에 `skill.apply.completed`, `skill.apply.blocked`, `skill.remove.completed`, `skill.remove.blocked` 후보를 포함한다.
- [x] Product Log 후보는 skill name, target id, result code 수준으로 제한한다.

### Field Debug Log

- [x] 실제 Field Debug Log 출력은 하지 않는다.
- [x] risk decision과 state transition detail은 Field Debug Log 후보 event로만 반환한다.
- [x] skill body 전문이나 파일 내용은 event/message에 포함하지 않는다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 debug print를 남기지 않는다.

## 8. State Machine Requirements

- [x] apply는 `steps` 배열로 상태 전이를 노출한다.
- [x] apply 상태는 `ValidatingInput`, `AnalyzingRisk`, `CheckingRiskPolicy`, `WritingTarget`, `VerifyingResult`, `Completed`로 정의한다.
- [x] apply 실패 상태는 `RiskBlocked`, `UnsupportedApplyMode`, `WriteFailed`로 표현한다.
- [x] remove 상태는 `ValidatingInput`, `CheckingRemovePolicy`, `RemovingTarget`, `Completed`로 정의한다.
- [x] remove 실패 상태는 `RemoveBlocked`, `RemoveFailed`로 표현한다.
- [x] 상태 전이는 테스트 가능해야 한다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] copy apply success 테스트는 target store copy primitive가 정확한 input으로 호출되는지 검증한다.
- [x] Critical risk 테스트는 target store가 호출되지 않는지 검증한다.
- [x] High risk without confirmation 테스트는 blocked result를 검증한다.
- [x] managed remove 테스트는 target store remove primitive가 호출되고 source delete 요청이 없는지 검증한다.
- [x] external remove 테스트는 target store가 호출되지 않고 blocked result를 반환하는지 검증한다.
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
  - `applySkillToTarget` application 유스케이스를 추가했다.
  - copy apply mode에서 analyzer port로 risk를 분석하고 domain `decideRiskPolicy`로 target write 전 차단 여부를 결정하도록 했다.
  - Critical risk는 항상 target write 전에 차단하도록 했다.
  - High risk는 explicit confirmation 없이는 target write 전에 차단하도록 했다.
  - low risk copy apply는 target store `copySkillToTarget` port를 호출하고 managed metadata를 전달하도록 했다.
  - `removeAppliedSkill` application 유스케이스를 추가했다.
  - managed target entry remove는 target store `removeTargetEntry` port만 호출하도록 했다.
  - external target remove는 기본 차단하도록 domain `decideRemovePolicy`를 확장했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 생성: `src/application/apply/apply-use-cases.js`
  - 수정: `src/application/index.js`
  - 수정: `src/domain/policy/core-policies.js`
  - 생성: `test/application/apply-use-cases.test.mjs`
  - 수정: `test/domain/domain-policy.test.mjs`
  - 수정: `.tasks/task010.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 49 tests / 49 pass
  - `npm run check:architecture`: 통과, 14 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - low risk source가 copy mode로 target store에 전달되는지 확인했다.
  - copy apply metadata가 source id/path, target id, apply mode를 포함하는지 확인했다.
  - Critical risk가 target write 전에 blocked result를 반환하고 target store를 호출하지 않는지 확인했다.
  - High risk without confirmation이 target write 전에 blocked result를 반환하는지 확인했다.
  - managed remove가 target entry path만 target store에 전달하는지 확인했다.
  - external remove가 target store 호출 없이 blocked result를 반환하는지 확인했다.
  - Application이 concrete infrastructure adapter를 import하지 않는지 확인했다.
  - filesystem import가 infrastructure 계층에만 존재하는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - symlink apply creation은 아직 없다.
  - switch apply mode는 아직 없다.
  - copy apply 후 RefreshSkills 자동 재계산은 아직 없다.
  - write failure rollback과 verification hash는 아직 없다.
  - confirmation UI는 아직 없고 input flag만 사용한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 symlink apply creation을 구현해야 한다.
  - symlink apply는 플랫폼 capability failure를 typed result로 반환해야 한다.
  - application apply 유스케이스는 `applyMode: "symlink"`를 지원하되, risk blocking은 copy mode와 동일하게 target write 전에 수행해야 한다.
  - switch mode는 symlink apply 이후 별도 태스크로 분리한다.

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
  - 다음 태스크 파일명은 `.tasks/task011.md`로 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - 다음 태스크는 symlink apply primitive와 application mode branch만 다룬다.
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
