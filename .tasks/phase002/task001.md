# Task 001. RuntimeSession And Explicit Recomposition

## 1. Summary

- [x] 목적: settings 변경 후 Extension Host reload 없이 새 RuntimeContext와 command/tree wiring을 사용하도록 `RuntimeSession` 또는 동등한 extension boundary를 도입한다.
- [x] 해결 문제: 현재 composition이 activation 시점 context에 묶여 stale repository/target path를 계속 사용할 수 있는 위험을 제거한다.
- [x] 완료 상태: settings writer command 성공 후 explicit recomposition이 실행되고, 기존 RuntimeContext는 mutate되지 않으며, tree provider가 새 read model loader를 사용한다.

## 2. Scope

### Included

- [x] `RuntimeSession.recompose()` 또는 동등 API 설계와 구현
- [x] settings writer command after-action recomposition 연결
- [x] old composition dispose 또는 replacement contract 정의

### Excluded

- [x] Main Repository setup wizard UI 구현
- [x] watcher lifecycle 구현
- [x] sync status, analyzer, backup 기능 변경

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 002 Runtime Session Controller
- [x] `.tasks/plan.md` 9. Configuration And Runtime Environment Policy
- [x] `.tasks/plan.md` 7.1 Runtime recomposition gate
- [x] `AGENTS.md` 4. Configuration Policy, 5. Runtime Environment Handling, 8. TDD Policy

## 4. Dependencies

### Previous Tasks

- [x] None

### Next Tasks

- [x] Task 002. Main Repository Setup Wizard And Initialization
- [x] Task 003. Repository Command UX And Smoke Baseline

## 5. Architecture Notes

- [x] 변경 계층: Presentation/Extension boundary, Application composition wiring, existing RuntimeContext builder
- [x] 의존 방향: Presentation -> Application -> Domain을 유지하고 Infrastructure settings reader는 composition boundary에서만 호출한다.
- [x] 도메인 책임: RuntimeContext value validation과 repository/target collision policy는 기존 도메인 정책을 사용한다.
- [x] 유스케이스 책임: settings 변경 use case는 settings write result만 반환하고 runtime rebuild를 직접 수행하지 않는다.
- [x] 어댑터 책임: VSCode settings reader/workspace reader는 activation 또는 `recompose()`에서만 호출된다.
- [x] 필요한 포트: 기존 `SettingsReader`, `WorkspaceReader`, settings writer port를 재사용하고 hidden singleton을 추가하지 않는다.

## 6. Functional Requirements

- [x] `RuntimeSession.recompose()`는 settings reader와 workspace reader를 각각 명시적 경계에서 1회 호출한다.
- [x] settings writer command가 성공하면 command wrapper가 `recompose()`를 호출하고 refresh 가능한 tree provider를 새 read model로 갱신한다.
- [x] recomposition 실패 시 settings write 성공과 runtime rebuild 실패를 별도 result code와 diagnostic으로 표시한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: activation 또는 explicit recomposition 외부에서 settings/env/workspace roots를 재조회하지 않는다.
- [x] 로그 요구사항: recomposition completed/failed는 Product Log event 후보로 반환하고 step detail은 Field Debug Log 후보로 분리한다.
- [x] 오류 처리: invalid context에서도 repository recovery command는 실행 가능한 command set으로 남는다.
- [x] 테스트 가능성: fake settings reader, fake workspace reader, fake tree provider로 recomposition 동작을 검증한다.
- [x] 유지보수성: global mutable RuntimeContext, hidden service locator, direct VSCode API access를 추가하지 않는다.

## 8. Implementation Steps

- [x] `RuntimeSession.recompose()`가 settings reader를 1회 호출한다는 실패 테스트를 먼저 작성한다.
- [x] settings command 성공 후 recomposition이 호출된다는 command wrapper 실패 테스트를 작성한다.
- [x] old RuntimeContext가 mutate되지 않는 테스트를 작성한다.
- [x] 최소 구현으로 session이 composition object를 교체하고 tree provider read model loader를 갱신하게 한다.
- [x] recomposition failure output을 typed result로 변환한다.
- [x] 중복된 activation/composition wiring을 behavior-preserving 방식으로 정리한다.
- [x] `npm test`, `npm run build`, architecture guard를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 unit 또는 integration test를 먼저 작성한다.
- [x] `RuntimeSession` use case boundary 또는 extension boundary 테스트를 작성한다.
- [x] settings/workspace reader와 tree provider는 테스트 더블로 대체한다.
- [x] RuntimeContext 전달 방식과 immutable 보존 테스트를 작성한다.
- [x] `runtime.recompose.completed`, `runtime.recompose.failed`, `runtime.recompose.step` event 후보 검증을 작성한다.
- [x] settings write success + recomposition failure 오류 케이스를 테스트한다.
- [x] 구조 정리 후 전체 테스트가 통과하는지 확인한다.

## 10. Validation Checklist

- [x] settings 변경 후 command와 tree가 새 RuntimeContext를 사용한다.
- [x] RuntimeContext는 런타임 중간에 mutate되지 않는다.
- [x] Domain 계층은 VSCode API, filesystem, network, environment에 의존하지 않는다.
- [x] settings/env/workspace roots는 activation 또는 explicit recomposition에서만 수신된다.
- [x] 외부 환경 값은 RuntimeContext 또는 생성자/함수 인자로 전달된다.
- [x] 로그 event 후보가 3단계 정책에 맞게 분리된다.
- [x] settings reader와 workspace reader를 fake로 대체할 수 있다.
- [x] recomposition 상태 전이가 명시적으로 테스트된다.
- [x] Tidy First 정리와 기능 변경이 commit 또는 task 기록에서 분리된다.

## 11. Logging Requirements

### Product Log

- [x] `runtime.recompose.completed`는 새 context가 성공적으로 wired 되었을 때 operation id와 summary만 기록한다.
- [x] `runtime.recompose.failed`는 실패 code와 사용자 영향 범위만 기록하고 full path와 stack trace를 제외한다.

### Field Debug Log

- [x] `runtime.recompose.step`은 `ReadingSettings`, `BuildingRuntimeContext`, `RewiringHandlers`, `RefreshingTree` 단계 전이를 기록한다.
- [x] Field Debug Log는 명시적으로 활성화된 경우에만 기록하며 path는 masking한다.

### Development Log

- [x] fake settings reader call count와 fake tree provider refresh count는 test harness에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 필요하다. settings 수신, context build, handler rewire, tree refresh, failure 분기가 있다.
- [x] 상태 목록: `ReadingSettings`, `BuildingRuntimeContext`, `RewiringHandlers`, `RefreshingTree`, `Completed`
- [x] 이벤트 목록: `RecomposeRequested`, `SettingsRead`, `ContextBuilt`, `HandlersRewired`, `TreeRefreshed`, `FailureDetected`
- [x] 전이 조건: 각 단계 성공 output이 있어야 다음 단계로 이동한다.
- [x] 실패 상태: `SettingsReadFailed`, `ContextInvalid`, `HandlerRewireFailed`, `TreeRefreshFailed`
- [x] 종료 상태: `Completed`
- [x] 상태 전이는 fake ports로 테스트 가능해야 한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Runtime recomposition gate를 통과한다.
- [x] `AGENTS.md`의 설정 관리, 의존 방향, TDD 원칙과 충돌하지 않는다.
- [x] Task 002와 Task 003이 새 RuntimeSession API를 이어받을 수 있도록 public contract가 문서화되었다.
