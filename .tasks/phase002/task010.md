# Task 010. Analyzer Taxonomy Structure And Quality Rules

## 1. Summary

- [x] 목적: analyzer diagnostic category를 정규화하고 frontmatter, structure, description quality rule을 확장한다.
- [x] 해결 문제: MVP analyzer가 기본 위험도 중심이라 `SKILL.md` 구조 오류와 설명 품질 문제를 충분히 구분하지 못한다.
- [x] 완료 상태: diagnostics가 `structure`, `quality`, `security`, `compatibility`, `dependency`, `sync` category와 severity/recommendation을 가진다.

## 2. Scope

### Included

- [x] diagnostic category taxonomy normalization
- [x] frontmatter parser hardening and malformed frontmatter diagnostic
- [x] directory/name mismatch and broad/short/ambiguous description quality rules

### Excluded

- [x] security/prompt injection rule
- [x] dependency extraction rule
- [x] compatibility warning rule

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 005 diagnostic categories
- [x] `.tasks/plan.md` Phase 005 frontmatter parser hardening, structure rules, description quality rules
- [x] `.tasks/plan.md` 10. Logging Strategy `analysis.rule.completed`
- [x] `AGENTS.md` 8. TDD Policy, 13.5 Risk Policy

## 4. Dependencies

### Previous Tasks

- [x] Task 008. Skill Detail And Diagnostics Grouping
- [x] Task 009. Analyze Commands And Copy Update With Sync Guard

### Next Tasks

- [x] Task 011. Analyzer Security Dependency Compatibility Rules

## 5. Architecture Notes

- [x] 변경 계층: Domain/Application analyzer rule engine and diagnostics model
- [x] 의존 방향: analyzer rules는 file content DTO를 입력으로 받고 filesystem adapter를 직접 호출하지 않는다.
- [x] 도메인 책임: diagnostic category, severity, recommendation, risk aggregation input semantics 제공
- [x] 유스케이스 책임: rules orchestration and diagnostic aggregation
- [x] 인프라 책임: 없음. file content read는 기존 repository port를 사용한다.
- [x] 외부 시스템 접근 위치: 없음. 이 태스크의 rule tests는 in-memory files로 수행한다.

## 6. Functional Requirements

- [x] malformed frontmatter는 `structure` diagnostic과 parser-specific error code를 반환한다.
- [x] directory name과 `name` mismatch는 `structure` warning 또는 policy-defined severity를 반환한다.
- [x] broad/short/ambiguous description은 `quality` diagnostic과 개선 recommendation을 반환한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: rule enable/disable 설정을 추가하지 않고 code policy와 explicit input만 사용한다.
- [x] 로그 요구사항: analysis summary는 Product Log 후보, rule execution detail은 Field Debug Log 후보로 분리한다.
- [x] 오류 처리: parse failure는 analyzer crash가 아니라 typed diagnostic으로 반환한다.
- [x] 테스트 가능성: analyzer tests는 filesystem 없이 in-memory `SKILL.md` content로 실행한다.
- [x] 유지보수성: category/severity naming은 detail grouping과 command output에서 재사용된다.

## 8. Implementation Steps

- [x] malformed frontmatter가 `structure` diagnostic을 반환하는 실패 테스트를 작성한다.
- [x] directory/name mismatch 실패 테스트를 작성한다.
- [x] broad/short/ambiguous description 실패 테스트를 작성한다.
- [x] diagnostic category enum/value object를 정규화한다.
- [x] frontmatter parsing result를 typed success/failure로 바꾼다.
- [x] structure/quality rules를 pure function으로 구현한다.
- [x] `npm test`, `npm run build`를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 analyzer rule test를 먼저 작성한다.
- [x] analyzer orchestration use case test를 작성한다.
- [x] file content reader는 in-memory DTO 또는 fake port로 대체한다.
- [x] 설정 값 추가가 없음을 리뷰 항목으로 확인한다.
- [x] `skill.analysis.completed`, `skill.analysis.failed`, `analysis.rule.completed` event 후보를 검증한다.
- [x] malformed frontmatter, missing description, mismatch 오류 케이스를 테스트한다.
- [x] parser result model 정리는 기능 rule 추가와 분리한다.

## 10. Validation Checklist

- [x] diagnostics category가 detail grouping과 일치한다.
- [x] analyzer가 filesystem을 직접 읽지 않는다.
- [x] Domain/Application analyzer는 VSCode API에 의존하지 않는다.
- [x] analyzer 중 settings/env를 재조회하지 않는다.
- [x] analyzer input은 explicit file content DTO로 전달된다.
- [x] 로그 event 후보가 content를 노출하지 않는다.
- [x] fake file content로 모든 rule을 테스트할 수 있다.
- [x] analyzer step contract가 rule group별로 표현된다.
- [x] taxonomy 정리와 rule 추가가 리뷰 가능하게 분리된다.

## 11. Logging Requirements

### Product Log

- [x] `skill.analysis.completed`는 diagnostic count by severity/category만 기록한다.
- [x] `skill.analysis.failed`는 parse/read failure code와 masked skill id만 기록한다.

### Field Debug Log

- [x] `analysis.rule.completed`는 rule id, category, severity, elapsed bucket만 기록한다.
- [x] matched content, secret value, SKILL.md body는 기록하지 않는다.

### Development Log

- [x] rule fixture name과 expected diagnostic count는 test harness에서만 기록한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 명시 step contract가 필요하다.
- [x] 상태 목록: `LoadingSkillFiles`, `ParsingSkillMd`, `RunningStructureRules`, `RunningQualityRules`, `AggregatingRisk`, `Completed`
- [x] 이벤트 목록: `FilesLoaded`, `FrontmatterParsed`, `StructureRulesCompleted`, `QualityRulesCompleted`, `RiskAggregated`
- [x] 전이 조건: parse failure는 typed diagnostic을 추가하고 가능한 quality rule은 skip 또는 degraded mode로 처리한다.
- [x] 실패 상태: `MissingSkillMd`, `ParseFailed`, `UnreadableFile`, `RuleFailed`
- [x] 종료 상태: `Completed`
- [x] step output은 analyzer use case test에서 검증한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Diagnostics가 category/severity/recommendation을 포함한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 011이 같은 taxonomy에 security/dependency/compatibility rules를 추가할 수 있다.
