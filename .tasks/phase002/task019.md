# Task 019. Logger Ports Adapters And Masking

## 1. Summary

- [x] 목적: Product Log, Field Debug Log, Development Log를 실제 logger port와 adapter로 분리하고 민감 정보 마스킹을 적용한다.
- [x] 해결 문제: logger singleton이나 ad hoc console 출력이 생기면 Domain/Application 경계가 오염되고 full path, secret, skill body가 노출될 수 있다.
- [x] 완료 상태: logger ports가 composition으로 주입되고, Product/Field/Development adapter가 logging policy에 따라 동작하며 masking tests가 통과한다.

## 2. Scope

### Included

- [x] `LoggerPort` and log event DTO
- [x] Product, Field Debug, Development logger adapters
- [x] path/secret masking utility

### Excluded

- [x] transfer audit persistent store
- [x] watcher event logging
- [x] external telemetry or remote log upload

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 010 logger port, product/field/development logger adapter, masking utility
- [x] `.tasks/plan.md` 10. Logging Strategy
- [x] `.tasks/plan.md` 12.2 `LoggerPort`, `DevelopmentLogPort`
- [x] `AGENTS.md` 6. Logging Policy, 11. Prohibited Patterns

## 4. Dependencies

### Previous Tasks

- [x] Task 011. Analyzer Security Dependency Compatibility Rules
- [x] Task 018. Global Custom Targets And Compatibility UX

### Next Tasks

- [x] Task 020. Transfer Audit Trail And Event Wiring
- [x] Task 021. Watchers Debounce And Stale Analysis

## 5. Architecture Notes

- [x] 변경 계층: Application log event DTO/port, Infrastructure logger adapters, Presentation command wrapper wiring
- [x] 의존 방향: Domain은 logger를 알지 않고, Application은 event DTO를 반환하거나 logger port에 추상 event만 전달한다.
- [x] 도메인 책임: 필요한 경우 event name value semantics만 제공하고 logger implementation에는 의존하지 않는다.
- [x] 유스케이스 책임: user-impact event 후보를 output에 포함한다.
- [x] 인프라 책임: actual output/persistence, masking, log level filtering
- [x] 외부 시스템 접근 위치: console/output channel/file write는 Infrastructure logger adapter에서만 수행한다.

## 6. Functional Requirements

- [x] Product Log adapter는 user-impact completion/failure event만 최소 정보로 기록한다.
- [x] Field Debug Log adapter는 RuntimeContext logging policy가 enabled일 때만 transition/detail event를 기록한다.
- [x] Development Log adapter는 test/development mode에서만 활성화되고 production default에서는 no-op이다.

## 7. Non-Functional Requirements

- [x] 설정 관리: logging mode는 activation/recomposition에서 1회 수신해 RuntimeContext로 전달한다.
- [x] 로그 요구사항: full home path, workspace path, repository path, secret-like value, `SKILL.md` body를 masking 또는 제외한다.
- [x] 오류 처리: logger adapter failure가 primary use case result를 덮어쓰지 않도록 best-effort 또는 typed secondary diagnostic으로 처리한다.
- [x] 테스트 가능성: fake sink와 fake RuntimeContext logging policy로 adapter 동작을 검증한다.
- [x] 유지보수성: logger는 singleton이 아니라 composition dependency로 주입한다.

## 8. Implementation Steps

- [x] Product Log에 full home path가 포함되지 않는 실패 테스트를 작성한다.
- [x] fake secret value가 log output에서 masking되는 실패 테스트를 작성한다.
- [x] Field Debug Log disabled 상태에서 detail event가 기록되지 않는 실패 테스트를 작성한다.
- [x] Development Log production mode no-op 실패 테스트를 작성한다.
- [x] LoggerPort/Event DTO와 masking utility를 구현한다.
- [x] command wrapper 또는 composition boundary에서 logger adapters를 주입한다.
- [x] `npm test`, `npm run build`, architecture guard를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 masking test를 먼저 작성한다.
- [x] logger adapter use case/wrapper test를 fake sink로 작성한다.
- [x] output channel/file sink dependency는 테스트 더블로 대체한다.
- [x] logging mode가 RuntimeContext에서 전달되는지 테스트한다.
- [x] Product/Field/Development event classification test를 작성한다.
- [x] adapter failure, disabled debug, production development no-op 오류 케이스를 테스트한다.
- [x] log event DTO naming 정리는 adapter 기능 구현과 분리한다.

## 10. Validation Checklist

- [x] logger implementation이 Domain에 들어가지 않는다.
- [x] logger singleton 또는 hidden global access를 사용하지 않는다.
- [x] Domain 계층은 output channel, console, file logger에 의존하지 않는다.
- [x] logging mode는 runtime 중간에 env/settings에서 재조회되지 않는다.
- [x] RuntimeContext와 dependency injection으로 logger가 전달된다.
- [x] 로그가 Product, Field Debug, Development 기준에 맞게 분리된다.
- [x] fake sink로 외부 의존성을 대체할 수 있다.
- [x] logger 자체는 상태머신을 갖지 않고 state machine terminal/failure event를 수신한다.
- [x] 기능 변경과 masking utility 정리가 분리된다.

## 11. Logging Requirements

### Product Log

- [x] user-impact completed/failed/blocked event만 기록한다.
- [x] Product Log에는 full path, stack trace full dump, secret, skill body, test fixture detail을 포함하지 않는다.

### Field Debug Log

- [x] Field Debug Log는 explicit enabled policy와 제한 범위가 있을 때만 기록한다.
- [x] transition, validation, hash/detail event는 masked id와 category 중심으로 기록한다.

### Development Log

- [x] Development Log는 tests/local script에서만 활성화한다.
- [x] packaged extension production default에서는 no-op 또는 제외된다.

## 12. State Machine Requirements

- [x] 상태머신 필요: logger 자체에는 불필요하다.
- [x] 상태 목록: 해당 없음
- [x] 이벤트 목록: Product/Field/Development log event DTO 종류만 정의한다.
- [x] 전이 조건: 상태머신 terminal/failure event를 logger adapter가 수신할 수 있어야 한다.
- [x] 실패 상태: `LogSinkFailed`는 primary operation failure로 승격하지 않는다.
- [x] 종료 상태: `LogWritten`, `LogSkipped`
- [x] log write/skip result는 adapter test로 검증한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Logger port gate를 통과한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 020과 Task 021이 logger port를 통해 audit/watcher events를 연결할 수 있다.