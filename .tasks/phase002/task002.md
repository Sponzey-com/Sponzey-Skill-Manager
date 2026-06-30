# Task 002. Main Repository Setup Wizard And Initialization

## 1. Summary

- [x] 목적: 사용자가 Main Repository를 안전하게 선택, 검증, 초기화하고 settings에 저장할 수 있는 setup flow를 만든다.
- [x] 해결 문제: Main Repository 설정과 source import가 혼동되고, risky path를 선택해 Global/Project Target과 충돌할 수 있는 위험을 줄인다.
- [x] 완료 상태: setup wizard가 directory 선택, 위험 경로 검증, 초기화 확인, settings write, RuntimeSession recomposition까지 명시적 단계로 수행한다.

## 2. Scope

### Included

- [x] Main Repository setup wizard input collection
- [x] repository path validation and initialization
- [x] `skills/`, `backups/`, `.sponzey/` directory creation

### Excluded

- [x] URL/path skill install flow 변경
- [x] sync status index 구현
- [x] backup catalog UI 구현

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 002 Main Repository setup wizard
- [x] `.tasks/plan.md` Phase 002 repository path validation and initialization
- [x] `.tasks/plan.md` 12. Dependency And Boundary Rules repository setup row
- [x] `AGENTS.md` 13.1 Main Repository vs Global Target, 13.6 Configuration Handling

## 4. Dependencies

### Previous Tasks

- [x] Task 001. RuntimeSession And Explicit Recomposition

### Next Tasks

- [x] Task 003. Repository Command UX And Smoke Baseline
- [x] Task 004. Repository Metadata Schema And Index Cache

## 5. Architecture Notes

- [x] 변경 계층: Presentation input collector, Application repository setup use case, Domain path policy, Infrastructure filesystem repository initializer
- [x] 의존 방향: Presentation은 input DTO만 만들고, path policy와 initialization decision은 Application/Domain에서 수행한다.
- [x] 도메인 책임: Main Repository와 Global/Project Target collision, home/workspace risky path rule을 판단한다.
- [x] 유스케이스 책임: validation result, initialization plan, settings write request, recomposition request output을 조합한다.
- [x] 인프라 책임: directory existence/writable check와 directory creation을 filesystem adapter 뒤에서 수행한다.
- [x] 외부 시스템 접근 위치: VSCode folder picker는 Presentation, filesystem write는 Infrastructure에서만 수행한다.

## 6. Functional Requirements

- [x] setup wizard는 folder selection, create-if-missing confirmation, initialize confirmation을 수집한다.
- [x] `~/.agents/skills`, `~/.claude/skills`, workspace root, home root, Global/Project Target overlap은 blocking 또는 strong warning diagnostic으로 반환한다.
- [x] repository initializer는 `skills/`, `backups/`, `.sponzey/`를 생성하고 existing valid repository는 destructive write 없이 통과시킨다.

## 7. Non-Functional Requirements

- [x] 설정 관리: repository path는 settings writer port를 통해 저장하고, 저장 후 Task 001의 explicit recomposition을 호출한다.
- [x] 로그 요구사항: setup 완료/실패는 Product Log, path validation detail은 Field Debug Log로 분리한다.
- [x] 오류 처리: selection cancel, path rejected, initialization failure, settings write failure, recomposition failure를 구분한다.
- [x] 테스트 가능성: folder picker, settings writer, filesystem initializer는 fake port로 대체한다.
- [x] 유지보수성: setup flow와 import source flow의 command name, input DTO, result code를 분리한다.

## 8. Implementation Steps

- [x] risky path validation 실패 테스트를 먼저 작성한다.
- [x] setup wizard가 folder selection과 confirmation을 input DTO로 변환하는 Presentation 테스트를 작성한다.
- [x] repository initializer가 temp directory에 필수 directory를 만드는 adapter 테스트를 작성한다.
- [x] setup use case가 settings writer를 호출하고 recomposition request를 반환하는 최소 구현을 작성한다.
- [x] existing valid repository와 missing directory case를 모두 처리한다.
- [x] source import command와 setup command naming이 섞이지 않도록 command descriptor를 정리한다.
- [x] `npm test`, `npm run build`, manifest check를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 path policy 테스트를 먼저 작성한다.
- [x] setup use case input/output 테스트를 작성한다.
- [x] filesystem initializer는 temp fixture로 검증한다.
- [x] settings writer와 RuntimeSession은 fake로 대체한다.
- [x] `repository.setup.completed`, `repository.setup.failed`, `repository.validation.detail` event 후보 테스트를 작성한다.
- [x] selection cancel, collision, write failure, recomposition failure 오류 케이스를 테스트한다.
- [x] 구현 후 중복된 repository path validation helper를 Tidy First 범위로 정리한다.

## 10. Validation Checklist

- [x] Main Repository setup flow가 source import flow와 UI에서 구분된다.
- [x] Main Repository가 Global/Project Target으로 오인되지 않는다.
- [x] Domain 계층은 filesystem 또는 VSCode picker에 의존하지 않는다.
- [x] settings 값은 setup use case 내부에서 재조회되지 않는다.
- [x] 외부 환경 값은 RuntimeContext와 explicit input으로만 전달된다.
- [x] Product Log에는 raw selected path가 기록되지 않는다.
- [x] fake filesystem과 fake settings writer로 테스트할 수 있다.
- [x] repository setup 상태 전이가 명시적 result code로 표현된다.
- [x] 기능 변경과 setup naming 정리가 분리되어 기록된다.

## 11. Logging Requirements

### Product Log

- [x] `repository.setup.completed`는 repository label, masked path id, result code만 기록한다.
- [x] `repository.setup.failed`는 failure code와 사용자에게 필요한 next action만 기록한다.

### Field Debug Log

- [x] `repository.validation.detail`은 path classification, collision type, writable check result를 masked path로 기록한다.
- [x] Field Debug Log는 기본 비활성이고 지원 목적 활성화 조건을 따른다.

### Development Log

- [x] temp fixture setup detail은 테스트에서만 Development Log로 사용할 수 있다.
- [x] Development Log는 packaged extension 기본 출력에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 필요하다. 사용자 입력, 검증, filesystem write, settings write, recomposition이 순차로 진행된다.
- [x] 상태 목록: `SelectingPath`, `ValidatingPath`, `ConfirmingInitialization`, `InitializingRepository`, `WritingSettings`, `RebuildingRuntime`, `Completed`
- [x] 이벤트 목록: `PathSelected`, `PathValidated`, `InitializationConfirmed`, `RepositoryInitialized`, `SettingsWritten`, `RuntimeRebuilt`
- [x] 전이 조건: risky path diagnostic이 blocking이면 initialization으로 이동하지 않는다.
- [x] 실패 상태: `SelectionCancelled`, `PathRejected`, `InitializationFailed`, `SettingsWriteFailed`, `RuntimeRebuildFailed`
- [x] 종료 상태: `Completed`
- [x] 상태 전이는 use case test에서 fake ports로 검증한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Repository safety gate를 통과한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 004가 repository metadata/index 작업을 이어받을 수 있도록 directory contract가 문서화되었다.
