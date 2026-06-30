# Task 003. Domain Model And Core Policies

## 1. Task Purpose

- [x] 이 태스크의 목적은 MVP 핵심 도메인 개념과 정책 결정을 외부 의존성 없이 구현하는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 2 목표인 value object, entity, domain policy, machine-readable decision 구현에 기여한다.
- [x] 이 태스크 완료 후 source/target 분리, remove safety, backup safety, critical risk blocking 정책이 순수 domain test로 검증되어야 한다.

## 2. Current Context

- [x] Task 001에서 scaffold와 architecture guard를 완료했다.
- [x] Task 002에서 RuntimeContext builder와 설정 경계를 완료했다.
- [x] 이번 태스크를 시작해야 하는 이유는 analyzer, apply/remove/transfer use case가 의존할 domain decision이 필요하기 때문이다.
- [x] 현재 확인된 제약 사항은 외부 dependency 없이 Node.js 기본 test runner로 검증해야 한다는 점이다.

## 3. Scope

### Included

- [x] core value object와 entity factory를 만든다.
- [x] machine-readable policy decision type을 만든다.
- [x] RepositoryPathPolicy, RemovePolicy, TransferPolicy, RiskPolicy, ApplyConflictPolicy의 MVP decision을 구현한다.

### Excluded

- [x] RuntimeContext builder를 수정하지 않는다.
- [x] filesystem adapter를 구현하지 않는다.
- [x] analyzer와 상태머신을 구현하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] 도메인 값 객체와 entity factory를 구현한다.
- [x] 입력은 문자열 path, skill name, risk level, apply mode다.
- [x] 출력은 frozen domain object다.
- [x] 성공 조건은 값 객체가 외부 I/O 없이 생성되고 잘못된 값은 diagnostic decision으로 표현되는 것이다.
- [x] 실패 조건은 domain object가 mutable하거나 framework/filesystem에 의존하는 것이다.

### Functional Unit 2

- [x] source/target/remove/backup/transfer 정책을 구현한다.
- [x] 입력은 source path, target path, operation type, apply mode다.
- [x] 출력은 allow/block decision이다.
- [x] 성공 조건은 Main Repository와 Target overlap, source deletion, backup target mutation, overwrite를 차단하는 것이다.
- [x] 실패 조건은 위험한 operation이 allow로 반환되는 것이다.

### Functional Unit 3

- [x] risk policy를 구현한다.
- [x] 입력은 risk level과 optional confirmation state다.
- [x] 출력은 allow/block/confirm-required decision이다.
- [x] 성공 조건은 Critical risk가 block되고 High risk가 confirmation을 요구하는 것이다.
- [x] 실패 조건은 Critical risk가 target write 전에 allow되는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `domain/model`과 `domain/policy`다.
- [x] Domain은 VSCode API, filesystem, network, environment, logger에 의존하지 않는다.
- [x] 유스케이스 계층은 이번 태스크에서 변경하지 않는다.
- [x] 외부 시스템 접근은 없다.
- [x] 필요한 인터페이스와 포트는 이번 태스크에서 만들지 않는다.
- [x] 전역 상태, 숨겨진 I/O, 암묵적 설정 접근을 피한다.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 환경 값은 이번 태스크에서 사용하지 않는다.
- [x] 최초 수신 이후 환경 값을 전역 상수처럼 사용하는 구조를 만들지 않는다.
- [x] 정책 함수는 명시 인자만 받는다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지한다.

## 7. Logging Requirements

### Product Log

- [x] Product Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] 정책 decision은 Application에서 Product Log로 변환 가능하도록 code와 severity를 포함한다.
- [x] 민감 정보와 과도한 내부 상태를 기록하지 않는다.

### Field Debug Log

- [x] Field Debug Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] 정책 decision은 Field Debug Log detail로 변환 가능한 reason code를 포함한다.
- [x] 민감 정보 마스킹 기준은 후속 Logging Infrastructure 태스크에서 구현한다.
- [x] 보존 범위와 사용 범위는 이번 태스크 범위가 아니다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 만들지 않는다.
- [x] 테스트 완료 후 임시 debug 코드를 남기지 않는다.

## 8. State Machine Requirements

- [x] 상태머신은 이번 태스크에서 구현하지 않는다.
- [x] 이 태스크는 상태머신 입력으로 사용할 decision만 만든다.
- [x] 상태 목록은 후속 apply/remove/transfer 태스크에서 정의한다.
- [x] 이벤트 목록은 이번 태스크 범위가 아니다.
- [x] 전이 조건은 이번 태스크 범위가 아니다.
- [x] 실패 상태는 policy decision code로 표현한다.
- [x] 상태 전이 테스트는 이번 태스크 범위가 아니다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상은 domain model factory와 core policies다.
- [x] 정상 케이스 테스트는 valid value/entity creation과 low risk allow를 검증한다.
- [x] 실패 케이스 테스트는 path overlap, source deletion, backup mutation, critical risk block을 검증한다.
- [x] 경계값 테스트는 empty skill name과 external target conflict를 검증한다.
- [x] 외부 의존성은 사용하지 않는다.
- [x] 설정 값 전달 방식 테스트는 domain이 설정을 읽지 않는 것으로 검증한다.
- [x] 로그 정책 검증은 decision에 code/severity가 존재하는 것으로 검증한다.
- [x] 상태 전이가 없으므로 상태 전이 테스트는 작성하지 않는다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 작성한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현을 작성한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] 필요한 로그를 정책에 맞게 추가한다.
- [x] 상태 관리가 필요한 경우 명시적 상태 전이로 구현한다.
- [x] 중복과 구조 문제를 정리한다.
- [x] 모든 테스트를 실행한다.

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
  - `SkillName`, `SkillSource`, `SkillTarget` factory를 추가했다.
  - `RepositoryPathPolicy`, `RemovePolicy`, `TransferPolicy`, `RiskPolicy`, `ApplyConflictPolicy`의 MVP decision을 추가했다.
  - Domain policy decision은 code, severity, message 중심의 machine-readable 형태로 구현했다.
  - Domain 계층에는 외부 I/O, VSCode API, 환경 변수 접근을 넣지 않았다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - `src/domain/model/core.js`
  - `src/domain/policy/core-policies.js`
  - `src/domain/index.js`
  - `test/domain/domain-policy.test.mjs`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 최초 실행에서 missing export 실패를 확인했다. 구현 후 17개 테스트 모두 통과했다.
  - `npm run build`: 통과했다. `architecture ok`, `build smoke ok`.
  - `npm run check:architecture`: 통과했다. 8개 source file 검사.
- [x] 검증한 항목을 기록한다.
  - valid domain objects는 frozen object로 생성된다.
  - empty skill name은 `invalid-skill-name` diagnostic을 반환한다.
  - Main Repository와 Target overlap은 차단된다.
  - remove는 source deletion을 차단한다.
  - backup은 target mutation을 차단한다.
  - Critical risk는 blocked decision을 반환한다.
  - High risk는 confirmation required decision을 반환한다.
  - external target overwrite는 기본 차단된다.
- [x] 남은 위험 요소를 기록한다.
  - Domain model은 MVP 최소 필드만 포함한다. 이후 analyzer/filesystem/read model에서 필요한 field가 늘어나면 Tidy First로 확장해야 한다.
  - path normalization은 문자열 기반이다. 실제 filesystem adapter 단계에서 platform-specific path edge case를 다시 검증해야 한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 Phase 3의 `SKILL.md` parser와 static analyzer다.
  - analyzer는 parser port와 rule engine을 분리해야 한다.
  - Critical risk diagnostic은 현재 RiskPolicy로 전달 가능한 `riskLevel: "critical"`을 산출해야 한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.
  - 도달하지 않았다. Phase 0-2만 완료했다.
- [x] 도달했다면 추가 태스크를 생성하지 않는다.
  - 해당 없음. MVP 최종 목표에 도달하지 않았다.
- [x] 도달하지 못했다면 남은 목표를 정리한다.
  - analyzer, filesystem adapters, scan/read model, create/import, apply/remove, transfer, logging, presentation, watchers가 남아 있다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다.
  - Phase 3 `Skill Parser And Static Analyzer`가 다음 작업이다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다.
  - task004는 manifest parser, structure/description rules, security/risk aggregation 3개 단위로 제한한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
  - task004에는 valid skill, missing `SKILL.md`, missing description, critical patterns, missing reference 테스트를 포함한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
  - parser file reading은 adapter/port 경계로 제한하고 analyzer rules는 pure function으로 구현한다.
- [x] 다음 태스크 파일명을 결정한다.
  - `.tasks/task004.md`
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - `.tasks/task004.md`를 생성한다.
- [x] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작한다.
  - task004 생성 후 실패 테스트부터 실행한다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [x] `plan.md`의 최종 목표에 도달했다.
- [x] 필수 요구사항이 불명확하여 더 이상 안전하게 진행할 수 없다.
- [x] 외부 정보, 권한, 비밀값, 접근 권한이 없어 진행할 수 없다.
- [x] `AGENTS.md` 원칙과 충돌하는 요구사항이 발견되었다.
- [x] 테스트 또는 검증 환경이 없어 완료 여부를 판단할 수 없다.
- [x] 코드베이스 구조가 계획과 크게 달라 태스크 재설계가 필요하다.
- [x] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.
