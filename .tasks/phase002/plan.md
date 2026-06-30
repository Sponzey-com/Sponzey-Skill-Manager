# Sponzey Skills Manager Post-MVP Development Plan

작성일: 2026-06-29

## 1. Project Goal

이 문서는 Phase 001 MVP 이후의 개발 계획이다. Phase 001의 기존 계획과 태스크 기록은 `.tasks/phase001/` 아래에 보관한다.

Phase 001 MVP는 다음 기반을 제공한다.

- Layered Architecture와 architecture guard
- RuntimeContext 기반 설정 수신
- Main Repository, Global Target, Project Target 분리
- Main Repository source 생성, import, URL/path install
- 기본 `SKILL.md` 분석과 위험도 판단
- copy/symlink apply
- applied skill remove
- applied skill copy/backup/move to Main Repository
- VSCode command palette, tree view, context menu, view title button
- manifest/build smoke gate
- Extension Development Host 실행 스크립트

Post-MVP의 목표는 MVP를 "작동 가능한 기능 묶음"에서 "반복 사용 가능한 관리 도구"로 올리는 것이다.

Post-MVP는 다음 제품 목표를 달성해야 한다.

1. 사용자가 Main Repository를 안전하게 설정, 초기화, 복구할 수 있어야 한다.
2. settings 변경 후 Extension Host reload 없이 명시적 runtime recomposition으로 tree와 command가 최신 설정을 사용해야 한다.
3. source와 copy target의 sync status를 계산하고 표시해야 한다.
4. skill detail, open, edit, analyze, export, rename, delete를 source lifecycle로 제공해야 한다.
5. copy 적용본 업데이트와 symlink/copy 모드 전환을 안전하게 제공해야 한다.
6. backup snapshot을 목록화하고 정식 source로 승격할 수 있어야 한다.
7. 분석 결과가 구조, 보안, 의존성, 호환성, 설명 품질 기준으로 확장되어야 한다.
8. Global/Project target 관리 UX가 multi-root workspace와 custom target을 명확히 지원해야 한다.
9. Product Log, Field Debug Log, Development Log가 실제 logger port와 adapter로 분리되어야 한다.
10. watcher, debounce refresh, stale analysis 표시, release smoke가 추가되어야 한다.

이 계획의 모든 작업은 `AGENTS.md`의 다음 원칙을 필수 기준으로 삼는다.

- Layered Architecture
- Clean Architecture
- Tidy First
- TDD
- 외부 설정 최소화
- 외부 환경 값 시작 시 1회 수신
- 내부 흐름에서 명시적 전달
- Product Log, Field Debug Log, Development Log 분리
- 복잡한 내부 절차의 상태머신 기반 관리

## 2. Phase 001 Archive Policy

Phase 001 문서는 다음 위치에 보존한다.

```text
.tasks/phase001/
  plan.md
  task001.md
  ...
  task035.md
```

규칙:

- `.tasks/phase001/` 파일은 MVP 완료 기록으로 취급한다.
- Phase 001의 사실 오류를 고치는 경우만 수정한다.
- Post-MVP 작업 파일은 `.tasks/phase002/`, `.tasks/phase003/`처럼 새 phase 디렉터리에 작성한다.
- `.tasks/plan.md`는 항상 현재 진행할 최상위 개발 계획만 담는다.
- 새 task 파일은 반드시 이 계획의 phase를 참조한다.

## 3. Current Plan Assessment

### 3.1 Final Goal Assessment

이 계획의 최종 목표는 VSCode Extension 형태의 Sponzey Skills Manager를 반복 사용 가능한 skill lifecycle 관리 도구로 완성하는 것이다.

최종 상태는 다음 조건으로 판정한다.

- Main Repository는 원본 skill source 저장소로만 동작한다.
- Global Target과 Project Target은 agent가 실제로 읽는 적용 위치로만 동작한다.
- source 생성, import, download, apply, remove, backup, copy, move, rename, delete, export, promote 흐름이 명령과 tree view에서 구분된다.
- skill source와 applied skill의 sync status, risk status, last analysis status가 사용자에게 표시된다.
- 위험 skill은 target write 전에 도메인 또는 유스케이스 정책으로 차단된다.
- settings 변경은 extension reload 없이 explicit runtime recomposition으로 반영된다.
- 외부 I/O는 Infrastructure adapter 뒤에 있고, Application은 port와 명시적 input/output으로 검증된다.
- Product Log, Field Debug Log, Development Log가 실제 logger port와 adapter로 분리된다.
- release gate와 Extension Development Host smoke 절차로 반복 검증할 수 있다.

계획 범위에서 제외하는 항목은 다음과 같다.

- Main Repository를 remote sync service로 운영하는 기능
- skill marketplace 검색, 결제, 계정 관리 기능
- VSCode 외부 standalone desktop application
- agent runtime 자체의 skill 실행 기능
- 사용자 동의 없는 외부 네트워크 전송

### 3.2 Strengths To Preserve

현재 계획에서 보존할 강점은 다음과 같다.

- Phase 001 MVP 기록을 `.tasks/phase001/`로 격리해 현재 계획과 완료 기록을 분리했다.
- MVP 이후 작업을 repository setup, sync, detail UX, analyzer, transfer, backup, target, logging, watcher, release로 나누었다.
- 각 phase가 Goal, Scope, Required Changes, Architecture Notes, TDD Requirements, Configuration Rules, Logging Rules, State Management, Validation, Done Criteria, Risks 형식을 따른다.
- AGENTS.md의 Layered Architecture, Clean Architecture, TDD, Tidy First, 설정 관리, 로그 정책, 상태머신 정책을 상위 원칙으로 명시했다.
- `npm test`, `npm run build`, architecture guard, manifest gate를 반복 검증 기준으로 유지했다.

### 3.3 Gaps Fixed In This Revision

이 개정에서 다음 부족한 부분을 실행 계획으로 보강한다.

- 기존 계획에는 현재 코드 상태 평가는 있었지만 계획 자체의 강점, 누락, 선후관계, 충돌 여부를 평가하는 `Current Plan Assessment`가 없었다.
- phase 간 선후관계가 Next Actions에만 일부 있었고, phase gate로 검증 가능한 완료 조건이 부족했다.
- task 파일을 작성할 때 포함해야 하는 필수 항목이 명시되지 않아 개발자가 phase 계획을 작업 단위로 나누는 기준이 부족했다.
- 의존성 방향과 boundary rule이 Architecture Direction과 Review Checklist에 흩어져 있었고, 독립적인 실행 규칙으로 확인하기 어려웠다.
- source lifecycle, backup promotion, apply mode conversion, watcher refresh처럼 실패 분기가 있는 흐름의 상태머신 적용 기준을 phase gate와 연결해야 했다.
- 설정 수신과 runtime recomposition의 허용 흐름은 있었지만, phase 시작 전후에 어떤 테스트로 검증할지 더 명시해야 했다.

### 3.4 AGENTS.md Alignment Decisions

AGENTS.md와 충돌하는 계획은 유지하지 않는다. 이 계획은 AGENTS.md의 추상 원칙을 다음 실행 기준으로 변환한다.

| AGENTS.md Rule               | Plan Decision                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Layered Architecture         | 모든 phase는 Presentation, Application, Domain, Infrastructure, Scripts 중 변경 계층을 명시한다.                              |
| Clean Architecture           | 유스케이스는 input, output, port contract를 먼저 정의하고 adapter 구현은 뒤에 둔다.                                                  |
| TDD                          | 각 기능 task는 실패 테스트, 최소 구현, 구조 정리 순서를 기록한다.                                                                        |
| Tidy First                   | 구조 정리와 기능 변경을 task 또는 commit 단위로 분리한다.                                                                           |
| Configuration Policy         | settings, workspace roots, enabled clients, logging mode는 activation 또는 explicit recomposition에서만 수신한다.          |
| Runtime Environment Handling | RuntimeContext는 immutable 값으로 전달하고 use case 내부에서 settings/env를 재조회하지 않는다.                                        |
| Logging Policy               | 모든 로그 이벤트는 Product Log, Field Debug Log, Development Log 중 하나로 분류한다.                                             |
| State Machine Policy         | 3단계 이상 side effect 흐름은 state, event, transition, failure, terminal state를 테스트한다.                                 |
| Prohibited Patterns          | source delete/remove 혼동, Main Repository/target 혼동, logger singleton, hidden settings access를 phase gate에서 차단한다. |

### 3.5 Priority Corrections

Post-MVP 작업 순서는 다음 우선순위를 따른다.

1. Phase 002에서 runtime recomposition, repository setup, onboarding, smoke baseline을 안정화한다.
2. Phase 003에서 source/applied skill metadata와 sync status read model을 만든다.
3. Phase 004에서 detail/open/edit UX를 붙여 사용자가 상태를 확인하고 조작할 수 있게 한다.
4. Phase 005에서 analyzer coverage를 확장해 위험 skill 차단의 정확도를 높인다.
5. Phase 006 이후에 copy update, apply mode conversion, external-to-managed flow처럼 target write가 있는 기능을 구현한다.
6. Phase 007 이후에 rename/delete/export처럼 source lifecycle을 변경하는 기능을 구현한다.
7. Phase 008 이후에 backup catalog와 promote를 구현한다.
8. Phase 010 이후에 logger adapter를 실제 제품 흐름에 연결한다.
9. Phase 011 watcher는 sync status와 runtime recomposition dispose contract가 검증된 뒤 시작한다.
10. Phase 012 release hardening은 모든 phase의 gate를 통과한 뒤 실행한다.

### 3.6 Ambiguity Removal Rules

task 문서와 구현 PR에서 다음 표현은 그대로 사용하지 않는다.

- 테스트 범위를 모호하게 쓰지 않는다. 어떤 계층의 어떤 행동을 실패 테스트로 먼저 검증할지 적는다.
- 로그 기록 범위를 모호하게 쓰지 않는다. Product Log, Field Debug Log, Development Log 중 하나와 event name, payload masking rule을 적는다.
- 상태 흐름을 모호하게 쓰지 않는다. state list, event list, transition guard, failure state, terminal state를 적는다.
- 환경 입력을 모호하게 쓰지 않는다. activation 또는 explicit recomposition에서 수신한 RuntimeContext field와 전달 경로를 적는다.
- 구조 정리 범위를 모호하게 쓰지 않는다. behavior-preserving Tidy First 변경 범위, 보호 테스트, 기능 변경과의 분리 기준을 적는다.
- 중복 제거 범위를 모호하게 쓰지 않는다. 중복 제거 대상, 새 abstraction의 ownership layer, public contract, 삭제할 중복 코드를 적는다.
- 후속 개선을 모호하게 쓰지 않는다. phase 번호, task 번호 후보, 현재 phase에서 제외하는 이유, 재검토 조건을 적는다.

## 4. Current State Assessment

### 4.1 Implemented Capabilities

현재 코드베이스는 다음 기능을 갖고 있다.

- `src/domain`에서 core value object와 policy를 제공한다.
- `src/application`에서 analysis, apply, refresh, repository management, source, transfer 유스케이스를 제공한다.
- `src/infrastructure`에서 filesystem repository/target store, GitHub/local install source resolver, VSCode settings reader/writer를 제공한다.
- `src/presentation`에서 command registry, command input collection, result rendering, tree data provider, tree view model을 제공한다.
- VSCode manifest는 Activity Bar, tree views, command palette, context menu, view title buttons를 기여한다.
- `npm test`, `npm run build`, `npm run check:architecture`, `npm run check:manifest`가 존재한다.
- 현재 검증 기준은 `npm test` 162개 통과와 `npm run build` 통과다.

### 4.2 Product Gaps

현재 MVP는 기능 동작을 검증했지만 다음 제품 수준 요구는 아직 부족하다.

- Main Repository 초기화/유효성 검사 UX가 충분하지 않다.
- settings 변경 후 runtime context와 tree provider가 자동으로 새 설정을 사용하지 않는다.
- Main Repository 설정과 source import UX가 완전히 분리되었지만 온보딩 흐름은 없다.
- source 목록에 description, risk, sync status, last analyzed, applied target count가 부족하다.
- copy target의 sync status 계산이 없다.
- source delete, rename, export, open SKILL.md, open folder 명령이 없다.
- backup snapshot 목록과 promote-to-source 흐름이 없다.
- analyzer rule set이 PROJECT.md의 구조/보안/의존성/호환성/설명 품질 전체를 다루지 않는다.
- apply mode 전환과 copy update가 없다.
- external skill을 managed copy/symlink로 전환하는 안전 흐름이 없다.
- logger port와 실제 Product/Field/Development log adapter가 없다.
- watcher와 stale analysis 표시가 없다.
- release packaging, VSIX smoke, Extension Host manual smoke checklist가 부족하다.

### 4.3 Architecture Risks

다음 위험을 Post-MVP에서 우선 통제한다.

- settings command가 설정 파일을 갱신한 뒤 runtime composition이 낡은 context를 계속 사용하는 위험
- Presentation에 onboarding policy, overwrite policy, delete policy가 섞이는 위험
- sync status 계산이 filesystem adapter 내부 정책으로 들어가는 위험
- source delete와 target remove가 혼동되는 위험
- backup snapshot이 정식 source와 섞이는 위험
- analyzer가 파일을 직접 읽고 테스트 가능성을 낮추는 위험
- logger singleton이 생겨 Application/Domain 경계를 오염시키는 위험
- watcher가 user home/global target을 테스트 중 직접 건드리는 위험

## 5. Architecture Direction

계층은 계속 다음 구조를 유지한다.

```text
Presentation / Extension UI
Application / Use Cases
Domain
Infrastructure / Adapters
Scripts / Development Gates
```

허용 의존:

- Presentation -> Application
- Application -> Domain
- Infrastructure -> Application port contract
- Infrastructure -> Domain value type
- Scripts -> local files for development gates
- Tests -> all layers

금지 의존:

- Domain -> VSCode API
- Domain -> filesystem/network/process environment
- Application -> concrete Infrastructure class
- Presentation -> filesystem adapter
- Infrastructure -> Presentation
- Use case -> settings reader
- Use case -> environment variable
- Logger implementation -> Domain

Post-MVP에서 반드시 강화할 boundary:

- `RuntimeSession` 또는 equivalent controller는 Presentation/extension boundary에서 composition을 교체한다.
- settings writer command는 설정 저장만 수행하고, command wrapper가 명시적으로 context rebuild를 요청한다.
- sync status calculation은 Application use case 또는 Domain policy decision으로 둔다.
- filesystem hash/copy/open/watch는 Infrastructure adapter 뒤에 둔다.
- logger는 Application output event를 Infrastructure adapter가 처리한다.

## 6. Development Principles

### 6.1 TDD

모든 phase는 다음 순서를 따른다.

1. 실패 테스트를 작성한다.
2. 최소 구현으로 통과시킨다.
3. 구조 중복을 정리한다.
4. 설정, 로그, 상태 전이, 오류 처리를 테스트한다.
5. 전체 `npm test`와 `npm run build`를 실행한다.

### 6.2 Tidy First

기능 변경 전에 필요한 구조 정리는 별도 task로 분리한다.

Tidy First task 예:

- repeated result factory 추출
- read model mapper 분리
- metadata DTO naming 정리
- port adapter test helper 정리
- command input collector route 분리
- tree title action manifest helper 정리

Tidy First task는 behavior를 변경하지 않는다. 기능 변경 task와 같은 파일을 만질 수 있지만, 변경 목적과 테스트를 분리한다.

Reviewable work unit rule:

- 하나의 task는 하나의 user-visible behavior 또는 하나의 Tidy First 구조 정리만 완료한다.
- task가 두 계층 이상을 변경하면 유스케이스 boundary와 adapter boundary를 별도 bullet로 적는다.
- Tidy First task는 기존 테스트가 변경 전후 모두 통과해야 한다.
- 기능 task는 실패 테스트가 먼저 실패했다는 증거를 task 기록에 남긴다.
- 같은 파일을 정리와 기능 변경에서 모두 수정해야 하면 정리 commit 또는 task를 먼저 완료한다.

### 6.3 Configuration Policy

다음 규칙을 모든 phase에 적용한다.

- settings는 activation 또는 explicit recomposition 시 1회만 읽는다.
- 유스케이스 내부에서 settings를 읽지 않는다.
- command handler가 settings를 직접 읽지 않는다.
- settings 변경 command는 writer port만 호출한다.
- settings 변경 후 새 RuntimeContext가 필요하면 extension boundary에서 명시적으로 recomposition한다.
- 기존 RuntimeContext 객체를 mutate하지 않는다.
- external environment value는 RuntimeContext, use case input, constructor argument, dependency injection으로만 전달한다.

### 6.4 Logging Policy

모든 새 event는 다음 중 하나로 분류한다.

- Product Log: 사용자 영향이 있는 완료, 차단, 실패
- Field Debug Log: 현장 재현용 제한적 transition/scan/hash detail
- Development Log: 테스트 fixture와 local-only diagnostic

금지:

- full home path 기록
- `SKILL.md` 본문 기록
- secret/token/API key 기록
- stack trace 전체를 Product Log 기본 출력에 포함
- Development Log를 production default에 포함

### 6.5 State Machine Policy

세 단계 이상이고 실패 분기 또는 filesystem side effect가 있으면 상태머신 또는 명시 steps contract를 둔다.

다음 Post-MVP 절차는 상태, 이벤트, 실패 상태, 종료 상태를 문서화하고 테스트한다.

- runtime recomposition
- repository initialization
- sync status calculation
- update copy from source
- convert apply mode
- delete source
- rename source
- export/import zip
- promote backup
- watcher refresh invalidation

## 7. Implementation Phases

### 7.1 Phase Dependency Gates

phase는 다음 gate를 통과한 뒤 다음 phase로 넘어간다.

| Gate                         | Required Before           | Verification                                                              |
| ---------------------------- | ------------------------- | ------------------------------------------------------------------------- |
| Runtime recomposition gate   | Phase 003 시작              | settings 변경 후 command와 tree가 새 RuntimeContext를 사용한다는 integration test     |
| Repository safety gate       | Phase 003 시작              | Main Repository와 Global/Project Target path collision test                |
| Metadata read model gate     | Phase 004 시작              | source/applied skill metadata mapper와 empty/error state test              |
| Sync status gate             | Phase 006 시작              | copy target hash/metadata drift를 fake port와 temp fixture로 검증              |
| Analyzer policy gate         | Phase 006 target write 시작 | Critical risk block, High risk confirmation, diagnostic category test     |
| Transfer state gate          | Phase 007 시작              | copy/update/conversion state machine transition test                      |
| Source lifecycle safety gate | Phase 007 delete 구현 전     | applied impact analysis와 backup recommendation test                       |
| Backup catalog gate          | Phase 008 promote 구현 전    | backup/source namespace separation test                                   |
| Logger port gate             | Phase 010 adapter 연결 전    | Product/Field/Development event classification and masking test           |
| Watcher lifecycle gate       | Phase 011 시작              | recomposition dispose contract와 duplicate watcher prevention test         |
| Release gate                 | Phase 012 완료              | tests, build, architecture guard, manifest gate, smoke checklist presence |

phase gate 실패 시 다음 phase 기능을 시작하지 않는다. 실패한 gate를 우회하기 위해 UI handler에 임시 정책을 넣지 않는다.

### 7.2 Task File Protocol

새 task 파일은 `.tasks/phaseNNN/taskMMM.md` 형식을 사용한다.

각 task 파일은 다음 항목을 포함한다.

- Purpose: 이 task가 완료할 단일 행동 또는 단일 Tidy First 정리
- Current Context: 관련 phase, 현재 코드 위치, 선행 gate 상태
- Scope: 수정할 계층과 제외할 범위
- Use Case Boundary: input, output, port, domain policy
- Required Changes: 파일 또는 module 단위 작업
- TDD Plan: 먼저 실패시킬 테스트 이름과 기대 실패 이유
- Configuration Rules: settings/env 수신 지점과 RuntimeContext 전달 경로
- Logging Rules: Product/Field/Development event name과 masking rule
- State Machine: 필요한 경우 state, event, transition, failure, terminal state
- Validation: 실행할 command와 manual smoke 항목
- Done Criteria: 리뷰어가 완료를 판정할 수 있는 조건
- Risks: 데이터 손실, target 오염, stale context, false positive, UX 혼동 위험
- Next Task Link: 다음 task가 있다면 phase/task 번호로 연결

task 파일은 "구현한다", "처리한다" 같은 문장만으로 끝내지 않는다. 무엇을 어느 계층에 두고 어떤 테스트로 검증할지 적는다.

## Phase 002. MVP Stabilization, Onboarding, And Runtime Recomposition

* Goal:
  - Main Repository 초기 설정과 설정 변경 후 사용 흐름을 안정화한다.
  - Extension Host reload 없이 명시적 runtime recomposition으로 tree와 command가 최신 RuntimeContext를 사용하게 한다.
* Scope:
  - Main Repository setup wizard
  - repository path validation and initialization
  - runtime session controller
  - settings command after-action recomposition
  - result rendering clarity
  - view title action usability
* Required Changes:
  - `RuntimeSession` 또는 동등한 extension boundary 객체를 도입한다.
  - `RuntimeSession.recompose()`는 settings reader를 1회 호출하고 새 composition과 tree provider read model loader를 교체한다.
  - settings writer command 성공 후 command wrapper가 `recompose()`를 호출한다.
  - use case 내부에서는 settings reader를 호출하지 않는다.
  - Main Repository setup command를 추가하거나 기존 `Set Main Repository` 흐름을 wizard로 확장한다.
  - setup wizard는 directory 선택, existence check, writable check, repository initialization confirmation을 수집한다.
  - repository initialization은 `skills/`, `backups/`, `.sponzey/` 구조를 만든다.
  - `~/.agents/skills`, `~/.claude/skills`, workspace root, home root 같은 risky repository path는 blocking 또는 strong warning diagnostic으로 반환한다.
  - command result renderer는 diagnostic message, result code, recommended next action을 표시한다.
  - Main Repository view title action은 import, install, set repository, remove repository의 의미가 icon/title에서 구분되어야 한다.
* Architecture Notes:
  - Runtime recomposition은 Presentation/extension boundary 책임이다.
  - Repository initialization policy는 Application use case에 둔다.
  - Directory creation은 Infrastructure filesystem adapter가 수행한다.
  - VSCode window prompt는 Presentation input collector에만 둔다.
* TDD Requirements:
  - settings command 성공 후 `RuntimeSession.recompose()`가 호출되는 실패 테스트를 먼저 작성한다.
  - `RuntimeSession.recompose()`가 settings reader를 정확히 1회 호출하는 테스트를 작성한다.
  - old composition context가 mutate되지 않는 테스트를 작성한다.
  - repository setup wizard가 folder selection, create confirmation, initialize confirmation을 input DTO로 변환하는 테스트를 작성한다.
  - risky path validation 테스트를 작성한다.
  - repository initializer가 temp directory에 `skills/`, `backups/`, `.sponzey/`를 만드는 adapter 테스트를 작성한다.
* Configuration Rules:
  - settings는 activation과 explicit `recompose()`에서만 읽는다.
  - settings command handler는 settings reader를 직접 호출하지 않는다.
  - recomposition은 새 RuntimeContext를 만들고 기존 RuntimeContext를 변경하지 않는다.
* Logging Rules:
  - setup completed/failed는 Product Log event로 반환한다.
  - path validation detail은 Field Debug Log event 후보로 반환한다.
  - selected raw path는 Product Log에 기록하지 않는다.
* State Management:
  - Repository setup state:

    `SelectingPath -> ValidatingPath -> ConfirmingInitialization -> InitializingRepository -> WritingSettings -> RebuildingRuntime -> Completed`
  - Failure states:

    `SelectionCancelled`, `PathRejected`, `InitializationFailed`, `SettingsWriteFailed`, `RuntimeRebuildFailed`
  - Runtime recomposition state:

    `ReadingSettings -> BuildingRuntimeContext -> RewiringHandlers -> RefreshingTree -> Completed`
* Validation:
  - Extension Host에서 Main Repository를 새 경로로 설정한 뒤 reload 없이 Refresh가 새 경로를 사용한다.
  - invalid main repository 상태에서도 Set Main Repository가 실행된다.
  - `npm test`와 `npm run build`가 통과한다.
* Done Criteria:
  - 초기 사용자가 Main Repository를 안전하게 설정하고 즉시 tree를 볼 수 있다.
  - settings 변경 후 command/tree가 stale context를 사용하지 않는다.
  - setup flow는 source import와 혼동되지 않는다.
* Risks:
  - recomposition을 hidden global mutable singleton으로 구현하면 AGENTS.md와 충돌한다.
  - settings change event listener가 암묵적으로 settings를 계속 재조회하면 설정 정책을 위반한다.

## Phase 003. Repository Index, Metadata Normalization, And Sync Status

* Goal:
  - Main Repository와 target 상태를 빠르게 비교하고 copy 적용본의 drift를 표시한다.
* Scope:
  - RepositoryIndex cache
  - directory hash service
  - source metadata normalization
  - applied metadata normalization
  - copy sync status
  - read model enrichment
* Required Changes:
  - `HashPort`를 정의하고 filesystem hash adapter를 구현한다.
  - `.sponzey/index.json` 또는 extension storage index adapter를 구현한다.
  - source metadata schema를 `id`, `originType`, `createdAt`, `updatedAt`, `lastAnalyzedAt`, `riskLevel`, `sourceHash` 중심으로 정규화한다.
  - applied metadata schema를 `sourceSkillId`, `sourcePath`, `applyMode`, `installedAt`, `sourceHash`, `targetHash` 중심으로 정규화한다.
  - `RefreshSkills` read model에 `syncStatus`, `sourceHash`, `targetHash`, `lastCheckedAt`, `appliedTargetCount`를 추가한다.
  - copy applied skill의 상태를 `In Sync`, `Source Changed`, `Target Changed`, `Both Changed`, `Missing Source`, `Missing Target`, `External`, `Broken Symlink`로 계산한다.
  - symlink applied skill은 link target 존재와 main repository 내부 여부를 검증한다.
* Architecture Notes:
  - hash 계산은 Infrastructure adapter가 수행한다.
  - sync decision은 Domain policy 또는 Application use case에 둔다.
  - index는 cache이며 source of truth는 filesystem이다.
  - index corruption은 typed diagnostic으로 반환하고 full rescan으로 복구한다.
* TDD Requirements:
  - same source/target hash가 `In Sync`를 반환하는 테스트를 작성한다.
  - source hash만 달라지면 `Source Changed`를 반환하는 테스트를 작성한다.
  - target hash만 달라지면 `Target Changed`를 반환하는 테스트를 작성한다.
  - source와 target이 모두 달라지면 `Both Changed`를 반환하는 테스트를 작성한다.
  - missing source, missing target, broken symlink를 각각 테스트한다.
  - corrupt index load가 refresh 실패가 아니라 diagnostic + rescan으로 이어지는 테스트를 작성한다.
* Configuration Rules:
  - index path는 RuntimeContext의 main repository path에서 파생한다.
  - refresh 중 settings를 재조회하지 않는다.
* Logging Rules:
  - sync summary는 Product Log에 count만 기록한다.
  - hash comparison detail은 Field Debug Log에 masked identifier만 기록한다.
  - raw file path와 file content를 로그에 기록하지 않는다.
* State Management:
  - Sync calculation state:

    `LoadingIndex -> HashingSource -> HashingTarget -> ComparingHashes -> UpdatingIndex -> Completed`
  - Failure states:

    `IndexUnreadable`, `SourceUnreadable`, `TargetUnreadable`, `HashFailed`, `IndexWriteFailed`
* Validation:
  - temp fixture에서 hash가 안정적으로 계산된다.
  - tree view는 sync status를 read model에서만 표시한다.
  - filesystem adapter가 sync policy를 결정하지 않는다.
* Done Criteria:
  - Main Repository tree와 Global/Project tree에 sync status가 표시된다.
  - copy applied skill drift가 감지된다.
  - index가 없어도 full rescan으로 동작한다.
* Risks:
  - hash 계산이 큰 repository에서 느려질 수 있다.
  - initial implementation은 debounce와 incremental hash 없이 correctness를 우선한다.

## Phase 004. Skill Detail, Open, Edit, And Diagnostics UX

* Goal:
  - 사용자가 tree item에서 skill의 파일, 분석 결과, 적용 상태를 바로 확인하고 열 수 있게 한다.
* Scope:
  - open source folder
  - open target folder
  - open `SKILL.md`
  - detail read model
  - diagnostics grouping
  - analysis command UX
* Required Changes:
  - `GetSkillDetail` use case를 구현한다.
  - source detail output에 name, description, sourcePath, skillMdPath, riskLevel, diagnostics, appliedTargets, file summary를 포함한다.
  - applied detail output에 targetPath, applyMode, syncStatus, source link, diagnostics를 포함한다.
  - `OpenSkillSourceFolder`, `OpenSkillTargetFolder`, `OpenSkillMd` command를 추가한다.
  - Diagnostics view를 severity/category 기준으로 그룹화한다.
  - Analyze Skill command를 tree source item과 applied item context menu에 연결한다.
  - Analyze All Skills command를 Main Repository view title 또는 command palette에 추가한다.
* Architecture Notes:
  - open command는 Application output과 Infrastructure opener port를 통해 처리한다.
  - Presentation은 path를 직접 열지 않는다.
  - detail view는 read model DTO를 표시한다.
  - custom webview는 이 phase에서 만들지 않는다.
* TDD Requirements:
  - source tree item에서 `Open SKILL.md`가 source skill md path를 opener port에 전달하는 테스트를 작성한다.
  - applied tree item에서 `Open Target Folder`가 target path를 opener port에 전달하는 테스트를 작성한다.
  - `GetSkillDetail`이 source/applied 구분 DTO를 반환하는 테스트를 작성한다.
  - Diagnostics grouping mapper 테스트를 작성한다.
  - Analyze All Skills가 모든 source에 analyzer를 호출하고 summary diagnostic을 반환하는 테스트를 작성한다.
* Configuration Rules:
  - detail/open/analyze는 RuntimeContext와 explicit item payload만 사용한다.
  - command 실행 중 settings를 재조회하지 않는다.
* Logging Rules:
  - file open 성공은 Product Log로 기록하지 않는다.
  - file open 실패는 Product Log failure event로 반환한다.
  - analysis detail은 Field Debug Log event 후보로 반환한다.
* State Management:
  - Analyze All state:

    `LoadingSources -> ReadingSkillFiles -> RunningRules -> AggregatingDiagnostics -> UpdatingMetadata -> Completed`
  - Failure states:

    `SourceScanFailed`, `ReadFailed`, `AnalysisFailed`, `MetadataWriteFailed`
* Validation:
  - tree context menu command가 package manifest와 command registry에 모두 존재한다.
  - `SKILL.md` 본문은 notification/log에 노출되지 않는다.
* Done Criteria:
  - 사용자는 source와 target 파일 위치를 열 수 있다.
  - 사용자는 단일 skill과 전체 skill 분석을 실행할 수 있다.
  - Diagnostics view가 위험도를 기준으로 탐색 가능하다.
* Risks:
  - detail UI를 webview로 먼저 만들면 범위가 커진다.
  - 이 phase는 기본 VSCode opener와 tree/read model UX에 한정한다.

## Phase 005. Analyzer Expansion: Structure, Security, Dependency, Compatibility, Quality

* Goal:
  - PROJECT.md의 분석 상세 설계에 맞춰 analyzer를 MVP 기본 위험도에서 실사용 검토 수준으로 확장한다.
* Scope:
  - frontmatter parser hardening
  - structure rules
  - description quality rules
  - security rules
  - dependency extraction
  - compatibility rules
  - diagnostic categories
* Required Changes:
  - diagnostic category를 `structure`, `security`, `compatibility`, `dependency`, `quality`, `sync`로 정규화한다.
  - frontmatter parse failure를 typed diagnostic으로 반환한다.
  - directory name과 `name` mismatch rule을 추가한다.
  - broad/short/ambiguous description rule을 추가한다.
  - `allowed-tools` broad permission rule을 추가한다.
  - MCP server reference, shell command, network dependency, environment variable dependency를 추출한다.
  - Codex/Claude compatibility warning rule을 추가한다.
  - prompt injection/policy override phrase rule을 추가한다.
  - risk aggregation을 category와 severity 기반으로 재정의한다.
* Architecture Notes:
  - analyzer는 file content DTO를 입력으로 받는다.
  - file read는 repository port가 수행한다.
  - rule engine은 Domain 또는 Application pure function으로 유지한다.
  - 외부 LLM 분석은 이 phase에 포함하지 않는다.
* TDD Requirements:
  - malformed frontmatter가 `structure` diagnostic을 반환하는 테스트를 작성한다.
  - too broad description이 `quality` warning을 반환하는 테스트를 작성한다.
  - broad allowed-tools가 `dependency` 또는 `security` medium diagnostic을 반환하는 테스트를 작성한다.
  - MCP reference가 dependency DTO로 추출되는 테스트를 작성한다.
  - secret exfiltration, policy override phrase가 critical diagnostic을 반환하는 테스트를 작성한다.
  - Claude-only/Codex-only field가 compatibility warning을 반환하는 테스트를 작성한다.
* Configuration Rules:
  - rule enable/disable 설정은 이 phase에서 추가하지 않는다.
  - analyzer behavior는 코드 정책과 explicit input으로만 결정한다.
* Logging Rules:
  - analysis completed는 Product Log summary로 반환한다.
  - rule execution detail은 Field Debug Log event 후보로 반환한다.
  - file content와 matched secret value는 로그에 포함하지 않는다.
* State Management:
  - Analyzer state:

    `LoadingSkillFiles -> ParsingSkillMd -> RunningStructureRules -> RunningQualityRules -> RunningSecurityRules -> RunningDependencyRules -> RunningCompatibilityRules -> AggregatingRisk -> Completed`
  - Failure states:

    `MissingSkillMd`, `ParseFailed`, `UnreadableFile`, `RuleFailed`
* Validation:
  - analyzer tests는 filesystem 없이 in-memory files로 실행된다.
  - repository analyzer integration은 fake repository port로 실행 가능하다.
* Done Criteria:
  - Diagnostics가 category와 recommendation을 포함한다.
  - risk level은 expanded rule set을 반영한다.
  - Critical risk는 여전히 apply 전에 차단된다.
* Risks:
  - 문자열 패턴 rule은 false positive가 생길 수 있다.
  - output은 block 여부와 recommendation을 분리해 사용자가 판단할 수 있게 한다.

## Phase 006. Copy Update, Apply Mode Conversion, And External-To-Managed Flow

* Goal:
  - 적용된 copy/symlink/external skill을 안전하게 업데이트하거나 관리 상태로 전환한다.
* Scope:
  - update copy from source
  - compare copy status
  - convert symlink to copy
  - convert copy to symlink
  - external to managed copy
  - external to managed symlink
* Required Changes:
  - `UpdateAppliedCopyFromSource` use case를 구현한다.
  - `ConvertAppliedSkillMode` use case를 구현한다.
  - `ImportExternalAppliedSkillAndReplaceTarget` use case를 구현한다.
  - target local modification이 있으면 confirmation 없이는 overwrite하지 않는다.
  - symlink -> copy는 link 제거 후 source content를 copy한다.
  - copy -> symlink는 target hash를 확인하고 confirmation 후 copy를 제거하고 symlink를 만든다.
  - external -> managed는 먼저 Main Repository로 copy/import하고, target replace 여부를 명시 확인한다.
* Architecture Notes:
  - conversion policy는 Domain/Application에 둔다.
  - filesystem operation은 target store와 repository port 뒤에 둔다.
  - Presentation은 confirmation만 수집한다.
* TDD Requirements:
  - in-sync copy update가 target copy를 교체하는 테스트를 작성한다.
  - target changed copy update가 confirmation 없이 block되는 테스트를 작성한다.
  - symlink -> copy가 source를 유지하고 target을 directory로 바꾸는 테스트를 작성한다.
  - copy -> symlink가 target changed 상태에서 confirmation을 요구하는 테스트를 작성한다.
  - external -> managed copy가 source import 후 target metadata를 기록하는 테스트를 작성한다.
  - external target delete/replace가 confirmation 없이는 실행되지 않는 테스트를 작성한다.
* Configuration Rules:
  - default conversion behavior는 settings로 숨기지 않는다.
  - destructive 또는 overwrite 가능성이 있는 선택은 use case input confirmation으로 받는다.
* Logging Rules:
  - update/convert completed와 blocked는 Product Log다.
  - hash comparison과 transition detail은 Field Debug Log다.
* State Management:
  - Convert state:

    `ValidatingInput -> LoadingAppliedSkill -> CalculatingSync -> PlanningConversion -> WaitingForConfirmation -> WritingTarget -> WritingMetadata -> VerifyingResult -> Completed`
  - Failure states:

    `InvalidInput`, `TargetMissing`, `SourceMissing`, `LocalModificationBlocked`, `ConflictDetected`, `WriteFailed`, `VerificationFailed`
* Validation:
  - source untouched verification을 포함한다.
  - external skill은 기본 보존 정책을 유지한다.
* Done Criteria:
  - copy 적용본을 source에서 업데이트할 수 있다.
  - symlink/copy 모드 전환이 안전 확인과 함께 동작한다.
  - external skill을 Main Repository 중심 관리로 전환할 수 있다.
* Risks:
  - copy update는 사용자 수정 손실 위험이 높다.
  - target hash와 confirmation 없이는 overwrite하지 않는다.

## Phase 007. Source Lifecycle: Rename, Delete, Export, Zip Import

* Goal:
  - Main Repository source의 생명주기를 안전하게 관리한다.
* Scope:
  - rename source
  - delete source
  - delete backup before source delete
  - export source zip
  - import zip
  - applied target impact analysis
* Required Changes:
  - `RenameSourceSkill` use case를 구현한다.
  - `DeleteSourceSkill` use case를 구현한다.
  - `ExportSourceSkill` use case를 구현한다.
  - `ImportSkillArchiveToMainRepository` use case를 구현한다.
  - source delete 전 applied target count와 symlink break risk를 계산한다.
  - source delete는 confirmation 없이는 실행하지 않는다.
  - delete 전 backup 생성 옵션을 explicit input으로 받는다.
  - rename은 existing source conflict를 overwrite하지 않는다.
  - zip export/import는 path traversal을 차단한다.
* Architecture Notes:
  - source delete와 target remove를 명령명과 use case에서 분리한다.
  - archive read/write는 Infrastructure adapter가 수행한다.
  - delete policy는 Domain/Application에 둔다.
* TDD Requirements:
  - applied symlink가 있는 source delete가 confirmation 없이 block되는 테스트를 작성한다.
  - source delete가 target copy를 삭제하지 않는 테스트를 작성한다.
  - delete with backup이 backup snapshot을 만든 뒤 source를 삭제하는 테스트를 작성한다.
  - rename conflict가 block되는 테스트를 작성한다.
  - zip export가 `SKILL.md`와 metadata를 포함하는 테스트를 작성한다.
  - zip import가 archive path traversal을 거부하는 테스트를 작성한다.
* Configuration Rules:
  - delete default behavior를 runtime 중간 설정으로 바꾸지 않는다.
  - backup path는 RuntimeContext에서 받은 backup policy 또는 explicit input으로 전달한다.
* Logging Rules:
  - source rename/delete/export/import completed와 blocked는 Product Log다.
  - applied impact detail은 Field Debug Log다.
* State Management:
  - Delete source state:

    `ValidatingInput -> LoadingSource -> FindingAppliedTargets -> PlanningBackup -> WaitingForConfirmation -> WritingBackup -> DeletingSource -> VerifyingTargets -> Completed`
  - Failure states:

    `InvalidInput`, `SourceMissing`, `AppliedTargetRiskBlocked`, `BackupFailed`, `DeleteFailed`, `VerificationFailed`
* Validation:
  - delete source는 target remove와 별개다.
  - path traversal guard가 archive와 filesystem adapter에 있다.
* Done Criteria:
  - 사용자는 source를 rename/delete/export/import할 수 있다.
  - source delete는 데이터 손실 위험을 명시적으로 통제한다.
* Risks:
  - delete 기능은 가장 위험한 기능이다.
  - 기본 정책은 block + explicit confirmation + optional backup이다.

## Phase 008. Backup Catalog And Promote Backup To Skill

* Goal:
  - backup snapshot을 관리 가능한 자산으로 만들고 정식 source로 승격할 수 있게 한다.
* Scope:
  - backup scan
  - backup tree/read model
  - backup detail
  - promote backup to source
  - backup delete
  - transfer audit integration
* Required Changes:
  - `ListSkillBackups` use case를 구현한다.
  - `GetBackupDetail` use case를 구현한다.
  - `PromoteBackupToSkillSource` use case를 구현한다.
  - backup metadata schema를 검증한다.
  - backup read model을 Diagnostics 또는 dedicated Backup view에 표시한다.
  - promote는 `skills/<name>` conflict를 overwrite하지 않는다.
  - promoted backup metadata에 `promotedToSkillSourceId`를 기록한다.
* Architecture Notes:
  - backup은 source와 별도 aggregate로 취급한다.
  - promote는 backup -> source transfer operation이다.
  - backup delete는 source delete와 별도 use case다.
* TDD Requirements:
  - backup scan이 valid backup metadata만 목록화하는 테스트를 작성한다.
  - invalid backup metadata가 diagnostic으로 표시되는 테스트를 작성한다.
  - promote conflict가 block되는 테스트를 작성한다.
  - promote success가 source metadata originType `backup-promoted`를 기록하는 테스트를 작성한다.
  - backup delete가 promoted source를 삭제하지 않는 테스트를 작성한다.
* Configuration Rules:
  - backup root는 RuntimeContext로 전달한다.
  - promote name은 explicit input으로 받는다.
* Logging Rules:
  - backup list는 Product Log를 남기지 않는다.
  - promote completed/blocked는 Product Log다.
  - backup metadata parse detail은 Field Debug Log다.
* State Management:
  - Promote state:

    `ValidatingInput -> LoadingBackup -> CheckingNameConflict -> CopyingBackupToSource -> WritingSourceMetadata -> UpdatingBackupMetadata -> Completed`
  - Failure states:

    `InvalidInput`, `BackupMissing`, `InvalidBackupMetadata`, `NameConflictBlocked`, `WriteFailed`
* Validation:
  - backup snapshot은 target을 변경하지 않는다.
  - promoted source는 Main Repository `skills/` 아래에만 생성된다.
* Done Criteria:
  - 백업 목록을 볼 수 있다.
  - 백업을 정식 source로 승격할 수 있다.
* Risks:
  - backup과 source가 UI에서 섞이면 삭제 의미가 흐려진다.
  - backup tree 또는 detail label에서 snapshot임을 명확히 표시한다.

## Phase 009. Multi-Root, Target Management, And Client Compatibility UX

* Goal:
  - 여러 workspace root, Codex/Claude/custom target을 명확하게 관리한다.
* Scope:
  - multi-root target selection
  - global target add/remove UX hardening
  - project target pattern management
  - custom client type
  - client compatibility display
  - target validation
* Required Changes:
  - project apply command에서 workspace root를 명시 선택하게 한다.
  - Project Skills tree를 workspace root별로 그룹화한다.
  - Global Skills tree를 client type별로 그룹화한다.
  - target add command는 path existence, writable, source/target collision을 검증한다.
  - target remove command는 applied skill existence를 표시하고 confirmation을 요구한다.
  - analyzer compatibility result를 target apply 선택지에 표시한다.
  - custom target은 label, clientType, targetPath를 가진다.
* Architecture Notes:
  - target registry calculation은 Application/RuntimeContext boundary에서 수행한다.
  - VSCode workspaceFolders는 activation/recomposition에서만 수신한다.
  - Presentation은 grouping display만 수행한다.
* TDD Requirements:
  - multi-root workspace에서 project target이 root별로 생성되는 테스트를 작성한다.
  - project apply input collector가 workspace root를 명시 선택하는 테스트를 작성한다.
  - target add validation이 main repository overlap을 block하는 테스트를 작성한다.
  - target remove가 confirmation 없이 block되는 테스트를 작성한다.
  - incompatible skill/target 조합이 warning diagnostic을 반환하는 테스트를 작성한다.
* Configuration Rules:
  - workspace root 목록은 recomposition 시 1회 수신한다.
  - target path 추가/삭제는 settings writer port를 통해 수행한다.
* Logging Rules:
  - target add/remove completed와 blocked는 Product Log다.
  - target validation detail은 Field Debug Log다.
* State Management:
  - Target management state:

    `SelectingTarget -> ValidatingTarget -> CheckingOverlap -> CheckingAppliedEntries -> WaitingForConfirmation -> WritingSettings -> RebuildingRuntime -> Completed`
  - Failure states:

    `SelectionCancelled`, `TargetRejected`, `AppliedEntriesBlocked`, `SettingsWriteFailed`, `RuntimeRebuildFailed`
* Validation:
  - Main Repository는 Global/Project Target으로 오인되지 않는다.
  - target add/remove 후 tree가 reload 없이 최신 target을 표시한다.
* Done Criteria:
  - multi-root workspace에서 프로젝트별 target을 명확히 선택하고 관리할 수 있다.
  - Codex/Claude/custom target이 UI와 read model에서 구분된다.
* Risks:
  - multi-root 선택을 생략하면 잘못된 프로젝트에 skill이 적용될 수 있다.
  - project apply command는 root를 암묵 선택하지 않는다.

## Phase 010. Logging Infrastructure And Transfer Audit Trail

* Goal:
  - output event 후보를 실제 logger port와 audit trail로 연결한다.
* Scope:
  - logger port
  - product logger adapter
  - field debug logger adapter
  - development logger adapter
  - masking utility
  - transfer operation audit store
* Required Changes:
  - `LoggerPort`를 정의한다.
  - Application result events를 logger port로 전달하는 command wrapper를 만든다.
  - Product Log adapter는 minimal event만 기록한다.
  - Field Debug Log adapter는 RuntimeContext logging policy가 enabled일 때만 기록한다.
  - Development Log adapter는 test/development mode에서만 기록한다.
  - path masking utility를 구현한다.
  - transfer copy/backup/move/promote operation audit record를 `.sponzey/transfer-log.json` 또는 index store에 기록한다.
* Architecture Notes:
  - Domain은 logger를 알지 못한다.
  - Application은 event DTO를 반환한다.
  - Infrastructure가 persistence/output을 담당한다.
  - logger는 singleton이 아니라 composition dependency로 주입한다.
* TDD Requirements:
  - Product Log에 full home path가 포함되지 않는 테스트를 작성한다.
  - fake secret value가 log output에서 masking되는 테스트를 작성한다.
  - Field Debug Log disabled 상태에서 transition detail이 기록되지 않는 테스트를 작성한다.
  - Development Log production mode가 no-op인 테스트를 작성한다.
  - transfer audit record가 operation type, source, destination, status, diagnostics를 기록하는 테스트를 작성한다.
* Configuration Rules:
  - logging policy는 RuntimeContext에서 전달한다.
  - logger adapter는 process environment를 직접 읽지 않는다.
* Logging Rules:
  - Product Log는 사용자 영향 이벤트만 기록한다.
  - Field Debug Log는 제한적 detail만 기록한다.
  - Development Log는 프로덕션 기본 동작에서 비활성이다.
* State Management:
  - logger 자체는 상태머신을 갖지 않는다.
  - 상태머신 terminal/failure state와 log event mapping을 문서화한다.
* Validation:
  - 모든 log test는 fake path와 fake secret만 사용한다.
  - 실제 사용자 파일 내용은 log fixture에 포함하지 않는다.
* Done Criteria:
  - command 실행 결과 event가 logger port를 통해 처리된다.
  - 민감 정보 마스킹 테스트가 통과한다.
  - transfer audit trail을 조회할 수 있다.
* Risks:
  - logger가 직접 전역 접근으로 구현되면 테스트와 설정 정책을 위반한다.
  - logger dependency는 composition에서 명시 주입한다.

## Phase 011. Watchers, Refresh Invalidation, And Stale Analysis

* Goal:
  - 파일 변경을 감지하고 read model을 자동으로 갱신하며 분석 stale 상태를 표시한다.
* Scope:
  - main repository watcher
  - target watcher
  - debounce refresh
  - stale analysis marker
  - missing source/target detection
  - watcher lifecycle
* Required Changes:
  - `WatcherPort`를 정의한다.
  - VSCode/file watcher adapter를 Infrastructure에 둔다.
  - watcher event는 직접 read model을 수정하지 않고 refresh invalidation을 요청한다.
  - debounce controller를 Presentation/extension boundary에 둔다.
  - source `SKILL.md` 변경 시 `analysisStatus: stale`을 표시한다.
  - target change 시 sync status를 다시 계산한다.
  - runtime recomposition 시 watcher를 dispose하고 새 context로 재등록한다.
* Architecture Notes:
  - watcher는 event source다.
  - RefreshSkills가 source of truth를 재계산한다.
  - watcher adapter는 Domain/Application policy를 결정하지 않는다.
* TDD Requirements:
  - watcher event가 debounced refresh를 한 번만 호출하는 테스트를 작성한다.
  - source change event가 stale analysis marker를 유발하는 테스트를 작성한다.
  - target delete event가 missing target diagnostic을 유발하는 테스트를 작성한다.
  - recomposition 시 old watcher dispose가 호출되는 테스트를 작성한다.
* Configuration Rules:
  - watcher target path는 RuntimeContext에서 받는다.
  - watcher 중간에 settings를 재조회하지 않는다.
* Logging Rules:
  - watcher registration failure는 Product Log failure다.
  - watcher event detail과 debounce detail은 Field Debug Log다.
* State Management:
  - Watcher refresh state:

    `Idle -> Invalidated -> Debouncing -> Refreshing -> UpdatingTree -> Idle`
  - Failure states:

    `WatcherRegistrationFailed`, `RefreshFailed`, `TreeUpdateFailed`
* Validation:
  - watcher tests는 fake watcher port로 실행한다.
  - adapter smoke는 temp directory만 사용한다.
* Done Criteria:
  - 파일 변경 후 사용자가 수동 refresh를 누르지 않아도 tree가 갱신된다.
  - 분석 stale 상태가 표시된다.
  - recomposition 후 watcher가 중복 등록되지 않는다.
* Risks:
  - watcher가 실제 home/global path를 테스트 중 감시하면 위험하다.
  - tests는 fake watcher와 temp fixture만 사용한다.

## Phase 012. Release Hardening, Packaging, And Documentation

* Goal:
  - 확장 기능을 반복 배포 가능한 품질로 정리한다.
* Scope:
  - manual smoke checklist
  - Extension Host smoke automation
  - VSIX packaging readiness
  - README usage guide
  - troubleshooting guide
  - release gate
* Required Changes:
  - `scripts/run-vscode-extension-host.sh` 동작을 문서화한다.
  - Extension Host manual smoke checklist를 `.tasks/release-smoke.md` 또는 `docs/`에 작성한다.
  - VSIX packaging command와 manifest completeness check를 추가한다.
  - README에 setup, import, install, apply, remove, backup, move, sync, troubleshooting을 작성한다.
  - `code` command unavailable 시 사용자 안내를 현재 script와 문서에 맞춘다.
  - release gate script는 `npm test`, `npm run build`, manifest check, architecture check, smoke checklist presence를 실행한다.
* Architecture Notes:
  - release scripts는 product runtime dependency가 아니다.
  - packaging metadata는 manifest validation rule로 검증한다.
  - documentation은 product behavior와 충돌하면 코드 또는 문서를 함께 수정한다.
* TDD Requirements:
  - release gate script가 required commands를 실행하는지 script test를 작성한다.
  - manifest completeness rule이 icon, command, views, menus, engines를 검증하는 테스트를 작성한다.
  - README command list가 package command contribution과 drift되지 않는 테스트를 작성한다.
* Configuration Rules:
  - release scripts는 user settings를 읽지 않는다.
  - packaging은 environment mutation 없이 explicit arguments를 사용한다.
* Logging Rules:
  - release script output은 Development Log로 분류한다.
  - packaging failure는 machine-readable code를 출력한다.
* State Management:
  - release gate state:

    `CheckingTests -> CheckingArchitecture -> CheckingManifest -> CheckingPackage -> CheckingDocs -> Completed`
  - Failure states:

    `TestsFailed`, `ArchitectureFailed`, `ManifestFailed`, `PackageFailed`, `DocsFailed`
* Validation:
  - clean temp workspace에서 release gate를 실행한다.
  - manual smoke checklist는 Phase 001 MVP와 Post-MVP 주요 흐름을 포함한다.
* Done Criteria:
  - 사용자가 Extension Development Host에서 기능을 재현할 수 있다.
  - release gate가 명확한 failure code를 반환한다.
  - README와 manifest command 목록이 일치한다.
* Risks:
  - packaging을 너무 일찍 자동화하면 product gaps가 숨겨진다.
  - release gate는 기능 품질 검증을 대체하지 않는다.

## 8. Cross-Phase TDD Strategy

테스트 피라미드는 다음 비율을 유지한다.

```text
Domain tests: policy, state transition, value object
Application tests: use case input/output, fake ports, log event DTO
Infrastructure tests: filesystem, archive, watcher, VSCode adapter wrapper with temp fixtures
Presentation tests: command input, tree mapping, result rendering, manifest contribution
Extension integration tests: activation, command wiring, runtime recomposition, tree refresh
Scripts tests: architecture, manifest, release gates
Manual smoke: Extension Host user workflow
```

모든 phase에서 다음 검증을 수행한다.

1. Domain 계층이 외부 framework에 의존하지 않는지 확인한다.
2. 유스케이스가 명시적 입력과 출력을 가지는지 확인한다.
3. 외부 환경 값이 프로그램 시작 또는 explicit recomposition 이후 암묵적으로 재조회되지 않는지 확인한다.
4. 설정 값이 프로세스 중간에 삽입되거나 변경되지 않는지 확인한다.
5. 외부 API, DB, 파일시스템, 네트워크 접근이 경계 계층에만 존재하는지 확인한다.
6. 테스트 더블로 외부 의존성을 대체할 수 있는지 확인한다.
7. 로그가 3단계 정책에 맞게 분리되어 있는지 확인한다.
8. Development Log가 production default에 포함되지 않는지 확인한다.
9. 복잡한 내부 흐름이 flag 조합이 아니라 명시 state/step/transition으로 표현되는지 확인한다.
10. 리팩터링과 기능 변경이 가능한 한 분리되어 있는지 확인한다.
11. Main Repository가 Global/Project Target으로 오인되지 않는지 확인한다.
12. remove는 source를 삭제하지 않는지 확인한다.
13. delete는 source lifecycle 명령에서만 실행되는지 확인한다.
14. backup은 target을 변경하지 않는지 확인한다.
15. Critical risk apply는 target write 전에 차단되는지 확인한다.

## 9. Configuration And Runtime Environment Policy

Post-MVP에서 설정 관리는 다음 절차만 허용한다.

```text
Activation or Explicit Recomposition
-> Read VSCode Settings Once
-> Read Workspace Roots Once
-> Validate
-> Normalize
-> Freeze RuntimeContext
-> Wire Use Cases And Adapters
-> Inject Into Command Handlers
```

거부하는 흐름:

```text
Use Case
-> read VSCode settings
-> read process.env
-> mutate global config
-> decide target path from hidden singleton
```

settings 변경 명령 처리 규칙:

- settings writer port로만 값을 쓴다.
- 성공 결과를 받은 command wrapper가 explicit recomposition을 실행한다.
- recomposition 실패 시 settings write 성공과 runtime rebuild 실패를 분리해 표시한다.
- 기존 RuntimeContext를 mutate하지 않는다.
- watcher와 tree provider는 새 RuntimeContext에 맞춰 재등록하거나 read model loader를 교체한다.

## 10. Logging Strategy

Post-MVP 필수 Product Log event:

```text
repository.setup.completed
repository.setup.failed
runtime.recompose.completed
runtime.recompose.failed
skill.analysis.completed
skill.analysis.failed
skill.sync.calculated
skill.apply.completed
skill.apply.blocked
skill.remove.completed
skill.transfer.copy.completed
skill.transfer.backup.completed
skill.transfer.move.completed
skill.source.rename.completed
skill.source.delete.completed
skill.source.delete.blocked
skill.backup.promote.completed
watcher.registration.failed
release.gate.failed
```

Post-MVP 필수 Field Debug Log event:

```text
runtime.recompose.step
repository.validation.detail
sync.hash.compared
analysis.rule.completed
conversion.transition
source.delete.transition
backup.promote.transition
target.validation.detail
watcher.event.received
watcher.debounce.completed
```

Development Log event는 test harness와 local script output에만 둔다.

## 11. State Machine Strategy

상태머신 또는 explicit step contract는 다음 산출물을 가져야 한다.

- State list
- Event list
- Transition conditions
- Guard conditions
- Failure states
- Terminal states
- Side effect boundary
- Product Log mapping
- Field Debug Log mapping
- Transition tests

상태머신 구현 기준:

- 단순 1-2 단계 조회 흐름에는 상태머신을 만들지 않는다.
- 3단계 이상, filesystem write, confirmation, rollback/cleanup 가능성이 있으면 상태머신을 만든다.
- Adapter 내부에서 상태머신을 소유하지 않는다.
- UI는 상태 전이를 수행하지 않는다.

## 12. Dependency And Boundary Rules

### 12.1 Boundary Matrix

각 기능은 다음 boundary를 지킨다.

| Capability             | Domain                                      | Application                                 | Infrastructure                              | Presentation                                              |
| ---------------------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Runtime recomposition  | RuntimeContext value validation rule only   | Recomposition request/output model          | VSCode settings/workspace reader adapter    | command wrapper triggers recomposition and renders result |
| Repository setup       | path collision policy, repository identity  | setup/validate use case, port contracts     | filesystem create/read/write adapter        | wizard input and result display                           |
| Source import/download | source identity, risk default policy        | install/import use case, resolver port      | GitHub/local/zip resolver, filesystem write | URL/path/folder command input                             |
| Apply/remove           | applied skill policy, risk guard, mode rule | apply/remove state machine and ports        | target filesystem write/remove adapter      | confirmation and tree refresh                             |
| Sync status            | status value object and comparison policy   | status calculation use case                 | hash/read metadata adapter                  | badge/icon/description mapping                            |
| Analyzer               | diagnostic category and severity policy     | analyzer orchestration and rule ports       | file content reader adapter                 | detail view and diagnostics rendering                     |
| Backup/copy/move       | transfer operation policy                   | transfer state machine and ports            | source/target filesystem adapters           | confirmation and result rendering                         |
| Rename/delete/export   | source lifecycle policy                     | lifecycle state machine and impact analysis | filesystem rename/delete/archive adapter    | guarded commands                                          |
| Logging                | event naming convention if modeled as value | logger port event emission                  | logger adapter and masking implementation   | no direct logger implementation                           |
| Watcher                | no dependency                               | refresh invalidation use case               | filesystem watcher adapter                  | tree refresh scheduling only                              |

### 12.2 Port And Adapter Rules

port는 Application 경계에 정의한다. Domain은 외부 I/O port를 알지 않는다.

필수 port categories:

- `SkillSourceRepository`: source list, read, write, rename, delete, metadata load/save
- `SkillTargetStore`: applied skill list, apply, remove, read target metadata
- `SkillInstallSourceResolver`: GitHub URL, local path, folder, zip source resolution
- `SkillContentReader`: analyzer가 필요한 파일 내용 읽기
- `SkillArchiveStore`: export/import zip과 backup snapshot 저장
- `SettingsReader` and `SettingsWriter`: activation/recomposition boundary에서만 사용
- `WorkspaceReader`: activation/recomposition boundary에서만 사용
- `LoggerPort`: Product Log와 Field Debug Log event 전달
- `DevelopmentLogPort`: test harness와 local script에서만 사용
- `FileWatcherPort`: watcher registration, dispose, event stream
- `ClockPort` and `IdGeneratorPort`: metadata timestamp와 operation id 생성

adapter 구현 규칙:

- adapter는 filesystem, VSCode API, network, process interaction을 숨긴다.
- adapter는 overwrite, delete, risk, backup, conversion 정책을 결정하지 않는다.
- adapter error는 infrastructure-specific exception을 그대로 노출하지 않고 use case error type으로 변환한다.
- adapter test는 temp fixture와 fake VSCode wrapper를 사용한다.
- network가 필요한 resolver는 timeout, cancellation, checksum 또는 source identity 검증 기준을 가진다.

### 12.3 Dependency Validation Rules

각 phase 완료 전에 다음 검증을 실행한다.

1. Domain 계층에서 VSCode API, filesystem, network, process environment import가 없는지 architecture guard로 확인한다.
2. Application 계층에서 concrete Infrastructure class를 생성하지 않는지 확인한다.
3. Presentation 계층에서 filesystem adapter를 직접 호출하지 않는지 확인한다.
4. Infrastructure 계층에서 UI rendering 또는 command input collection에 의존하지 않는지 확인한다.
5. use case 내부에서 settings reader, process environment, hidden singleton을 호출하지 않는지 확인한다.
6. RuntimeContext가 activation 또는 explicit recomposition 이후 mutable global로 저장되지 않는지 확인한다.
7. logger 구현체가 Domain 또는 policy object로 들어가지 않는지 확인한다.
8. 테스트 더블이 모든 external dependency를 대체할 수 있는지 use case test로 확인한다.
9. source delete와 applied remove가 별도 command, use case, log event로 유지되는지 확인한다.
10. Main Repository가 Global/Project Target으로 암묵 처리되지 않는지 path collision test로 확인한다.

### 12.4 Reviewable Boundary Decisions

새 기능을 계획하거나 리뷰할 때 다음 결정을 task에 기록한다.

- 이 기능의 user-visible command는 무엇인가?
- 이 기능의 primary use case input과 output은 무엇인가?
- 도메인 정책은 어떤 value object, policy, state machine에 위치하는가?
- 외부 I/O는 어떤 port 뒤에 있는가?
- adapter가 실패할 때 use case output은 어떤 error code를 반환하는가?
- 설정 값이 필요하다면 RuntimeContext의 어느 field로 전달되는가?
- Product Log event와 Field Debug Log event는 무엇인가?
- 상태머신이 필요하다면 terminal state와 failure state는 무엇인가?
- 테스트 더블로 대체할 dependency는 무엇인가?
- task가 Tidy First 작업인지 기능 변경인지 어떻게 구분되는가?

## 13. Risk And Mitigation

| Risk                       | Impact                             | Mitigation                             | Verification                   |
| -------------------------- | ---------------------------------- | -------------------------------------- | ------------------------------ |
| stale RuntimeContext       | settings 변경 후 잘못된 target/source 사용 | explicit runtime recomposition         | recomposition integration test |
| Main Repository와 target 혼동 | 의도치 않은 skill 활성화                   | path validation, target/source naming  | collision tests                |
| copy update overwrite      | 사용자 수정 손실                          | sync status, confirmation guard        | target changed block test      |
| source delete 데이터 손실       | 원본 삭제 및 symlink break              | applied impact analysis, backup option | delete blocked tests           |
| backup/source 혼동           | snapshot 삭제/승격 오류                  | backup catalog separation              | backup promote tests           |
| analyzer false positive    | 사용성 저하                             | diagnostic category/recommendation 분리  | analyzer fixture tests         |
| logger 민감 정보 노출            | 보안/신뢰 문제                           | masking utility, log tests             | fake secret/full path tests    |
| watcher 중복 등록              | 성능 저하/중복 refresh                   | recomposition dispose contract         | watcher lifecycle test         |
| release script가 환경을 변경     | 재현성 저하                             | explicit args, no env mutation         | script tests                   |

## 14. Review Checklist

Architecture:

- Domain은 VSCode API, filesystem, network, process environment를 import하지 않는다.
- Application은 concrete Infrastructure class를 생성하지 않는다.
- Presentation은 filesystem adapter를 호출하지 않는다.
- Infrastructure는 유스케이스 정책을 결정하지 않는다.
- Scripts는 runtime source에 의존하지 않는다.

Configuration:

- settings는 activation 또는 explicit recomposition에서만 읽는다.
- RuntimeContext는 immutable하다.
- settings writer command가 use case 내부에서 context를 mutate하지 않는다.
- watcher path와 target path는 RuntimeContext에서 전달된다.

Logging:

- Product Log와 Field Debug Log가 구분된다.
- Product Log에는 full path, skill body, secret이 없다.
- Field Debug Log는 기본 비활성이다.
- Development Log는 production default에 포함되지 않는다.

State Machine:

- 3단계 이상 side-effect 흐름은 state/step/failure state를 가진다.
- confirmation required 상태가 명확하다.
- failure state가 Product Log event와 연결된다.
- transition detail은 Field Debug Log로만 간다.

Product:

- Main Repository는 source library로 유지된다.
- target apply/remove/delete 의미가 UI에서 구분된다.
- backup은 target을 변경하지 않는다.
- source delete는 target remove와 다르다.
- sync status는 copy target drift를 표현한다.
- external skill은 기본 보존된다.

Testing:

- 실패 테스트가 먼저 작성되었다.
- fake port로 use case가 검증된다.
- adapter test는 temp fixture만 사용한다.
- `npm test`와 `npm run build`가 통과한다.

## 15. Definition Of Done

Post-MVP plan은 다음을 만족할 때 완료된다.

- Main Repository setup과 runtime recomposition이 reload 없이 동작한다.
- source와 target sync status가 tree에 표시된다.
- skill detail/open/edit/analyze UX가 tree와 command palette에서 동작한다.
- analyzer가 구조, 보안, 의존성, 호환성, 설명 품질을 진단한다.
- copy update와 symlink/copy conversion이 안전 확인과 함께 동작한다.
- source rename/delete/export/import zip이 source lifecycle로 제공된다.
- backup catalog와 promote backup to source가 동작한다.
- multi-root workspace와 Codex/Claude/custom target 관리가 명확하다.
- logger port와 3단계 로그 adapter가 구현된다.
- watcher 기반 refresh와 stale analysis 표시가 동작한다.
- release gate, manifest validation, README, manual smoke checklist가 준비된다.
- 모든 phase의 tests, build, architecture guard, manifest gate가 통과한다.

## 16. Prohibited Implementation Patterns

다음을 구현하지 않는다.

- Domain에서 VSCode API 직접 호출
- Domain에서 filesystem/network/environment 직접 접근
- Application에서 concrete Infrastructure class 직접 생성
- 유스케이스 내부 settings 재조회
- runtime 중간 process environment 변경
- global mutable RuntimeContext
- hidden service locator
- logger singleton 직접 호출
- UI command handler에 domain policy 구현
- filesystem adapter에서 overwrite/delete policy 결정
- boolean flag 조합으로 conversion/delete/promote 상태 추론
- Product Log에 full path, secret, skill body 기록
- Field Debug Log 기본 활성화
- Development Log production default 포함
- 테스트 없는 기능 변경
- 테스트 없는 리팩터링
- source delete와 applied remove를 같은 명령으로 처리
- backup 명령이 target을 변경하는 동작
- Main Repository를 Global Skill Target으로 암묵 취급

## 17. Next Actions

다음 작업 순서로 진행한다.

1. `.tasks/phase002/task001.md`를 작성한다.
2. Task 001 범위는 `RuntimeSession` Tidy First와 explicit recomposition 실패 테스트로 제한한다.
3. `extension.js`의 composition 보관 방식을 분석하고 mutation 없는 session controller 설계를 확정한다.
4. settings command 성공 후 recomposition되는 테스트를 작성한다.
5. invalid context에서도 settings recovery command가 계속 동작하는 회귀 테스트를 유지한다.
6. Main Repository setup wizard task를 `.tasks/phase002/task002.md`로 분리한다.
7. repository initialization/validation task를 `.tasks/phase002/task003.md`로 분리한다.
8. Phase 002 완료 전에는 sync/index, delete, watcher 기능을 시작하지 않는다.