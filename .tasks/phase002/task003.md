# Task 003. Repository Command UX And Smoke Baseline

## 1. Summary

- [x] 목적: repository command 결과 표시, view title button 의미, Extension Host smoke baseline을 정리해 Phase 002의 사용자 확인 흐름을 닫는다.
- [x] 해결 문제: command 결과가 diagnostic/result/next action을 충분히 보여주지 못하거나, repository 관련 버튼이 source import와 setup 의미를 혼동시킬 수 있다.
- [x] 완료 상태: Main Repository view title action과 command palette entry가 명확하고, 수동 smoke 절차가 Task 001/002 결과를 검증한다.

## 2. Scope

### Included

- [x] command result renderer의 diagnostic message, result code, recommended next action 표시
- [x] Main Repository view title action label/icon/title/menu contribution 정리
- [x] Extension Development Host smoke checklist 초안 작성

### Excluded

- [x] release gate 자동화
- [x] README 전체 문서화
- [x] skill detail/open/edit UX

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 002 result rendering clarity
- [x] `.tasks/plan.md` Phase 002 view title action usability
- [x] `.tasks/plan.md` Phase 012 Extension Host smoke automation의 선행 baseline
- [x] `AGENTS.md` 10. Code Review Checklist, 12. Required Agent Behavior

## 4. Dependencies

### Previous Tasks

- [x] Task 001. RuntimeSession And Explicit Recomposition
- [x] Task 002. Main Repository Setup Wizard And Initialization

### Next Tasks

- [x] Task 004. Repository Metadata Schema And Index Cache

## 5. Architecture Notes

- [x] 변경 계층: Presentation result renderer, presentation command descriptors, package manifest contribution, scripts/docs smoke checklist
- [x] 의존 방향: renderer는 Application result DTO만 받아 표시하고 domain policy를 재판단하지 않는다.
- [x] 도메인 책임: 없음. UI wording과 command contribution 정리 중심이다.
- [x] 유스케이스 책임: result code, diagnostics, recommended next action을 output DTO로 제공한다.
- [x] 인프라 책임: 없음. smoke script가 필요하면 scripts 계층에만 둔다.
- [x] 외부 시스템 접근 위치: Extension Host 실행은 `scripts/run-vscode-extension-host.sh`와 수동 체크리스트에서만 다룬다.

## 6. Functional Requirements

- [x] command result renderer는 success/warning/failure/cancelled를 구분하고 diagnostic summary와 next action을 표시한다.
- [x] Main Repository view title button은 set repository, remove repository, import, install 의미를 title과 icon에서 구분한다.
- [x] smoke checklist는 setup, recomposition, invalid repository recovery, tree refresh를 순서대로 검증한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: renderer와 manifest contribution은 settings를 읽지 않는다.
- [x] 로그 요구사항: UI notification은 Product Log가 아니며, 필요한 log event는 use case result event와 분리한다.
- [x] 오류 처리: cancelled result는 error notification을 표시하지 않는다.
- [x] 테스트 가능성: renderer는 fake window/message API로 테스트한다.
- [x] 유지보수성: package manifest command contribution과 command descriptor drift를 테스트로 막는다.

## 8. Implementation Steps

- [x] renderer가 recommended next action을 표시한다는 실패 테스트를 작성한다.
- [x] cancelled result가 notification을 표시하지 않는 회귀 테스트를 작성한다.
- [x] view title button contribution이 command descriptor와 일치하는 manifest 테스트를 작성한다.
- [x] renderer 최소 구현을 작성하고 기존 success/warning/failure 테스트를 유지한다.
- [x] smoke checklist 문서를 `.tasks/` 또는 계획에서 지정한 위치에 작성한다.
- [x] command title/icon wording을 source import와 repository setup이 혼동되지 않게 정리한다.
- [x] `npm test`, `npm run build`, `scripts/run-vscode-extension-host.sh` 사용 가능 여부를 확인한다.

## 9. TDD Checklist

- [x] 실패하는 renderer test를 먼저 작성한다.
- [x] use case result DTO rendering test를 작성한다.
- [x] VSCode window API는 fake로 대체한다.
- [x] 설정 값 전달 테스트는 불필요하지만 settings를 읽지 않는 import boundary를 architecture guard로 확인한다.
- [x] 로그 정책은 UI notification과 Product Log event가 섞이지 않는지 테스트 또는 리뷰 항목으로 확인한다.
- [x] cancelled, warning, failure 오류 표시 케이스를 테스트한다.
- [x] manifest/descriptor 정리는 behavior-preserving Tidy First로 분리한다.

## 10. Validation Checklist

- [x] command result가 result code, diagnostic summary, recommended next action을 포함한다.
- [x] View title button의 의미가 중복되거나 모호하지 않다.
- [x] Domain 계층에 UI label/icon 의존성이 없다.
- [x] renderer가 런타임 중 settings/env를 재조회하지 않는다.
- [x] 외부 환경 값은 필요하지 않으며 smoke 실행 경로는 script argument로만 다룬다.
- [x] 로그와 notification 역할이 구분된다.
- [x] fake VSCode window로 renderer 테스트가 가능하다.
- [x] 상태 전이가 필요한 flow는 Task 001/002의 상태머신에 위임한다.
- [x] 기능 변경과 manifest naming 정리가 분리되어 리뷰 가능하다.

## 11. Logging Requirements

### Product Log

- [x] renderer 자체는 Product Log를 기록하지 않는다.
- [x] Product Log event는 use case result event에서만 전달된다.

### Field Debug Log

- [x] renderer는 Field Debug Log를 기록하지 않는다.
- [x] smoke checklist failure detail은 사용자가 수동으로 확인하는 개발 절차로 남긴다.

### Development Log

- [x] smoke checklist와 local script output은 Development Log로 분류한다.
- [x] Development Log는 Extension packaging 기본 동작에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 불필요하다. 이 태스크는 rendering과 manifest/checklist 정리다.
- [x] 상태 목록: 별도 상태 없음
- [x] 이벤트 목록: result rendering input 종류만 test case로 구분한다.
- [x] 전이 조건: 해당 없음
- [x] 실패 상태: renderer failure는 test failure로 처리한다.
- [x] 종료 상태: command result rendered 또는 cancelled ignored
- [x] 상태 전이가 필요한 repository setup/recomposition은 Task 001/002 테스트를 참조한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Runtime recomposition gate와 repository safety gate의 수동 smoke 항목이 문서화되었다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 004가 metadata/index 작업을 시작해도 command UX baseline이 깨지지 않도록 manifest/descriptor 테스트가 존재한다.
