# Task 016. Tree View Read Model Mapper And View Contributions

## 1. Task Purpose

- [x] 이 태스크의 목적은 `RefreshSkills` read model을 VSCode tree view가 표시할 수 있는 plain DTO로 변환하고, package view contribution metadata를 추가하는 것이다.
- [x] 이 태스크 완료 후 Main Repository, Global Skills, Project Skills, Diagnostics tree sections를 VSCode runtime 없이 테스트할 수 있어야 한다.

## 2. Current Context

- [x] Task 015에서 argument-driven command handler composition을 완료했다.
- [x] 이번 태스크를 시작해야 하는 이유는 MVP가 Main Repository, Global Skills, Project Skills, Diagnostics 목록 확인을 요구하기 때문이다.

## 3. Scope

### Included

- [x] `mapSkillsReadModelToTreeItems(readModel)` presentation mapper를 만든다.
- [x] Main Repository, Global Skills, Project Skills, Diagnostics root section을 만든다.
- [x] package `viewsContainers`와 `views` contribution metadata를 추가한다.
- [x] tree view DTO와 package views contribution 일치 테스트를 작성한다.

### Excluded

- [x] 실제 VSCode `TreeDataProvider` class를 구현하지 않는다.
- [x] icon theme와 context menu를 구현하지 않는다.
- [x] refresh command와 tree provider event wiring은 구현하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] read model to tree item DTO mapper를 구현한다.
- [x] 성공 조건은 source/applied/diagnostic 항목이 section별 children으로 매핑되는 것이다.

### Functional Unit 2

- [x] package views contribution metadata를 구현한다.
- [x] 성공 조건은 view id/title이 presentation descriptor와 일치하는 것이다.

### Functional Unit 3

- [x] DTO는 VSCode API 없이 plain object로 유지한다.
- [x] 성공 조건은 Node.js test에서 import 가능하고 VSCode runtime이 필요 없는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `presentation`과 `package.json`이다.
- [x] Presentation은 read model DTO만 소비한다.
- [x] Domain/Application에는 VSCode API import를 추가하지 않는다.

## 6. Configuration Rules

- [x] tree mapper는 settings/environment를 조회하지 않는다.
- [x] view id/title은 코드와 package metadata에 명시적으로 둔다.

## 7. Logging Requirements

- [x] 로그를 출력하지 않는다.
- [x] mapper는 순수 함수로 유지한다.

## 8. State Machine Requirements

- [x] tree mapper는 상태머신을 갖지 않는다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] sample read model이 4개 root section으로 변환되는지 검증한다.
- [x] package views contribution과 presentation descriptors가 일치하는지 검증한다.
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
- [x] VSCode API 없이 import 가능하다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.

## 12. Completion Report

- [x] 수행한 변경 사항을 요약한다.
  - `SPONZEY_TREE_VIEWS` view descriptor를 추가했다.
  - `mapSkillsReadModelToTreeItems` plain DTO mapper를 추가했다.
  - `package.json`에 activity bar `viewsContainers`와 `views` contribution metadata를 추가했다.
  - Main Repository, Global Skills, Project Skills, Diagnostics 4개 root section을 생성하도록 했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 생성: `src/presentation/tree-view-model.js`
  - 수정: `src/presentation/index.js`
  - 수정: `package.json`
  - 생성: `test/presentation/tree-view-model.test.mjs`
  - 수정: `.tasks/task016.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 67 tests / 67 pass
  - `npm run check:architecture`: 통과, 17 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - package views contribution과 presentation view descriptor가 일치하는지 확인했다.
  - sample read model이 네 root section으로 변환되는지 확인했다.
  - source/applied/diagnostic 항목이 child DTO로 매핑되는지 확인했다.
  - tree mapper가 VSCode API 없이 import/test 가능한지 확인했다.
  - Presentation이 filesystem adapter를 import하지 않는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - 실제 VSCode `TreeDataProvider` class는 아직 없다.
  - refresh result를 tree provider state로 갱신하는 wiring은 아직 없다.
  - command handler dependency composition은 extension activation에 아직 연결되지 않았다.
  - settings reader와 RuntimeContext startup composition은 아직 없다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 extension runtime composition을 구현해야 한다.
  - settings reader는 activation/startup에서 한 번만 호출하고 RuntimeContext를 command handlers에 주입해야 한다.
  - filesystem adapters와 application use cases를 composition root에서만 연결해야 한다.

## 13. Next Task Decision Hook

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.
  - 아직 도달하지 못했다. Extension composition과 smoke 검증이 남아 있다.
- [x] 도달하지 못했다면 다음 태스크를 생성한다.
  - 다음 태스크 파일명은 `.tasks/task017.md`로 결정한다.

## 14. Stop Conditions

- [x] `plan.md`의 최종 목표에 도달했다.
- [x] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.
