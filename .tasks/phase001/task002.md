# Task 002. RuntimeContext And Configuration Boundary

## 1. Task Purpose

- [x] 이 태스크의 목적은 외부 설정과 환경 값을 시작 시 1회만 수신하고 이후 명시적으로 전달하는 RuntimeContext 경계를 만드는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 1 목표인 `RuntimeContext`, settings reader port, settings validation, path collision policy 구현에 기여한다.
- [x] 이 태스크 완료 후 프로젝트는 설정을 전역 singleton이나 숨겨진 조회로 사용하지 않고, immutable RuntimeContext로 전달할 수 있어야 한다.

## 2. Current Context

- [x] Task 001에서 dependency-free ESM scaffold, architecture guard, smoke tests를 완료했다.
- [x] 현재 제품 기능은 없고, domain/application/infrastructure/presentation entrypoint만 있다.
- [x] 이번 태스크를 시작해야 하는 이유는 모든 후속 유스케이스가 main repository path, target path, apply mode, logging mode를 안전하게 전달받아야 하기 때문이다.
- [x] 현재 확인된 제약 사항은 외부 dependency 설치 없이 Node.js 기본 test runner로 검증해야 한다는 점이다.

## 3. Scope

### Included

- [x] `RuntimeContext` immutable model을 만든다.
- [x] settings reader port 형태와 fake settings reader test helper를 만든다.
- [x] `RuntimeContextBuilder`를 만들고 main repository/global target collision validation을 구현한다.

### Excluded

- [x] VSCode settings adapter를 구현하지 않는다.
- [x] 실제 command activation wiring을 구현하지 않는다.
- [x] logging adapter와 Product Log 출력을 구현하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] RuntimeContext model을 구현한다.
- [x] 입력은 normalized settings DTO다.
- [x] 출력은 frozen RuntimeContext object다.
- [x] 성공 조건은 context가 immutable하고 expected fields를 가진다.
- [x] 실패 조건은 필수 path 또는 apply mode가 유효하지 않은데 context가 생성되는 것이다.

### Functional Unit 2

- [x] RuntimeContextBuilder를 구현한다.
- [x] 입력은 settings reader port와 workspace root 목록이다.
- [x] 출력은 `{ context, diagnostics }` build result다.
- [x] 성공 조건은 settings reader가 build 중 정확히 1회 호출되는 것이다.
- [x] 실패 조건은 builder 또는 use case가 settings를 숨겨진 방식으로 다시 읽는 것이다.

### Functional Unit 3

- [x] repository/target path collision validation을 구현한다.
- [x] 입력은 main repository path와 global/project target path 목록이다.
- [x] 출력은 machine-readable diagnostic이다.
- [x] 성공 조건은 main repository가 global target과 같거나 target 하위/상위 충돌일 때 diagnostic이 생성되는 것이다.
- [x] 실패 조건은 unsafe path relation이 diagnostic 없이 통과하는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `application/config`, `application/ports`, `domain/model`이다.
- [x] Domain은 설정을 읽지 않고, RuntimeContext value만 표현한다.
- [x] Application은 settings reader port를 통해 시작 시 1회 값을 수신한다.
- [x] Infrastructure settings adapter는 이번 태스크에서 구현하지 않는다.
- [x] 필요한 인터페이스는 JavaScript port contract로 표현하고 tests에서 fake reader로 검증한다.
- [x] 전역 상태, 숨겨진 I/O, 암묵적 설정 접근을 피한다.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 환경 값은 RuntimeContextBuilder 실행 시 최초 1회만 수신한다.
- [x] 최초 수신 이후에는 환경 값을 전역 상수처럼 사용하지 않는다.
- [x] 환경 값은 RuntimeContext object와 명시적 인자로 전달한다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지한다.

## 7. Logging Requirements

### Product Log

- [x] Product Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] context validation 실패는 `runtime.context.validation.failed` event contract로 변환 가능한 diagnostic code를 생성한다.
- [x] 민감 정보와 과도한 내부 상태를 diagnostic message에 기록하지 않는다.

### Field Debug Log

- [x] Field Debug Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] validation detail은 `config.validation.detail` event contract로 변환 가능한 diagnostic code를 생성한다.
- [x] path 값은 diagnostic에서 원문 전체를 노출하지 않고 code와 relation 중심으로 기록한다.
- [x] 보존 범위와 사용 범위는 후속 Logging Infrastructure 태스크에서 구현한다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 만들지 않는다.
- [x] 테스트 완료 후 임시 debug 코드를 남기지 않는다.

## 8. State Machine Requirements

- [x] 상태머신은 이번 태스크에서 필수는 아니다.
- [x] validation 흐름이 3단계를 넘지 않으므로 명시 함수와 typed result로 관리한다.
- [x] 상태 목록은 만들지 않는다.
- [x] 이벤트 목록은 만들지 않는다.
- [x] 전이 조건은 만들지 않는다.
- [x] 실패 상태는 diagnostic code로 표현한다.
- [x] 상태 전이 테스트는 작성하지 않는다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상 유스케이스는 `buildRuntimeContext`다.
- [x] 정상 케이스 테스트는 valid settings가 frozen RuntimeContext를 생성하는지 검증한다.
- [x] 실패 케이스 테스트는 invalid apply mode와 repository/target collision diagnostic을 검증한다.
- [x] 경계값 테스트는 settings reader가 정확히 1회 호출되는지 검증한다.
- [x] 외부 의존성은 fake settings reader로 대체한다.
- [x] 설정 값 전달 방식 테스트를 작성한다.
- [x] 로그 정책 검증은 diagnostic code가 log event contract로 변환 가능함을 검증한다.
- [x] 상태 전이가 없으므로 상태 전이 테스트는 작성하지 않는다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 작성한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현을 작성한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] 필요한 로그를 정책에 맞게 추가한다.
- [x] 상태 관리가 필요한 경우 명시적 상태 전이로 구현한다.
- [x] 중복과 구조 문제를 정리한다.
- [x] 모든 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 도메인 계층이 외부 프레임워크에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 환경 값이 전역 상수처럼 사용되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 플래그 조합이 아니라 명시적 상태로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.

  - `RuntimeContext` build flow를 추가했다.
  - settings reader port 형태를 duck-typed contract로 사용하고, builder가 settings를 정확히 1회만 읽도록 구현했다.
  - 명시 settings에서 context를 만드는 `createRuntimeContext`를 추가했다.
  - invalid apply mode와 main repository/target path overlap diagnostic을 추가했다.
  - context object를 deep freeze하여 런타임 중간 mutation을 막았다.
- [x] 생성하거나 수정한 파일을 기록한다.

  - `src/application/config/runtime-context-builder.js`
  - `src/application/index.js`
  - `test/application/runtime-context-builder.test.mjs`
- [x] 실행한 테스트 명령과 결과를 기록한다.

  - `npm test`: 최초 실행에서 runtime-context module missing 실패를 확인했다. 구현 후 10개 테스트 모두 통과했다.
  - `npm run build`: 통과했다. `architecture ok`, `build smoke ok`.
  - `npm run check:architecture`: 통과했다. 6개 source file 검사.
- [x] 검증한 항목을 기록한다.

  - settings reader는 build 중 정확히 1회 호출된다.
  - valid settings는 frozen RuntimeContext를 생성한다.
  - explicit settings path는 settings reader 없이 context를 생성한다.
  - invalid default apply mode는 `invalid-default-apply-mode` diagnostic을 반환한다.
  - main repository와 global/project target overlap은 `main-repository-overlaps-target` diagnostic을 반환한다.
  - Application 계층은 VSCode API와 filesystem에 의존하지 않는다.
- [x] 남은 위험 요소를 기록한다.

  - path normalization은 dependency-free 문자열 기반 구현이다. 이후 실제 filesystem adapter 도입 시 platform-specific path 검증을 보강해야 한다.
  - RuntimeContext schema는 MVP 최소 필드만 검증한다. 누락 필드와 client type validation은 후속 domain/model 태스크에서 강화한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.

  - 다음 태스크는 Phase 2의 core domain value objects, entities, policy decisions를 구현해야 한다.
  - RuntimeContext의 path overlap diagnostic을 domain policy로 일반화할지 결정해야 한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.

  - 도달하지 않았다. Phase 0과 Phase 1 일부만 완료했다.
- [x] 도달했다면 추가 태스크를 생성하지 않는다.

  - 해당 없음. MVP 최종 목표에 도달하지 않았다.
- [x] 도달하지 못했다면 남은 목표를 정리한다.

  - Domain model/policies, analyzer, filesystem adapters, read models, apply/remove/transfer, logging, presentation, watchers가 남아 있다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다.

  - Phase 2 `Domain Model, Policies, And Decisions`가 다음 작업이다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다.

  - task003은 value objects/entities, policy decision type, core policies 3개 단위로 제한한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.

  - task003에는 source/target separation, remove source deletion reject, backup target mutation reject, critical risk block 테스트를 포함한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.

  - Domain은 외부 framework와 filesystem에 의존하지 않도록 architecture guard로 검증한다.
- [x] 다음 태스크 파일명을 결정한다.

  - `.tasks/task003.md`
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.

  - `.tasks/task003.md`를 생성한다.
- [x] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작한다.

  - task003 생성 후 실패 테스트부터 실행한다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [x] `plan.md`의 최종 목표에 도달했다.
- [x] 필수 요구사항이 불명확하여 더 이상 안전하게 진행할 수 없다.
- [x] 외부 정보, 권한, 비밀값, 접근 권한이 없어 진행할 수 없다.
- [x] `AGENTS.md` 원칙과 충돌하는 요구사항이 발견되었다.
- [x] 테스트 또는 검증 환경이 없어 완료 여부를 판단할 수 없다.
- [x] 코드베이스 구조가 계획과 크게 달라 태스크 재설계가 필요하다.
- [x] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.