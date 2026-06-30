# Task 001. Project Bootstrap And Architecture Guard

## 1. Task Purpose

- [x] 이 태스크의 목적은 MVP 개발을 시작할 수 있는 최소 프로젝트 구조와 테스트 실행 기반을 만드는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 0, 즉 project scaffold, layer directory, import boundary test, fixture policy 목표에 기여한다.
- [x] 이 태스크 완료 후 프로젝트에는 `src/`, `test/`, `scripts/`, `package.json`이 존재하고, 테스트와 빌드 검증 명령이 실행 가능해야 한다.

## 2. Current Context

- [x] 현재 코드베이스는 문서 중심 상태이며 제품 코드가 없다.
- [x] 이전 태스크는 없다.
- [x] 이번 태스크를 시작해야 하는 이유는 이후 RuntimeContext, domain policy, analyzer 작업을 안전하게 올릴 계층 구조와 테스트 루프가 필요하기 때문이다.
- [x] 현재 확인된 제약 사항은 로컬에 `tsc`가 설치되어 있지 않다는 점이다. 이 태스크는 외부 dependency 설치 없이 Node.js 기본 test runner와 ESM 모듈로 검증 가능한 scaffold를 만든다.

## 3. Scope

### Included

- [x] `package.json`과 기본 npm script를 만든다.
- [x] `src/domain`, `src/application`, `src/infrastructure`, `src/presentation` 계층 디렉터리와 최소 entrypoint를 만든다.
- [x] import boundary guard와 smoke test를 만든다.

### Excluded

- [x] VSCode Extension UI를 구현하지 않는다.
- [x] RuntimeContext와 설정 정책을 구현하지 않는다.
- [x] 실제 스킬 관리 기능, 파일시스템 adapter, analyzer를 구현하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] npm 기반 실행 scaffold를 만든다.
- [x] 입력은 `npm test`, `npm run build`, `npm run check:architecture` 명령이다.
- [x] 성공 조건은 세 명령이 로컬에서 실행되고 실패 없이 종료되는 것이다.
- [x] 실패 조건은 package script가 없거나 실행 중 module import 오류가 발생하는 것이다.

### Functional Unit 2

- [x] 계층별 최소 모듈과 extension entrypoint를 만든다.
- [x] 입력은 각 계층 module import다.
- [x] 출력은 import 가능한 named export다.
- [x] 성공 조건은 domain/application 모듈이 외부 framework 없이 import되는 것이다.
- [x] 실패 조건은 domain/application이 VSCode API, filesystem, process environment 같은 외부 경계에 의존하는 것이다.

### Functional Unit 3

- [x] architecture guard test를 만든다.
- [x] 입력은 `src/` 파일 목록과 import 문이다.
- [x] 출력은 통과 또는 위반 목록이다.
- [x] 성공 조건은 금지된 계층 의존성이 발견되지 않는 것이다.
- [x] 실패 조건은 domain에서 outer dependency를 import하거나 presentation/infrastructure가 금지된 방향으로 의존하는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 전체 scaffold 계층이지만 제품 behavior는 추가하지 않는다.
- [x] 도메인, 유스케이스, 어댑터, 인프라 책임을 디렉터리와 모듈명으로 구분한다.
- [x] 의존성 방향은 `presentation -> application -> domain`, `infrastructure -> application ports`로 제한한다.
- [x] 외부 시스템 접근은 이번 태스크에서 제품 코드에 추가하지 않는다. 테스트와 guard script만 filesystem을 읽는다.
- [x] 필요한 인터페이스, 포트, 어댑터는 이번 태스크에서 구현하지 않고 위치만 만든다.
- [x] 전역 상태, 숨겨진 I/O, 암묵적 설정 접근을 만들지 않는다.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 환경 값은 이번 태스크에서 사용하지 않는다.
- [x] 최초 수신 이후 환경 값을 전역 상수처럼 사용하는 구조를 만들지 않는다.
- [x] 환경 값 전달 구조는 후속 RuntimeContext 태스크에서 다룬다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지한다.

## 7. Logging Requirements

### Product Log

- [x] Product Log는 이번 태스크에서 구현하지 않는다.
- [x] 운영 이벤트를 남길 제품 동작이 아직 없으므로 Product Log event contract를 추가하지 않는다.
- [x] 민감 정보와 과도한 내부 상태를 기록하지 않는다.

### Field Debug Log

- [x] Field Debug Log는 이번 태스크에서 구현하지 않는다.
- [x] 현장 확인용 디버그 로그 활성화 조건은 후속 Logging Infrastructure 태스크에서 정의한다.
- [x] 민감 정보 마스킹 기준은 후속 태스크에서 테스트와 함께 정의한다.
- [x] 보존 범위와 사용 범위는 이번 태스크 범위가 아니다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 만들지 않는다.
- [x] 테스트 완료 후 남는 임시 로그 코드를 제품 코드에 추가하지 않는다.

## 8. State Machine Requirements

- [x] 상태머신은 이번 태스크에서 필요하지 않다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록은 후속 apply/remove/transfer/analyze 태스크에서 정의한다.
- [x] 이벤트 목록은 이번 태스크 범위가 아니다.
- [x] 전이 조건은 이번 태스크 범위가 아니다.
- [x] 실패 상태와 종료 상태는 이번 태스크 범위가 아니다.
- [x] 상태 전이 테스트는 이번 태스크 범위가 아니다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상은 domain/application import smoke와 architecture guard다.
- [x] 정상 케이스 테스트는 각 계층 entrypoint import 성공을 검증한다.
- [x] 실패 케이스 테스트는 guard가 금지 import fixture를 잡을 수 있는지 검증한다.
- [x] 경계값 테스트는 빈 source file list에서 위반이 없음을 검증한다.
- [x] 외부 의존성은 테스트 더블이 필요 없도록 순수 파일 fixture만 사용한다.
- [x] 설정 값 전달 방식 테스트는 이번 태스크에서 설정을 사용하지 않는 것으로 검증한다.
- [x] 로그 정책 검증은 제품 코드에 logger가 없음을 확인한다.
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

  - Node.js 기본 test runner 기반 project scaffold를 만들었다.
  - `src/domain`, `src/application`, `src/infrastructure`, `src/presentation` 계층 entrypoint를 만들었다.
  - `src/extension.js` smoke entrypoint를 만들었다.
  - architecture guard script와 build smoke script를 만들었다.
  - TDD 순서에 따라 실패 테스트를 먼저 확인한 뒤 최소 구현으로 통과시켰다.
- [x] 생성하거나 수정한 파일을 기록한다.

  - `package.json`
  - `scripts/architecture-rules.mjs`
  - `scripts/check-architecture.mjs`
  - `scripts/build-smoke.mjs`
  - `src/domain/index.js`
  - `src/application/index.js`
  - `src/infrastructure/index.js`
  - `src/presentation/index.js`
  - `src/extension.js`
  - `test/architecture/architecture-guard.test.mjs`
  - `test/domain/import-smoke.test.mjs`
  - `test/fixtures/empty-src/.gitkeep`
- [x] 실행한 테스트 명령과 결과를 기록한다.

  - `npm test`: 최초 실행에서 3개 테스트 실패를 확인했다. 구현 후 5개 테스트 모두 통과했다.
  - `npm run build`: 통과했다. `architecture ok`, `build smoke ok`.
  - `npm run check:architecture`: 통과했다. 5개 source file 검사.
- [x] 검증한 항목을 기록한다.

  - Domain/Application module은 VSCode runtime 없이 import된다.
  - Extension entrypoint는 VSCode API를 활성 호출하지 않고 import된다.
  - Domain source의 framework/filesystem import는 guard가 잡는다.
  - Presentation source의 infrastructure import는 guard가 잡는다.
  - 실제 제품 기능, 설정, 로그, 상태머신은 아직 추가하지 않았다.
- [x] 남은 위험 요소를 기록한다.

  - 로컬에 `tsc`가 없어 TypeScript compile 기반 scaffold는 아직 없다.
  - 현재 scaffold는 dependency-free ESM으로 구성했다. TypeScript 도구 설치 또는 compiler 도입은 별도 결정이 필요하다.
  - architecture guard는 정규식 기반 import 검사이므로 이후 복잡한 re-export나 path alias가 생기면 보강해야 한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.

  - 다음 태스크는 Phase 1의 `RuntimeContext`와 설정 경계를 TDD로 구현해야 한다.
  - 설정은 시작 시 1회만 수신하고, 유스케이스에는 명시적으로 전달해야 한다.
  - 유스케이스 내부 settings 재조회와 전역 mutable config를 금지하는 테스트를 먼저 작성해야 한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.

  - 도달하지 않았다. 현재는 Phase 0 scaffold만 완료했다.
- [x] 도달했다면 추가 태스크를 생성하지 않는다.

  - 해당 없음. MVP 최종 목표에 도달하지 않았다.
- [x] 도달하지 못했다면 남은 목표를 정리한다.

  - RuntimeContext, domain policies, analyzer, filesystem adapters, scan/read model, apply/remove/transfer, logging, presentation, watchers가 남아 있다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다.

  - Phase 1 `RuntimeContext And Configuration Boundary`가 다음 작업이다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다.

  - task002는 RuntimeContext model, SettingsReaderPort, validation builder 3개 단위로 제한한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.

  - task002에는 settings reader 1회 호출, path collision validation, use case settings 재조회 금지 테스트를 포함한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.

  - AGENTS.md의 설정 정책과 Clean Architecture 기준에 맞춘다.
- [x] 다음 태스크 파일명을 결정한다.

  - `.tasks/task002.md`
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.

  - `.tasks/task002.md`를 생성한다.
- [x] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작한다.

  - task002 생성 후 즉시 실패 테스트 작성부터 실행한다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [x] `plan.md`의 최종 목표에 도달했다.
- [x] 필수 요구사항이 불명확하여 더 이상 안전하게 진행할 수 없다.
- [x] 외부 정보, 권한, 비밀값, 접근 권한이 없어 진행할 수 없다.
- [x] `AGENTS.md` 원칙과 충돌하는 요구사항이 발견되었다.
- [x] 테스트 또는 검증 환경이 없어 완료 여부를 판단할 수 없다.
- [x] 코드베이스 구조가 계획과 크게 달라 태스크 재설계가 필요하다.
- [x] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.