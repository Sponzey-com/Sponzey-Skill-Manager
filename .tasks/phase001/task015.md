# Task 015. Argument Driven Command Handler Composition

## 1. Task Purpose

- [x] 이 태스크의 목적은 VSCode command handler가 Application use case를 호출할 수 있는 argument-driven composition 계층을 구현하는 것이다.
- [x] 이 태스크는 command registry와 application use case 사이의 Presentation boundary를 다룬다.
- [x] 이 태스크 완료 후 command handler는 VSCode prompt 없이 테스트 arguments로 use case를 호출할 수 있어야 한다.

## 2. Current Context

- [x] Task 014에서 command contribution metadata와 command registry를 완료했다.
- [x] 이번 태스크를 시작해야 하는 이유는 command가 placeholder handler에 머물러 있어 실제 MVP 유스케이스를 실행할 수 없기 때문이다.

## 3. Scope

### Included

- [x] `createUseCaseCommandHandlers({ getContext, useCases })`를 구현한다.
- [x] refresh/create/import/apply/remove/transfer command id를 use case 호출로 연결한다.
- [x] handler는 command arguments를 input DTO로 전달한다.
- [x] handler는 settings/environment를 직접 읽지 않고 `getContext`로 주입받는다.

### Excluded

- [x] VSCode input prompt를 구현하지 않는다.
- [x] Tree view provider를 구현하지 않는다.
- [x] 실제 filesystem dependency composition을 구현하지 않는다.
- [x] UI message rendering을 구현하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] context-aware command handler factory를 구현한다.
- [x] 성공 조건은 command handler가 `getContext`를 호출하고 use case에 context를 전달하는 것이다.

### Functional Unit 2

- [x] command arguments를 use case input으로 전달한다.
- [x] 성공 조건은 create/import/apply/remove/transfer command가 args를 변형 없이 input DTO로 전달하는 것이다.

### Functional Unit 3

- [x] missing use case를 typed result로 반환한다.
- [x] 성공 조건은 handler가 throw 대신 `command-handler-not-wired` result를 반환하는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `presentation`이다.
- [x] Presentation은 Application 유스케이스 함수를 dependency로 받는다.
- [x] Presentation은 filesystem adapter를 import하지 않는다.
- [x] Domain/Application에는 VSCode API import를 추가하지 않는다.

## 6. Configuration Rules

- [x] handler는 settings reader, environment, config file을 조회하지 않는다.
- [x] context는 `getContext` dependency로만 받는다.
- [x] command 실행 중 context를 전역 변수에서 조회하지 않는다.

## 7. Logging Requirements

- [x] 실제 로그 출력은 하지 않는다.
- [x] use case result의 events를 그대로 반환한다.
- [x] command handler 내부에서 debug print를 남기지 않는다.

## 8. State Machine Requirements

- [x] command handler는 상태머신을 갖지 않는다.
- [x] use case의 `steps` result를 그대로 반환한다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] refresh command가 context와 args를 use case로 전달하는지 검증한다.
- [x] create command가 args를 input DTO로 전달하는지 검증한다.
- [x] missing use case command가 typed result를 반환하는지 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 작성한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현을 작성한다.
- [x] Presentation이 filesystem adapter를 import하지 않는지 확인한다.
- [x] 모든 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 테스트 더블로 외부 의존성을 대체할 수 있다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.

## 12. Completion Report

- [x] 수행한 변경 사항을 요약한다.
  - `createUseCaseCommandHandlers`를 추가했다.
  - command id와 application use case 이름의 mapping을 정의했다.
  - command handler가 `getContext` dependency를 통해 context를 받고 `{ context, input }` 형태로 use case를 호출하도록 했다.
  - missing use case는 throw 대신 `command-handler-not-wired` typed result를 반환하도록 했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 수정: `src/presentation/command-registry.js`
  - 수정: `src/presentation/index.js`
  - 수정: `test/presentation/command-registry.test.mjs`
  - 수정: `.tasks/task015.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 65 tests / 65 pass
  - `npm run check:architecture`: 통과, 16 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - refresh command handler가 `getContext`를 호출하고 use case에 context와 args를 전달하는지 확인했다.
  - create command handler가 args를 input DTO로 전달하는지 확인했다.
  - missing use case가 typed result로 반환되는지 확인했다.
  - Presentation이 filesystem adapter를 import하지 않는지 확인했다.
  - command handler 내부에서 settings/environment를 조회하지 않는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - 실제 VSCode input prompt와 result rendering은 아직 없다.
  - command handler dependency composition은 아직 extension activation에 연결되지 않았다.
  - tree view provider와 views contribution은 아직 없다.
  - set/open main repository command의 실제 동작은 아직 wired use case가 없다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 read model을 tree view item DTO로 변환하는 presentation mapper와 views contribution을 구현해야 한다.
  - tree view provider는 domain/application entity를 직접 수정하지 않고 read model만 표시해야 한다.
  - VSCode TreeItem 실제 생성은 후속 integration에서 처리하고, 우선 plain DTO로 테스트한다.

## 13. Next Task Decision Hook

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.
  - 아직 도달하지 못했다. Tree view, dependency composition, prompt/rendering, integration smoke가 남아 있다.
- [x] 도달하지 못했다면 다음 태스크를 `task016.md`로 생성한다.

## 14. Stop Conditions

- [x] `plan.md`의 최종 목표에 도달했다.
- [x] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.
