# Task 008. Built-In Analyzer Policy Pack

## 1. Task Purpose

- [x] Built-in analyzer policy pack을 명시적 Domain value로 정의한다.
- [x] Analyzer output이 policy version, policy rule code, normalized dependency category를 반환하도록 한다.
- [x] 외부 policy file 없이 기본 analyzer가 deterministic policy result를 반환하는지 테스트한다.

## 2. Current Context

- [x] Task 006에서 backup comparison 기반이 구현되었다.
- [x] Task 007에서 backup restore lifecycle 기반이 구현되었다.
- [x] 현재 analyzer는 rule function과 diagnostic code가 존재하지만 policy pack version과 policy rule catalog가 별도 contract로 분리되어 있지 않다.
- [x] 이번 태스크를 시작해야 하는 이유: Diagnostics, persisted metadata, target apply safety가 같은 normalized policy code와 severity를 사용해야 한다.

## 3. Scope

### Included

- [x] Domain에 built-in analyzer policy pack value를 추가한다.
- [x] analyzer diagnostic에 `policyRuleCode`와 `policyVersion`을 포함한다.
- [x] analyzer result에 `policyVersion`과 normalized dependency categories를 포함한다.
- [x] `analyzeAllSkills` persisted metadata에 analyzer policy version과 policy rule codes를 포함한다.

### Excluded

- [x] Diagnostics remediation command routing은 이번 태스크에서 다루지 않는다.
- [x] external/team policy file 자동 로딩은 이번 태스크에서 다루지 않는다.
- [x] target profile compatibility governance는 이번 태스크에서 다루지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] Domain에 `createBuiltInAnalyzerPolicyPack` value factory를 구현한다.
- [x] 입력: 없음.
- [x] 출력: frozen policy pack with `id`, `version`, `rules`.
- [x] 성공 조건: rule code, category, severity, riskLevel, recommendation이 명시된다.
- [x] 실패 조건: 외부 파일, 환경 변수, runtime setting에 의존하지 않는다.

### Functional Unit 2

- [x] `analyzeSkillDirectory`가 built-in policy metadata를 output에 포함한다.
- [x] 입력: skill directory name과 file map.
- [x] 출력: diagnostics with policy metadata, dependencies with normalized category, `policyVersion`.
- [x] 성공 조건: destructive, dependency, generic description fixture가 normalized policy output을 반환한다.
- [x] 실패 조건: skill body, raw matched text, secret value를 diagnostic message에 포함하지 않는다.

### Functional Unit 3

- [x] `analyzeAllSkills` metadata persistence가 policy version과 policy rule code를 저장한다.
- [x] 입력: analyzer result with policy metadata.
- [x] 출력: analysis metadata containing `policyVersion` and `policyRuleCodes`.
- [x] 성공 조건: persisted metadata와 diagnostics view input이 같은 diagnostic code를 사용한다.
- [x] 실패 조건: metadata persistence가 skill content body를 저장하지 않는다.

## 5. Architecture Notes

- [x] 변경되는 계층은 Domain과 Application이다.
- [x] Domain은 pure policy value와 rule catalog만 가진다.
- [x] Application analyzer는 file content input을 받아 pure policy result를 계산한다.
- [x] Infrastructure와 Presentation에는 이번 태스크에서 새 policy logic을 추가하지 않는다.
- [x] 외부 파일 읽기, settings lookup, environment lookup을 추가하지 않는다.
- [x] policy pack은 코드 내부 명시 모델이며 runtime 중간에 교체하지 않는다.

## 6. Configuration Rules

- [x] 새 설정을 추가하지 않는다.
- [x] 외부 policy file path 설정을 추가하지 않는다.
- [x] policy pack은 startup setting 또는 process env에서 읽지 않는다.
- [x] policy version은 analyzer output의 explicit value로 전달한다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지한다.

## 7. Logging Requirements

### Product Log

- [x] 이번 태스크에서 새 Product Log event를 추가하지 않는다.
- [x] 기존 `skill.analysis.completed` event는 유지한다.
- [x] Product Log payload에 matched raw text, skill body, secret value를 포함하지 않는다.

### Field Debug Log

- [x] matched rule code와 count는 Field Debug Log 후보로만 둔다.
- [x] 이번 태스크에서 Field Debug Log 출력 구현을 추가하지 않는다.
- [x] raw matched text와 file content는 기록하지 않는다.

### Development Log

- [x] policy fixture detail은 test-only assertion으로만 둔다.
- [x] 프로덕션 기본 동작에 개발용 로그를 추가하지 않는다.
- [x] 임시 console log를 만들지 않는다.

## 8. State Machine Requirements

- [x] analyzer는 explicit steps contract를 유지한다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록: `LoadingSkillDirectory`, `ParsingSkillMd`, `RunningStructureRules`, `RunningDescriptionRules`, `RunningSecurityRules`, `RunningDependencyRules`, `RunningCompatibilityRules`, `CalculatingRisk`, `Completed`, `MissingSkillMd`.
- [x] 이벤트 목록: `SkillMdLoaded`, `FrontmatterParsed`, `StructureEvaluated`, `DescriptionEvaluated`, `SecurityEvaluated`, `DependenciesEvaluated`, `CompatibilityEvaluated`, `RiskCalculated`.
- [x] 전이 조건: missing SKILL.md는 parse/evaluation 없이 `MissingSkillMd`로 종료한다.
- [x] 실패 상태: `MissingSkillMd`.
- [x] 종료 상태: `Completed`, `MissingSkillMd`.
- [x] 상태 전이는 analyzer tests에서 steps로 검증한다.

## 9. TDD Plan

- [x] 실패하는 Domain policy pack 테스트를 먼저 작성한다.
- [x] 실패하는 analyzer policy output 테스트를 먼저 작성한다.
- [x] 실패하는 persisted metadata 테스트를 먼저 작성한다.
- [x] 정상 케이스 테스트: built-in policy pack이 frozen rule catalog를 반환한다.
- [x] 정상 케이스 테스트: destructive shell instruction fixture가 critical policy finding을 반환한다.
- [x] 정상 케이스 테스트: dependency declaration이 tool/runtime/MCP/network category로 정규화된다.
- [x] 정상 케이스 테스트: overly generic description fixture가 quality policy diagnostic을 반환한다.
- [x] 정상 케이스 테스트: analyzer metadata persisted output이 `policyVersion`, `policyRuleCodes`, `analyzerVersion`을 포함한다.
- [x] regression 테스트: Critical risk apply가 target write 전에 계속 차단된다.
- [x] 외부 의존성은 fake analyzer, fake repository, fake metadata store로 대체한다.
- [x] 설정 값 전달 방식 테스트: analyzer는 external policy file을 읽지 않는다.
- [x] 로그 정책 검증 테스트: diagnostic message와 persisted metadata에 raw body가 포함되지 않는다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 실패하는 Domain policy pack 테스트를 먼저 작성한다.
- [x] 실패하는 analyzer policy output 테스트를 먼저 작성한다.
- [x] 실패하는 persisted metadata 테스트를 먼저 작성한다.
- [x] 최소 Domain policy value를 작성한다.
- [x] 최소 analyzer policy metadata mapping을 작성한다.
- [x] `analyzeAllSkills` metadata writer를 보강한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] Product Log payload가 기존 정책을 지키는지 확인한다.
- [x] 상태 관리가 explicit steps로 표현되었는지 확인한다.
- [x] 중복과 구조 문제를 정리한다.
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
- [x] 복잡한 흐름이 플래그 조합이 아니라 명시적 상태로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.
- [x] external policy file 자동 로딩이 추가되지 않았다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.
  - Domain에 `ANALYZER_POLICY_VERSION`과 `createBuiltInAnalyzerPolicyPack`을 추가했다.
  - built-in policy pack은 `sponzey-built-in-analyzer-policy`, `builtin-policy-v1`, frozen rule catalog를 반환한다.
  - `analyzeSkillDirectory`가 diagnostics에 `policyRuleCode`와 `policyVersion`을 추가하고 result에 `policyVersion`, `policyRuleCodes`를 반환하도록 했다.
  - dependency extraction이 `category`를 포함하도록 정규화했으며 `mcp`, `network`, `runtime`, `tool`, `environment` category를 구분한다.
  - analyzer result의 raw `body`는 빈 문자열로 유지해 skill content가 metadata/log 경로로 흘러가지 않게 했다.
  - `analyzeAllSkills` persisted metadata에 `policyVersion`과 `policyRuleCodes`를 저장하도록 했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - `src/domain/policy/core-policies.js`
  - `src/domain/index.js`
  - `src/application/analysis/analyze-skill-directory.js`
  - `src/application/skill/skill-operation-use-cases.js`
  - `test/domain/domain-policy.test.mjs`
  - `test/application/analyze-skill-directory.test.mjs`
  - `test/application/skill-operation-use-cases.test.mjs`
  - `.tasks/task007.md`
  - `.tasks/task008.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `node --test test/domain/domain-policy.test.mjs test/application/analyze-skill-directory.test.mjs test/application/skill-operation-use-cases.test.mjs` 통과
  - `node --test test/extension-composition.test.mjs test/extension-activation.test.mjs` 통과
  - `npm test` 통과: 295 tests, 295 pass
  - `npm run build` 통과: architecture ok, manifest ok, build smoke ok
  - `npm run release:gate` 통과: tests, architecture, manifest, build, docs, smoke
- [x] 검증한 항목을 기록한다.
  - built-in policy pack은 외부 설정 파일 또는 환경 변수 없이 생성된다.
  - destructive rule diagnostic은 `policyRuleCode`, `policyVersion`, critical severity/risk를 포함한다.
  - dependency declaration은 tool/runtime/MCP/network category로 정규화된다.
  - overly generic description은 quality policy diagnostic으로 반환된다.
  - persisted analysis metadata는 `analyzerVersion`, `policyVersion`, `policyRuleCodes`를 포함한다.
  - critical risk apply regression test는 전체 테스트에서 유지된다.
- [x] 남은 위험 요소를 기록한다.
  - pattern matching false positive는 아직 rule별 allowlist 또는 suppression 없이 동작한다.
  - remediation suggestion contract와 UI action routing은 아직 구현되지 않았다.
  - target profile compatibility governance는 아직 별도 policy model로 통합되지 않았다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 작업은 Phase 004.5의 analyzer recommendation/remediation suggestion contract다.
  - 다음 태스크는 `allowedActions`, `blockedActions`, severity-based action policy를 diagnostic에 연결해야 한다.
  - Field Debug Log rule-count 출력은 필요할 때 별도 task에서 추가해야 한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다. Built-in policy pack 기반은 구현했지만 Phase 004 전체 목표에는 도달하지 않았다.
- [ ] 도달했다면 추가 태스크를 생성하지 않는다.
- [x] 도달하지 못했다면 남은 목표를 정리한다. 남은 목표는 analyzer remediation suggestion contract, target profile governance, diagnostics remediation, release candidate readiness다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다. 다음 우선순위는 Phase 004.5 Analyzer Recommendation And Remediation Suggestion Contract이다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다. 다음 태스크는 `allowedActions`, `blockedActions`, severity-based action policy까지만 포함해야 한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 결정한다. 다음 파일은 `.tasks/task009.md`다.
- [ ] 다음 태스크를 `taskXXX.md`로 생성한다.
- [ ] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작한다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [ ] `plan.md`의 최종 목표에 도달했다.
- [ ] 필수 요구사항이 불명확하여 더 이상 안전하게 진행할 수 없다.
- [ ] 외부 정보, 권한, 비밀값, 접근 권한이 없어 진행할 수 없다.
- [ ] `AGENTS.md` 원칙과 충돌하는 요구사항이 발견되었다.
- [ ] 테스트 또는 검증 환경이 없어 완료 여부를 판단할 수 없다.
- [ ] 코드베이스 구조가 계획과 크게 달라 태스크 재설계가 필요하다.
- [ ] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.
