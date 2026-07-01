# Task 009. Analyzer Remediation Suggestion Contract

## 1. Task Purpose

- [x] Analyzer diagnostic이 안전한 다음 행동을 표현할 수 있도록 `allowedActions`와 `blockedActions` 계약을 정의한다.
- [x] Critical risk diagnostic은 target write 계열 action을 차단하고, High risk diagnostic은 confirmation-gated action만 허용한다.
- [x] Diagnostics remediation UI가 나중에 command routing을 추가할 때 Domain/Application 정책을 우회하지 않도록 한다.

## 2. Current Context

- [x] Task 008에서 built-in analyzer policy pack, `policyRuleCode`, `policyVersion`, dependency category metadata가 구현되었다.
- [x] 현재 diagnostic은 message/recommendation 중심이라 사용자가 어떤 action을 안전하게 실행할 수 있는지 기계적으로 판단하기 어렵다.
- [x] Phase 004.7은 Diagnostics remediation workflow를 요구하지만, 이번 태스크는 UI command routing이 아니라 analyzer output contract까지만 다룬다.

## 3. Scope

### Included

- [x] Domain에 diagnostic remediation action policy를 추가한다.
- [x] Analyzer diagnostic normalization이 `allowedActions`와 `blockedActions`를 포함하도록 한다.
- [x] `analyzeAllSkills` persisted metadata가 remediation action contract를 보존하는지 테스트한다.

### Excluded

- [x] Diagnostics Tree context menu와 command palette routing은 이번 태스크에서 구현하지 않는다.
- [x] Mutating remediation 실행 use case는 이번 태스크에서 구현하지 않는다.
- [x] VSCode command id mapping은 Presentation 계층의 후속 태스크에서 다룬다.

## 4. Functional Units

### Functional Unit 1

- [x] Domain에 `suggestRemediationActions`를 추가한다.
- [x] 입력: diagnostic object with `code`, `category`, `severity`, `riskLevel`.
- [x] 출력: `{ allowedActions, blockedActions }`.
- [x] 성공 조건: Critical risk diagnostic은 `apply-skill-to-target`을 blocked action으로 반환한다.
- [x] 실패 조건: Domain이 VSCode API, filesystem, environment, command registry에 의존하지 않는다.

### Functional Unit 2

- [x] Analyzer가 normalized diagnostic마다 remediation action contract를 추가한다.
- [x] 입력: skill directory name과 file map.
- [x] 출력: diagnostics with policy metadata and remediation action metadata.
- [x] 성공 조건: destructive rule, missing description, dependency rule의 action policy가 deterministic하게 반환된다.
- [x] 실패 조건: skill body, raw matched text, secret value를 action metadata에 포함하지 않는다.

### Functional Unit 3

- [x] Repository analysis metadata persistence가 action metadata를 보존하는지 검증한다.
- [x] 입력: fake analyzer result with `allowedActions` and `blockedActions`.
- [x] 출력: persisted metadata diagnostics preserving action policy plus source id.
- [x] 성공 조건: Diagnostics view input이 analyzer action contract를 잃지 않는다.
- [x] 실패 조건: persistence layer가 action availability를 재계산하거나 외부 설정을 읽지 않는다.

## 5. Architecture Notes

- [x] 변경되는 계층은 Domain과 Application이다.
- [x] Domain은 diagnostic code/risk 기반 action policy만 결정한다.
- [x] Application analyzer는 Domain policy를 호출해 read model metadata를 조합한다.
- [x] Presentation은 이번 태스크에서 변경하지 않는다.
- [x] VSCode command id는 Domain에 넣지 않는다.
- [x] 실제 mutation action은 후속 use case와 confirmation flow를 통해서만 실행한다.

## 6. Configuration Rules

- [x] 새 외부 설정을 추가하지 않는다.
- [x] action availability를 설정 파일, 환경 변수, runtime 중간 변경으로 제어하지 않는다.
- [x] built-in action policy는 코드로 명시하고 analyzer output으로 전달한다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] 이번 태스크에서 새 Product Log event를 추가하지 않는다.
- [x] 기존 analysis completed/failed event payload에 raw skill content가 들어가지 않는지 유지한다.

### Field Debug Log

- [x] action policy decision detail은 후속 remediation execution task의 Field Debug Log 후보로 둔다.
- [x] 이번 태스크에서는 Field Debug Log 출력 구현을 추가하지 않는다.

### Development Log

- [x] action policy fixture detail은 test assertion으로만 둔다.
- [x] 프로덕션 기본 동작에 개발용 로그를 추가하지 않는다.

## 8. State Machine Requirements

- [x] Analyzer는 기존 explicit steps contract를 유지한다.
- [x] 이번 태스크는 새 mutation workflow를 실행하지 않으므로 별도 execution state machine을 추가하지 않는다.
- [x] 후속 remediation execution task는 `ReadingDiagnostic`, `ResolvingAllowedAction`, `CheckingRisk`, `RequiringConfirmation`, `ExecutingUseCase`, `RefreshingDiagnostics`, `Completed`, `Blocked`, `Failed` 상태를 구현해야 한다.

## 9. TDD Plan

- [x] 실패하는 Domain remediation policy 테스트를 먼저 작성한다.
- [x] 실패하는 analyzer action metadata 테스트를 먼저 작성한다.
- [x] 실패하는 persisted metadata preservation 테스트를 먼저 작성한다.
- [x] Critical risk diagnostic이 `apply-skill-to-target` blocked action을 반환하는지 검증한다.
- [x] High risk diagnostic이 confirmation-gated apply action만 허용하는지 검증한다.
- [x] Warning/Low diagnostic이 safe read-only action만 반환하는지 검증한다.
- [x] missing main repository diagnostic이 `set-main-repository` action을 반환하는지 검증한다.
- [x] backup-related diagnostic이 `compare-backup` action을 반환하는지 검증한다.
- [x] Analyzer output에 action metadata가 포함되고 raw body가 포함되지 않는지 검증한다.
- [x] 외부 의존성은 fake analyzer, fake repository, fake metadata store로 대체한다.

## 10. Implementation Checklist

- [x] 실패하는 Domain 테스트를 작성한다.
- [x] 실패하는 analyzer 테스트를 작성한다.
- [x] 실패하는 persisted metadata 테스트를 작성한다.
- [x] Domain action object contract를 구현한다.
- [x] Analyzer diagnostic normalization에 action metadata를 연결한다.
- [x] `analyzeAllSkills` metadata preservation 테스트를 통과시킨다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] 로그 정책을 침범하지 않는지 확인한다.
- [x] 모든 관련 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 도메인 계층이 filesystem, environment, VSCode에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 환경 값이 전역 상수처럼 사용되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 mutation 흐름이 이번 태스크에 새로 추가되지 않았다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.
  - Domain에 `suggestRemediationActions`를 추가해 diagnostic code/risk 기반 `allowedActions`, `blockedActions` 계약을 반환하도록 했다.
  - action object는 `code`, `sideEffect`, `mutatesTarget`, `requiresConfirmation`, `safety`만 포함하고 VSCode command id를 포함하지 않는다.
  - Critical risk diagnostic은 `apply-skill-to-target`을 blocked action으로 반환한다.
  - High risk diagnostic은 `apply-skill-to-target`을 confirmation-required allowed action으로 반환한다.
  - main repository configuration diagnostic은 `set-main-repository`, backup diagnostic은 `compare-backup` read-only action을 반환한다.
  - `analyzeSkillDirectory`가 normalized diagnostic마다 remediation action metadata를 추가한다.
  - `analyzeAllSkills` persisted metadata가 analyzer diagnostic의 action metadata를 그대로 보존하는 테스트를 추가했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - `.tasks/task009.md`
  - `src/domain/policy/core-policies.js`
  - `src/domain/index.js`
  - `src/application/analysis/analyze-skill-directory.js`
  - `test/domain/domain-policy.test.mjs`
  - `test/application/analyze-skill-directory.test.mjs`
  - `test/application/skill-operation-use-cases.test.mjs`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `node --test test/domain/domain-policy.test.mjs test/application/analyze-skill-directory.test.mjs test/application/skill-operation-use-cases.test.mjs` 통과: 50 tests, 50 pass
  - `npm test` 통과: 298 tests, 298 pass
  - `npm run build` 통과: architecture ok, manifest ok, build smoke ok
  - `npm run release:gate` 통과: tests, architecture, manifest, build, docs, smoke
- [x] 검증한 항목을 기록한다.
  - Domain remediation policy는 VSCode API, filesystem, environment, command registry에 의존하지 않는다.
  - Analyzer diagnostic은 policy metadata와 action metadata를 함께 반환한다.
  - Critical risk action policy는 target write를 차단한다.
  - High risk action policy는 confirmation-required action만 제공한다.
  - Warning/Low analyzer diagnostic은 safe read-only action만 제공한다.
  - action metadata에 raw skill body, matched command text, secret value가 포함되지 않는다.
  - 새 설정, 새 로그, 새 mutation workflow를 추가하지 않았다.
- [x] 남은 위험 요소를 기록한다.
  - Diagnostics Tree에서 `allowedActions`를 context menu로 노출하는 Presentation mapping은 아직 구현되지 않았다.
  - mutating remediation action execution state machine과 confirmation routing은 후속 태스크가 필요하다.
  - `.gitignore`에 `.tasks/`가 추가된 미커밋 변경 때문에 새 `.tasks/task009.md`는 현재 git status에 표시되지 않는다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 작업은 remediation action을 Diagnostics view/context menu에 안전하게 표시하는 Presentation mapping이다.
  - VSCode command id mapping은 Presentation 계층에서 action code를 기준으로 수행해야 한다.
  - mutating action은 `ResolvingAllowedAction`과 confirmation use case를 통과하기 전에는 실행하지 않아야 한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다. Phase 004 전체 목표에는 아직 도달하지 않았다.
- [x] 해당 없음: 최종 목표에 아직 도달하지 않아 추가 태스크 생성을 중단하지 않았다.
- [x] 도달하지 못했다면 남은 목표를 정리한다. 남은 목표는 diagnostics action presentation mapping, remediation command routing, target profile governance, release candidate readiness다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다. 다음 우선순위는 Diagnostics action presentation mapping이다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다. 다음 태스크는 action code를 tree item/context value/command payload에 노출하는 범위로 제한한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 결정한다. 다음 파일은 `.tasks/task010.md`다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [x] 해당 없음: `plan.md`의 최종 목표에는 아직 도달하지 않았다.
- [x] 해당 없음: 필수 요구사항이 명확하여 진행을 계속할 수 있었다.
- [x] 해당 없음: 추가 외부 정보, 권한, 비밀값, 접근 권한 없이 검증 가능한 범위에서 진행했다.
