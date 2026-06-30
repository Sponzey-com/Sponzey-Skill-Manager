# Task 008. Skill Detail And Diagnostics Grouping

## 1. Summary

- [x] 목적: source/applied skill의 상세 정보를 조회하고 diagnostics를 severity/category 기준으로 그룹화한다.
- [x] 해결 문제: tree 목록만으로는 risk, sync, applied target, file summary를 판단하기 어렵고 diagnostics가 사용자 행동으로 연결되지 않는다.
- [x] 완료 상태: `GetSkillDetail` output이 source/applied 구분 DTO를 반환하고, diagnostics grouping mapper가 detail rendering에 사용된다.

## 2. Scope

### Included

- [x] `GetSkillDetail` use case
- [x] source/applied detail read model
- [x] diagnostics severity/category grouping mapper

### Excluded

- [x] custom webview UI
- [x] analyzer rule set 확장
- [x] open folder/SKILL.md command 구현

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 004 detail read model
- [x] `.tasks/plan.md` Phase 004 diagnostics grouping
- [x] `.tasks/plan.md` 12.1 Analyzer/detail boundary
- [x] `AGENTS.md` 2. Architecture Rules, 8. TDD Policy

## 4. Dependencies

### Previous Tasks

- [x] Task 006. Sync Read Model And Tree Mapping
- [x] Task 007. Open Commands And Opener Port

### Next Tasks

- [x] Task 009. Copy Update With Sync Guard
- [x] Task 010. Analyzer Taxonomy Structure And Quality Rules

## 5. Architecture Notes

- [x] 변경 계층: Application detail use case/read model, Presentation detail renderer or quick pick/message mapper
- [x] 의존 방향: detail use case는 repository/target/analyzer ports에 의존하고 Presentation은 read model만 표시한다.
- [x] 도메인 책임: diagnostic severity/category value semantics 제공
- [x] 유스케이스 책임: source/applied detail DTO를 구성하고 missing/corrupt 상태를 typed diagnostics로 반환한다.
- [x] 인프라 책임: 필요한 file summary는 repository port가 제공하고 직접 filesystem 접근은 adapter에 둔다.
- [x] 외부 시스템 접근 위치: detail 조회의 file read는 Infrastructure repository adapter에서만 수행한다.

## 6. Functional Requirements

- [x] source detail은 name, description, source path id, skill md path id, risk level, diagnostics, applied targets, file summary를 포함한다.
- [x] applied detail은 target path id, apply mode, sync status, source link, diagnostics를 포함한다.
- [x] diagnostics grouping은 severity 우선, category 다음 순서로 group key와 count를 반환한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: detail command는 RuntimeContext와 tree item payload만 사용한다.
- [x] 로그 요구사항: detail 조회 성공은 Product Log를 남기지 않고 조회 실패만 failure event 후보로 처리한다.
- [x] 오류 처리: missing source, missing target, invalid metadata, stale analysis를 별도 diagnostic으로 표시한다.
- [x] 테스트 가능성: fake source repository, fake target store, fake analyzer metadata로 use case를 검증한다.
- [x] 유지보수성: detail renderer는 `SKILL.md` 본문 전체를 notification/log에 표시하지 않는다.

## 8. Implementation Steps

- [x] `GetSkillDetail` source DTO 실패 테스트를 작성한다.
- [x] `GetSkillDetail` applied DTO 실패 테스트를 작성한다.
- [x] diagnostics grouping mapper 실패 테스트를 작성한다.
- [x] detail use case와 read model type을 구현한다.
- [x] Presentation rendering mapper를 최소 구현한다.
- [x] missing/corrupt/stale diagnostic 결과를 추가한다.
- [x] `npm test`, `npm run build`를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 detail use case test를 먼저 작성한다.
- [x] use case input/output 테스트를 fake ports로 작성한다.
- [x] 외부 file summary dependency는 테스트 더블로 대체한다.
- [x] RuntimeContext 전달 방식 테스트를 작성한다.
- [x] detail failure event 후보에 full path와 body가 없는지 검증한다.
- [x] missing source/target/invalid metadata 오류 케이스를 테스트한다.
- [x] diagnostics mapper 정리는 기능 구현과 분리한다.

## 10. Validation Checklist

- [x] source/applied detail DTO가 명확히 구분된다.
- [x] Presentation이 domain policy를 재구현하지 않는다.
- [x] Domain 계층은 renderer 또는 VSCode API에 의존하지 않는다.
- [x] detail 조회 중 settings/env를 재조회하지 않는다.
- [x] RuntimeContext와 explicit item payload로만 조회한다.
- [x] 로그는 실패 event 후보만 최소 정보로 분리된다.
- [x] fake ports로 detail use case를 테스트할 수 있다.
- [x] 상태머신은 필요하지 않고 typed result/diagnostic으로 충분하다.
- [x] detail read model과 rendering mapper 변경이 리뷰 가능한 단위다.

## 11. Logging Requirements

### Product Log

- [x] detail 조회 성공은 Product Log를 기록하지 않는다.
- [x] detail 조회 실패는 error code와 masked item id만 Product Log 후보로 반환한다.

### Field Debug Log

- [x] invalid metadata와 stale analysis reason은 Field Debug Log 후보로 masked id와 category만 기록한다.
- [x] Field Debug Log는 기본 비활성이다.

### Development Log

- [x] diagnostics grouping fixture detail은 테스트에서만 Development Log로 사용할 수 있다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 불필요하다. detail 조회는 read-only flow다.
- [x] 상태 목록: `LoadingDetail`, `GroupingDiagnostics`, `Completed`
- [x] 이벤트 목록: `DetailRequested`, `DetailLoaded`, `DiagnosticsGrouped`, `FailureDetected`
- [x] 전이 조건: detail load 실패 시 grouping을 수행하지 않는다.
- [x] 실패 상태: `SourceMissing`, `TargetMissing`, `MetadataInvalid`, `ReadFailed`
- [x] 종료 상태: `Completed`
- [x] step result는 use case test로 검증한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Detail UX가 source/applied 상태와 diagnostics를 표시한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 010/011의 analyzer category 확장이 detail grouping에 자연스럽게 반영된다.