# Task 011. Analyzer Security Dependency Compatibility Rules

## 1. Summary

- [x] 목적: analyzer에 security, dependency, compatibility rule을 추가하고 risk aggregation을 category/severity 기반으로 강화한다.
- [x] 해결 문제: destructive shell, broad permissions, MCP/network/env dependency, prompt injection 문구, Codex/Claude 호환성 이슈를 분석하지 못하면 위험 skill 차단이 약하다.
- [x] 완료 상태: critical/high/medium/low risk가 확장 rule set을 반영하고, Critical risk는 target write 전에 차단 가능한 output으로 전달된다.

## 2. Scope

### Included

- [x] security rules for destructive/policy override/secret exfiltration patterns
- [x] dependency extraction for MCP, shell command, network, environment variable references
- [x] compatibility rules for Codex/Claude/custom client warning

### Excluded

- [x] 외부 LLM 기반 분석
- [x] analyzer rule enable/disable settings
- [x] apply/update command implementation 변경

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 005 security rules, dependency extraction, compatibility rules
- [x] `.tasks/plan.md` 7.1 Analyzer policy gate
- [x] `.tasks/plan.md` 13. Risk And Mitigation analyzer false positive
- [x] `AGENTS.md` 13.5 Risk Policy, 8. TDD Policy

## 4. Dependencies

### Previous Tasks

- [x] Task 010. Analyzer Taxonomy Structure And Quality Rules

### Next Tasks

- [x] Task 012. Apply Mode Conversion And External-To-Managed Flow
- [x] Task 018. Logger Ports Adapters And Masking

## 5. Architecture Notes

- [x] 변경 계층: Domain/Application analyzer rules, risk aggregation policy
- [x] 의존 방향: analyzer rules는 explicit file content DTO만 받으며 filesystem/network/process env를 직접 읽지 않는다.
- [x] 도메인 책임: security/dependency/compatibility diagnostic semantics, critical/high risk aggregation rule
- [x] 유스케이스 책임: rule group 실행, diagnostics aggregation, metadata update output
- [x] 인프라 책임: 없음. file read는 기존 repository port contract를 통해 제공된다.
- [x] 외부 시스템 접근 위치: 없음. dependency extraction은 텍스트 분석이며 실제 network/MCP 호출을 수행하지 않는다.

## 6. Functional Requirements

- [x] destructive shell, credential exfiltration, policy override phrase는 critical 또는 policy-defined high diagnostic을 반환한다.
- [x] MCP server reference, shell command, network dependency, environment variable dependency를 dependency DTO로 추출한다.
- [x] Codex-only, Claude-only, unknown client requirement는 compatibility warning과 recommendation을 반환한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: risk policy 완화 설정은 추가하지 않고 기본 policy를 코드와 explicit confirmation flow로 유지한다.
- [x] 로그 요구사항: matched dangerous content와 secret-like value는 어떤 로그에도 기록하지 않는다.
- [x] 오류 처리: rule failure 하나가 전체 analyzer crash로 이어지지 않고 `RuleFailed` diagnostic으로 표현된다.
- [x] 테스트 가능성: 모든 rule은 in-memory fixture로 실행한다.
- [x] 유지보수성: dependency extraction DTO는 detail UX, apply warning, docs에서 재사용 가능하게 명명한다.

## 8. Implementation Steps

- [x] policy override phrase가 critical diagnostic을 반환하는 실패 테스트를 작성한다.
- [x] broad `allowed-tools` 또는 destructive shell pattern 테스트를 작성한다.
- [x] MCP/network/env dependency extraction 실패 테스트를 작성한다.
- [x] Codex/Claude compatibility warning 실패 테스트를 작성한다.
- [x] risk aggregation이 category/severity 기반으로 Critical/High를 산출하게 구현한다.
- [x] analyzer output metadata가 dependency summary와 compatibility warnings를 포함하게 한다.
- [x] `npm test`, `npm run build`를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 security/dependency/compatibility rule test를 먼저 작성한다.
- [x] analyzer orchestration test를 fake file content로 작성한다.
- [x] 외부 dependency는 실제 호출하지 않고 fixture 문자열로 대체한다.
- [x] 설정 값 없이 기본 risk policy가 동작하는지 테스트한다.
- [x] `analysis.rule.completed` event 후보가 matched content를 포함하지 않는지 검증한다.
- [x] rule failure, mixed severity, false positive prone case를 테스트한다.
- [x] risk aggregation 정리와 새 rule 추가를 리뷰 가능한 단위로 나눈다.

## 10. Validation Checklist

- [x] security/dependency/compatibility diagnostics가 category와 recommendation을 포함한다.
- [x] Critical risk는 apply/update 전에 차단 가능한 risk output으로 전달된다.
- [x] analyzer는 filesystem, network, process env에 직접 의존하지 않는다.
- [x] analyzer 중 settings/env를 재조회하지 않는다.
- [x] file content는 explicit DTO로만 전달된다.
- [x] 로그에 skill body, matched secret, dangerous command full text가 포함되지 않는다.
- [x] fake content로 외부 의존성을 대체할 수 있다.
- [x] analyzer step contract에 security/dependency/compatibility 단계가 추가된다.
- [x] 기능 변경과 risk aggregation 정리가 분리된다.

## 11. Logging Requirements

### Product Log

- [x] `skill.analysis.completed`는 critical/high/medium/low count와 dependency count만 기록한다.
- [x] `skill.analysis.failed`는 rule group failure code만 기록한다.

### Field Debug Log

- [x] `analysis.rule.completed`는 rule id, category, severity, recommendation id만 기록한다.
- [x] matched shell command, token-like value, full skill body는 기록하지 않는다.

### Development Log

- [x] fixture name과 expected diagnostic ids는 test harness에서만 기록한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: analyzer step contract 확장이 필요하다.
- [x] 상태 목록: `RunningSecurityRules`, `RunningDependencyRules`, `RunningCompatibilityRules`, `AggregatingRisk`, `Completed`
- [x] 이벤트 목록: `SecurityRulesCompleted`, `DependenciesExtracted`, `CompatibilityChecked`, `RiskAggregated`
- [x] 전이 조건: rule failure는 diagnostic으로 변환하고 가능한 나머지 rules를 계속 실행한다.
- [x] 실패 상태: `RuleFailed`, `UnreadableFile`, `AggregationFailed`
- [x] 종료 상태: `Completed`
- [x] step output은 analyzer use case test에서 검증한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Analyzer policy gate를 통과한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 012 이후 target write 흐름이 확장 risk output을 사용할 수 있다.
