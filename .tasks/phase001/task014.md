# Task 014. VSCode Command Registry And Extension Contributions

## 1. Task Purpose

- [x] 이 태스크의 목적은 MVP 유스케이스를 VSCode command surface로 노출하기 위한 command registry와 `package.json` contribution metadata를 구현하는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 command palette와 presentation boundary 목표를 다룬다.
- [x] 이 태스크 완료 후 VSCode runtime 없이도 command descriptor와 registration wiring을 테스트할 수 있어야 한다.

## 2. Current Context

- [x] Task 001에서 scaffold와 architecture guard를 완료했다.
- [x] Task 002에서 RuntimeContext와 설정 경계를 완료했다.
- [x] Task 003에서 core domain model과 policies를 완료했다.
- [x] Task 004에서 in-memory skill parser/analyzer를 완료했다.
- [x] Task 005에서 main repository filesystem storage를 완료했다.
- [x] Task 006에서 target scan/classification을 완료했다.
- [x] Task 007에서 safe target copy/remove primitive를 완료했다.
- [x] Task 008에서 RefreshSkills read model 유스케이스를 완료했다.
- [x] Task 009에서 create/import source skill 유스케이스를 완료했다.
- [x] Task 010에서 copy apply와 safe remove 유스케이스를 완료했다.
- [x] Task 011에서 symlink apply primitive와 mode branch를 완료했다.
- [x] Task 012에서 target skill copy/backup to main repository를 완료했다.
- [x] Task 013에서 move applied skill to main repository를 완료했다.
- [x] 이번 태스크를 시작해야 하는 이유는 구현된 MVP 유스케이스를 VSCode extension command로 노출할 표면이 필요하기 때문이다.

## 3. Scope

### Included

- [x] `package.json`에 VSCode extension contribution metadata를 추가한다.
- [x] MVP command id/title 목록을 정의한다.
- [x] presentation command registry를 만든다.
- [x] extension activation에서 command registration wiring을 만든다.
- [x] VSCode runtime 없이 fake command API로 registration을 테스트한다.

### Excluded

- [x] 실제 VSCode UI 입력 prompt를 구현하지 않는다.
- [x] Tree view provider를 구현하지 않는다.
- [x] command별 전체 dependency composition을 구현하지 않는다.
- [x] packaging/publishing을 구현하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] command descriptor 목록을 구현한다.
- [x] command id는 `sponzeySkills.*` namespace를 사용한다.
- [x] 성공 조건은 `package.json` contributes.commands와 presentation descriptors가 일치하는 것이다.

### Functional Unit 2

- [x] command registry wiring을 구현한다.
- [x] 입력은 command API와 command handlers다.
- [x] 출력은 registered disposables다.
- [x] 성공 조건은 fake command API 테스트에서 모든 command가 등록되는 것이다.

### Functional Unit 3

- [x] extension activate fallback을 구현한다.
- [x] VSCode runtime이 없으면 import smoke가 깨지지 않아야 한다.
- [x] 성공 조건은 existing extension import smoke와 build가 통과하는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `presentation`과 extension entrypoint다.
- [x] Presentation은 Application 유스케이스를 호출할 command boundary만 가진다.
- [x] Presentation은 filesystem adapter를 import하지 않는다.
- [x] Domain/Application에는 VSCode API import를 추가하지 않는다.
- [x] command handler는 domain policy를 재구현하지 않는다.

## 6. Configuration Rules

- [x] command registry는 settings reader나 environment를 조회하지 않는다.
- [x] activation 중 RuntimeContext 구성은 후속 composition 태스크로 분리한다.
- [x] command list는 코드와 package metadata에 명시적으로 정의한다.

## 7. Logging Requirements

### Product Log

- [x] 실제 Product Log 출력은 하지 않는다.
- [x] command registration 자체는 Product Log 대상이 아니다.

### Field Debug Log

- [x] 실제 Field Debug Log 출력은 하지 않는다.
- [x] command registration failure는 후속 extension runtime logging에서 처리한다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 debug print를 남기지 않는다.

## 8. State Machine Requirements

- [x] command registry는 상태머신을 갖지 않는다.
- [x] command handler가 복잡해지면 후속 태스크에서 use case state machine result를 그대로 전달한다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] command descriptor와 package contribution 일치 테스트를 작성한다.
- [x] fake VSCode command API registration 테스트를 작성한다.
- [x] extension activate가 VSCode runtime 없이 import/execute 가능한지 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 작성한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현을 작성한다.
- [x] 계층 간 의존성을 확인한다.
- [x] Presentation이 filesystem adapter를 import하지 않는지 확인한다.
- [x] Domain/Application이 VSCode API를 import하지 않는지 확인한다.
- [x] 실제 logger 출력 없이 registration result만 반환하는지 확인한다.
- [x] 모든 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 도메인 계층이 외부 프레임워크에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 환경 값이 전역 상수처럼 사용되지 않는다.
- [x] 외부 API, DB, 파일시스템, 네트워크 접근이 경계 계층에만 존재한다.
- [x] 테스트 더블로 외부 의존성을 대체할 수 있다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

- [x] 수행한 변경 사항을 요약한다.
  - `package.json`에 VSCode `contributes.commands` metadata를 추가했다.
  - MVP command id/title 목록을 `src/presentation/command-registry.js`에 정의했다.
  - `createCommandHandlers`와 `registerSponzeyCommands`를 추가했다.
  - extension `activate`에서 VSCode commands API 또는 테스트 주입 API로 command registration을 수행하도록 했다.
  - VSCode runtime이 없는 Node.js test/import 환경에서는 dynamic import failure를 조용히 처리하도록 했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 생성: `src/presentation/command-registry.js`
  - 수정: `src/presentation/index.js`
  - 수정: `src/extension.js`
  - 수정: `package.json`
  - 생성: `test/presentation/command-registry.test.mjs`
  - 수정: `.tasks/task014.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 62 tests / 62 pass
  - `npm run check:architecture`: 통과, 16 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - presentation command descriptors와 `package.json` contribution commands가 일치하는지 확인했다.
  - fake command API로 모든 command가 등록되는지 확인했다.
  - registered handler가 모두 function인지 확인했다.
  - extension entrypoint가 VSCode runtime 없이 import 가능한지 확인했다.
  - Presentation이 filesystem adapter를 import하지 않는지 확인했다.
  - Domain/Application이 VSCode API를 import하지 않는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - command handler는 아직 placeholder이며 실제 prompt/input 수집과 유스케이스 composition은 없다.
  - tree view provider는 아직 없다.
  - runtime settings reader와 dependency composition은 아직 extension activation에 연결되지 않았다.
  - package activation events, views contribution, menus contribution은 아직 없다.
  - VSCode integration smoke는 아직 없다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 command handler composition을 구현해야 한다.
  - handler는 VSCode UI prompt를 직접 구현하기 전에 argument-driven handler로 테스트 가능해야 한다.
  - dependency composition은 settings를 시작 시 1회만 읽고 RuntimeContext로 주입하는 원칙을 지켜야 한다.
  - command handler는 domain policy를 재구현하지 않고 application use case result만 반환해야 한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.
- [x] 도달했다면 추가 태스크를 생성하지 않는다.
- [x] 도달하지 못했다면 남은 목표를 정리한다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 결정한다.
  - 다음 태스크 파일명은 `.tasks/task015.md`로 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - 다음 태스크는 command handler composition과 argument-driven use case invocation만 다룬다.
- [x] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작한다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [x] `plan.md`의 최종 목표에 도달했다.
- [x] 필수 요구사항이 불명확하여 더 이상 안전하게 진행할 수 없다.
- [x] 외부 정보, 권한, 비밀값, 접근 권한이 없어 진행할 수 없다.
- [x] `AGENTS.md` 원칙과 충돌하는 요구사항이 발견되었다.
- [x] 테스트 또는 검증 환경이 없어 완료 여부를 판단할 수 없다.
- [x] 코드베이스 구조가 계획과 크게 달라 태스크 재설계가 필요하다.
- [x] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.
