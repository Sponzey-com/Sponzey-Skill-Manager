# Sponzey Skills Manager Phase 003 Development Plan

작성일: 2026-06-30
최근 개정일: 2026-07-01

## 0. Revision Purpose

이 개정의 목적은 Phase 003 계획을 단순한 방향성 문서가 아니라 실제 개발자가 바로 task 파일로 분해하고 구현할 수 있는 실행 계획으로 강화하는 것이다.

이 문서는 다음 우선순위를 따른다.

1. `AGENTS.md`의 아키텍처, 설정, 로그, 상태머신, TDD, Tidy First 규칙을 최상위 기준으로 삼는다.
2. `PROJECT.md`의 제품 정의를 기능 우선순위와 사용자 흐름 기준으로 삼는다.
3. Phase 001, Phase 002의 구현 결과는 현재 baseline으로 존중하되, 제품 품질을 떨어뜨리는 drift와 모호성은 Phase 003에서 수정한다.
4. 새 기능 추가보다 사용자 혼동, 위험 작업, diagnostic 신뢰성, refresh 일관성, release readiness를 먼저 해결한다.
5. 모든 Phase는 독립적으로 리뷰 가능한 task 단위로 내려갈 수 있어야 한다.

이 문서에서 "구현한다", "추가한다", "정리한다"는 표현은 반드시 다음 정보를 포함해야 한다.

- 어느 계층을 변경하는가
- 어떤 유스케이스 입력과 출력이 생기는가
- 외부 I/O가 어떤 port 또는 adapter 뒤에 위치하는가
- 어떤 실패 테스트를 먼저 작성하는가
- 어떤 Product Log, Field Debug Log, Development Log 분류가 적용되는가
- 상태머신 또는 explicit steps가 필요한가
- `npm test`, `npm run build`, Extension Development Host smoke 중 무엇으로 검증하는가

## 1. Project Goal

Phase 003의 목표는 Phase 001 MVP와 Phase 002 Post-MVP 구현을 "기능이 동작하는 확장"에서 "일상적으로 신뢰할 수 있는 VSCode Extension"으로 끌어올리는 것이다.

Phase 003은 새로운 대형 기능을 무리하게 추가하지 않는다. 이미 구현된 Main Repository, Global/Project Target, Codex/Claude target, URL/path install, symlink/copy apply, remove, transfer, backup, promote, analyzer, sync status, logger, watcher, release gate 흐름을 제품 품질 기준으로 정리한다.

최종 사용자는 다음 상태를 얻어야 한다.

- Main Repository와 Global/Project Target의 차이를 UI에서 즉시 이해한다.
- Analyze 결과가 Diagnostics에 표시되고, 어떤 skill에서 어떤 위험이 나왔는지 추적할 수 있다.
- source skill, applied skill, backup, diagnostic, audit event의 의미가 서로 섞이지 않는다.
- Codex/Claude/custom target 표시와 선택 흐름이 일관된다.
- copy/symlink/external 상태, sync 상태, 위험도, 호환성, shadowing 가능성을 확인한 뒤 적용/삭제/백업 작업을 수행한다.
- Extension Development Host에서 주요 흐름을 수동으로 재현할 수 있고, release gate가 자동 검증한다.

Phase 003은 다음 항목을 명시적으로 제외한다.

- 원격 marketplace 또는 registry 검색
- cloud sync
- 팀 계정/권한 서버
- agent runtime 실행 엔진
- AI 기반 description rewrite
- webview 기반 고급 editor
- Git 기반 버전 관리 자동화
- OpenAI API skill bundle upload

## 2. Phase Archive Policy

현재 문서 보관 상태는 다음과 같다.

```text
.tasks/
  plan.md                    # 현재 Phase 003 계획
  phase001/
    plan.md
    task001.md ... task035.md
  phase002/
    plan.md
    release-smoke.md
    task001.md ... task022.md
```

운영 규칙:

- `.tasks/phase001/`은 MVP 완료 기록으로 취급한다.
- `.tasks/phase002/`는 Post-MVP 구현 기록으로 취급한다.
- Phase 002 문서는 사실 오류 또는 회고 보강이 필요한 경우에만 수정한다.
- 루트 `.tasks/plan.md`는 항상 다음에 진행할 최상위 개발 계획만 담는다.
- Phase 003 task 파일을 만들 때는 루트 `.tasks/task001.md`, `.tasks/task002.md`처럼 생성한다.
- Phase 003이 완료되면 루트 plan/task 파일을 `.tasks/phase003/`로 이동한다.

## 3. Current Implementation Baseline

Phase 003 계획은 현재 코드와 문서의 다음 상태를 기준으로 한다.

### 3.1 Implemented Product Capabilities

- VSCode Extension entrypoint와 command registration이 존재한다.
- Activity Bar container와 `Main Repository`, `Global Skills`, `Project Skills`, `Diagnostics` tree views가 존재한다.
- Project Skills view는 workspace folder가 있을 때만 기여되도록 manifest 조건을 가진다.
- Main Repository 기본 경로는 `~/SponzeySkills`로 자동 생성될 수 있다.
- Main Repository는 source repository로만 취급하고 Global/Project Target으로 암묵 취급하지 않는다.
- `skills/`, `backups/`, `.sponzey/` repository structure가 초기화된다.
- Codex global target `~/.agents/skills`와 Claude global target `~/.claude/skills`를 지원한다.
- Project target pattern으로 `.agents/skills`, `.claude/skills`를 지원한다.
- global/project target 등록 시 Codex, Claude, All 선택 흐름이 존재한다.
- applied skill row는 target folder grouping 없이 skill row에 Codex/Claude badge를 표시한다.
- Main Repository에 skill 생성, local folder import, URL/path install, archive import가 가능하다.
- source skill을 global/project target에 symlink 또는 copy로 적용할 수 있다.
- applied skill remove는 source를 삭제하지 않는다.
- applied skill을 Main Repository로 copy, backup, move할 수 있다.
- backup catalog, promote backup to source, delete backup 흐름이 존재한다.
- source rename, delete, export, archive import 흐름이 존재한다.
- copy update, apply mode conversion, external-to-managed conversion 흐름이 존재한다.
- analyzer는 structure, quality, security, dependency, compatibility diagnostic을 생성한다.
- Analyze All Skills 결과는 command notification과 Diagnostics tree에 표시된다.
- sync status 계산과 hash port가 존재한다.
- watcher debounce refresh와 stale analysis 흐름이 존재한다.
- Product Log, Field Debug Log, Development Log route와 VSCode output logger adapter가 존재한다.
- transfer audit store가 존재한다.
- Extension Development Host run script와 release gate가 존재한다.
- `npm test`와 `npm run build`가 현재 주요 검증 명령이다.

### 3.2 Current Verification Baseline

Phase 002 종료 시점의 기준 검증은 다음으로 본다.

```text
npm test
npm run build
```

현재 테스트 범위는 Domain, Application, Infrastructure, Presentation, Extension activation, scripts를 포함한다.

Phase 003의 모든 task는 최소한 다음을 유지해야 한다.

- 기존 테스트 수가 줄지 않는다. 삭제가 필요하면 삭제 이유와 대체 검증을 task에 기록한다.
- `npm test`가 통과한다.
- `npm run build`가 통과한다.
- architecture guard가 Domain/Application/Presentation/Infrastructure 의존 방향을 계속 검증한다.
- manifest validation이 command/view/menu contribution drift를 잡는다.

## 4. Current Plan Assessment

### 4.1 Strengths To Preserve

다음 강점은 유지한다.

- Main Repository와 Target의 개념 분리가 코드, 문서, UI에 반영되어 있다.
- source remove/delete, target remove, backup, copy, move가 명령과 유스케이스에서 구분된다.
- RuntimeContext는 activation 또는 explicit recomposition에서 수신하고 use case 내부에서 settings를 재조회하지 않는다.
- 외부 I/O는 filesystem, VSCode, logger, settings, watcher adapter 뒤에 있다.
- analyzer는 in-memory file DTO로 테스트 가능하다.
- Diagnostics와 notification이 user-visible result를 제공한다.
- Phase 002 task 문서 대부분이 체크박스 기반 완료 기록을 갖는다.
- release gate와 smoke checklist가 도입되어 반복 검증 기반이 있다.

### 4.2 Product Gaps To Address

Phase 003에서 해결할 주요 빈틈은 다음이다.

- Diagnostics tree가 flat diagnostic list에 머물러 있고 category/severity/source 기준 탐색성이 부족하다.
- Analyze diagnostic은 tree에 표시되지만 persistent analysis metadata와 stale 상태 UX가 아직 제품적으로 충분하지 않다.
- source detail은 사용자가 "왜 위험한지", "어디에 적용됐는지", "어떤 client와 호환되는지"를 한 번에 판단하기에 부족하다.
- command result notification은 요약은 제공하지만 다음 행동을 충분히 안내하지 않는다.
- Codex/Claude/custom target compatibility와 skill compatibility가 apply 선택 전후에 충분히 드러나지 않는다.
- global/project 같은 이름의 skill shadowing 또는 conflict를 명시적으로 보여주는 정책이 부족하다.
- manual Extension Host smoke가 실제 사용자 흐름 기준으로 더 촘촘해야 한다.
- package/release readiness가 VSIX 후보 수준으로 완성되었는지 별도 gate가 부족하다.
- audit trail은 기록되지만 사용자가 확인할 수 있는 UX와 troubleshooting 문서가 부족하다.
- watcher refresh와 analysis stale 상태가 race 없이 반복 동작하는지 더 강한 integration 검증이 필요하다.

### 4.3 Architecture Risks

Phase 003에서 특히 통제할 위험은 다음이다.

- Diagnostics UX 개선을 Presentation mapper에만 넣어 Application read model과 정책이 분리되지 않는 위험
- analyzer persistence를 filesystem adapter 내부 정책으로 구현해 use case test가 어려워지는 위험
- source detail command가 직접 filesystem path를 열어 Presentation이 Infrastructure를 우회하는 위험
- compatibility/shadowing 판단이 UI label 조합으로 구현되는 위험
- watcher refresh와 Analyze result injection이 서로 덮어써 Diagnostics가 사라지는 위험
- Product Log 또는 Diagnostics detail에 full path, skill body, secret-like value가 노출되는 위험
- release smoke가 실제 Extension Development Host 동작을 검증하지 않고 문서 존재만 확인하는 위험

### 4.4 AGENTS.md Alignment Decisions

Phase 003은 `AGENTS.md`를 우선 기준으로 삼는다.

| AGENTS.md Principle          | Phase 003 Decision                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Layered Architecture         | Diagnostics, detail, compatibility, release gate 모두 계층별 책임을 task에 명시한다.                                |
| Clean Architecture           | 새 사용자 행동은 먼저 use case input/output/ports를 정의하고 adapter는 뒤에 둔다.                                         |
| Tidy First                   | tree/read model mapper, diagnostic DTO, analyzer metadata 정리는 기능 변경 task와 분리한다.                        |
| TDD                          | 모든 phase item은 실패 테스트 이름과 expected failure를 먼저 기록한다.                                                   |
| Configuration Policy         | 새 설정은 추가하지 않는 것을 기본값으로 한다. 필요하면 activation/recomposition에서 1회만 수신한다.                                   |
| Runtime Environment Handling | workspace roots, target paths, logging mode, repository path는 RuntimeContext 또는 explicit input으로 전달한다. |
| Logging Policy               | Product Log는 완료/차단/실패 요약만, Field Debug Log는 transition/detail만, Development Log는 test/local only로 둔다.  |
| State Machine Policy         | analysis persistence, shadowing detection, release gate, watcher refresh는 명시 states/steps를 갖는다.        |

### 4.5 Required Plan Corrections

현재 Phase 003 계획은 제품 방향과 아키텍처 방향이 대체로 맞지만, 다음 항목은 task로 분해하기 전에 반드시 보강해야 한다.

| Area                    | Current Gap                                      | Required Correction                                                                                 |
| ----------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Completion Criteria     | Phase별 완료 기준이 제품 관점과 테스트 관점으로 섞여 있다.        | 각 Phase에 user-visible outcome, automated validation, manual smoke outcome을 분리해 기록한다.                 |
| Task Sequencing         | Diagnostics, persistence, watcher가 서로 의존하지만 순서가 약하다. | read model 정리 -> persistence -> grouping/detail -> watcher race guard 순서를 고정한다.                    |
| Tidy First              | 일부 Phase가 cleanup과 기능 변경을 동시에 포함한다.           | DTO/read model/formatter/helper 정리는 기능 task보다 먼저 별도 task 또는 phase sub-step으로 분리한다.            |
| Runtime Settings        | 새 설정을 추가하지 않는다는 원칙은 있으나 예외 처리 기준이 약하다.      | 새 설정이 필요한 경우 `Setting Justification`, `Startup Read Point`, `RuntimeContext Field`, test를 요구한다. |
| Logging                 | event 후보는 있으나 리뷰 기준이 phase별로 충분히 구체적이지 않다.  | 각 task는 Product/Field Debug/Development Log event 이름과 금지 payload를 명시한다.                         |
| State Machine           | 상태 목록은 있으나 side effect boundary가 일부 흐름에서 약하다. | filesystem write, metadata write, watcher update, release script execution의 side effect boundary를 명시한다. |
| Diagnostics Persistence | metadata 위치와 schema migration 정책이 아직 결정되지 않았다.  | Phase 003에서는 repository-local `.sponzey/analysis/` metadata를 기본으로 하고 schema version을 포함한다.       |
| Conflict Policy         | shadowing priority를 단정할 위험이 있다.                | client별 공식 priority를 모르면 `potential-shadowing` warning으로 표시하고 block과 분리한다.                    |
| Release Readiness       | VSIX publishing과 local release candidate가 섞일 수 있다. | Phase 003은 local release candidate까지만 다루고 marketplace publish는 제외한다.                            |

### 4.6 Resolved Planning Decisions

다음 결정은 Phase 003 전체에 적용한다.

- Analysis metadata는 Main Repository 내부의 `.sponzey/analysis/` 하위에 저장한다.
- Metadata에는 `schemaVersion`, `skillId`, `sourceHash`, `analyzedAt`, `riskLevel`, `diagnostics`, `dependencies`, `compatibility`를 포함한다.
- Metadata write 실패는 source scan 전체 실패가 아니라 `analysis.metadata.write.failed` Product Log와 Diagnostics entry로 표현한다.
- Diagnostics view의 기본 grouping은 `severity -> category -> item`으로 둔다. source 중심 탐색은 detail action으로 보완한다.
- Conflict와 shadowing은 사용자에게 보여주는 diagnostic이다. 실제 target write를 막는 조건은 overwrite, external folder, Critical risk, explicit confirmation failure로 제한한다.
- Watcher는 read model을 직접 수정하지 않는다. Watcher는 invalidation event만 발생시키고 Refresh use case가 source of truth를 다시 계산한다.
- Extension Host manual smoke는 자동 테스트의 대체물이 아니다. 자동 테스트 통과 후 실제 VSCode Extension UX drift를 확인하는 보조 gate로 사용한다.
- `.tasks/plan.md`는 Phase 003 완료 전까지 현재 계획 문서로 유지한다. Phase 003 task 파일은 루트 `.tasks/taskXXX.md`에 둔다.

## 5. Architecture Direction

Phase 003 계층 구조는 계속 다음을 따른다.

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
- Application -> port contracts
- Infrastructure -> Application/Domain contracts
- Scripts -> local files and package metadata
- Tests -> all layers

금지 의존:

- Domain -> VSCode API
- Domain -> filesystem, network, process environment
- Domain -> logger implementation
- Application -> concrete Infrastructure class
- Presentation -> filesystem adapter
- Presentation -> domain policy reimplementation
- Infrastructure -> Presentation
- Use case -> VSCode settings reader
- Use case -> process environment

Phase 003에서 새로 강화할 boundary:

- Diagnostic read model은 Application result 또는 refresh read model에서 온다. Tree mapper는 표시만 한다.
- Analysis persistence는 repository port 뒤에서 수행한다. Analyzer rule은 파일 저장 방식을 모른다.
- Compatibility/shadowing decision은 Domain policy 또는 Application use case에 둔다.
- Open/edit command는 opener port를 통해 실행한다. Presentation은 path를 직접 열지 않는다.
- Release scripts는 product runtime dependency가 아니다.

## 6. Development Principles

### 6.1 TDD Cycle

모든 task는 다음 순서를 따른다.

1. 실패하는 테스트를 작성한다.
2. 테스트가 실제로 실패하는 이유를 task에 기록한다.
3. 최소 구현으로 테스트를 통과시킨다.
4. 중복과 구조 문제를 Tidy First 원칙에 따라 정리한다.
5. 관련 테스트를 먼저 실행한다.
6. `npm test`와 `npm run build`를 실행한다.
7. 실행하지 못한 검증이 있으면 이유와 남은 위험을 기록한다.

### 6.2 Tidy First Rules

다음 변경은 기능 변경 전에 별도 task 또는 명확한 하위 단계로 분리한다.

- diagnostic DTO naming 정리
- read model mapper 분리
- command result message formatter 분리
- analyzer rule helper 추출
- smoke checklist format 정리
- test fixture builder 정리
- manifest/menu assertion helper 정리

Tidy First 변경은 behavior를 바꾸지 않는다.

### 6.3 Configuration Rules

Phase 003에서 새 설정을 추가하지 않는 것을 기본값으로 한다.

허용:

- RuntimeContext에 이미 존재하는 path, target, workspace root, logging mode를 명시적으로 전달한다.
- command input으로 사용자의 명시 선택을 받는다.
- release script는 명시 command-line argument만 사용한다.

거부:

- use case 내부에서 VSCode settings를 읽는 코드
- helper 내부에서 `process.env`를 읽는 코드
- runtime 중간 설정 값을 mutate하는 코드
- hidden singleton으로 repository path, target path, logging mode를 가져오는 코드

### 6.4 Logging Rules

Phase 003에서 모든 새 event는 다음 중 하나로 분류한다.

- Product Log: 사용자 영향이 있는 완료, 차단, 실패
- Field Debug Log: 재현을 위한 제한적 transition/detail
- Development Log: test fixture, local script, smoke execution detail

Product Log 금지 항목:

- full home path
- full workspace path
- full repository path
- `SKILL.md` body
- secret/token/API key
- stack trace 전체
- test fixture internal detail

### 6.5 State Machine Rules

다음 흐름은 최소 explicit steps contract를 가져야 한다.

- analysis persistence
- diagnostic grouping
- compatibility/shadowing calculation
- watcher refresh invalidation
- release candidate gate
- manual smoke execution

filesystem write, confirmation, overwrite, delete, backup, promote를 포함하면 상태머신을 둔다.

### 6.6 Executable Task Rules

Phase 003의 모든 task는 다음 기준을 만족해야 한다.

- 하나의 task는 기능 2~3개 이하만 포함한다.
- 하나의 task는 한 번의 리뷰에서 의도, 테스트, 위험을 파악할 수 있어야 한다.
- 기능 변경 전에 필요한 Tidy First 작업을 먼저 분리한다.
- 같은 task 안에서 정리 작업과 기능 변경이 모두 필요하면 checklist를 `Tidy First`, `Failing Tests`, `Minimal Implementation`, `Post-Implementation Cleanup` 순서로 나눈다.
- task는 변경 대상 계층을 `Domain`, `Application`, `Infrastructure`, `Presentation`, `Scripts`, `Docs` 중에서 명시한다.
- task는 새로운 port가 필요한지, 기존 port 확장인지, adapter만 수정하는지 명시한다.
- task는 external I/O 종류를 `filesystem`, `VSCode API`, `network`, `process environment`, `shell`, `none` 중에서 명시한다.
- task는 Product Log event 이름과 금지 payload를 명시한다. 새 Product Log가 필요 없으면 `No Product Log for success; Product Log only for failure`처럼 명시한다.
- task는 상태머신이 필요한지 판단한다. 필요 없으면 `No state machine; single-step read model mapping only`처럼 이유를 쓴다.
- task는 `npm test`, `npm run build`, 관련 focused test, manual smoke 중 필수 검증을 명시한다.

### 6.7 Reviewable Change Size Rules

다음 기준을 넘으면 task를 더 작게 나눈다.

- Domain policy와 Infrastructure adapter를 동시에 새로 만드는 경우
- Presentation tree model과 filesystem metadata schema를 동시에 변경하는 경우
- settings schema 변경과 use case behavior 변경을 동시에 수행하는 경우
- release script와 product runtime code를 동시에 변경하는 경우
- 3개 이상의 command behavior를 한 task에서 바꾸는 경우
- test fixture 대규모 정리와 user-visible behavior 변경이 같은 task에 들어가는 경우

허용되는 묶음은 다음과 같다.

- DTO naming cleanup + mapper test update
- use case input/output 추가 + fake port test + 최소 adapter 구현
- tree context value 조정 + presentation mapper test + manifest menu validation
- release gate script check + script unit test + documentation update

### 6.8 Required Pre-Implementation Notes

각 task를 시작하기 전에 task 문서 또는 PR 설명에 다음을 기록한다.

```text
Use case:
Changed layers:
External I/O boundary:
RuntimeContext fields used:
New settings:
Product Log events:
Field Debug Log events:
State machine required:
First failing tests:
Manual smoke required:
```

`New settings`는 기본값을 `None`으로 둔다. 새 설정이 필요하면 다음 네 항목을 모두 기록한다.

- 설정이 없을 때의 안전한 기본 동작
- 설정을 최초 수신하는 startup/recomposition 위치
- RuntimeContext 또는 명시적 input으로 전달되는 이름
- 설정 재조회와 런타임 중간 변경을 막는 테스트

## 7. Implementation Phases

### 7.0 Phase Dependency Map

Phase 003은 다음 순서로 진행한다.

| Order | Phase     | Depends On        | Unlocks                          | Primary Output                                      |
| ----- | --------- | ----------------- | -------------------------------- | --------------------------------------------------- |
| 1     | 003.1     | Phase 002 archive | all later Phase 003 tasks         | verified baseline, command/view/docs drift list     |
| 2     | 003.2-A   | 003.1             | 003.2-B, 003.3, 003.6             | diagnostic DTO/read model cleanup                   |
| 3     | 003.2-B   | 003.2-A           | 003.2-C, 003.6                    | persisted analysis metadata port and store          |
| 4     | 003.2-C   | 003.2-B           | 003.3, 003.4, 003.6               | Diagnostics grouping, stale marker, detail action   |
| 5     | 003.3     | 003.2-A           | 003.5                             | source/applied/backup/diagnostic detail read models |
| 6     | 003.4     | 003.2-A, 003.3    | 003.5, 003.7                      | conflict/shadowing/compatibility policy             |
| 7     | 003.5     | 003.3, 003.4      | 003.7                             | consistent destructive operation confirmation UX    |
| 8     | 003.6     | 003.2-B, 003.2-C  | 003.7                             | watcher/analyze/manual refresh race guard           |
| 9     | 003.7     | all previous      | Phase 003 release candidate       | release smoke, docs, release gate readiness         |

Phase 003.2는 반드시 세 개의 reviewable units로 나눈다.

- 003.2-A: DTO, read model, mapper 정리. Behavior를 바꾸지 않는다.
- 003.2-B: analysis metadata port/store와 persistence. Diagnostics grouping을 아직 바꾸지 않는다.
- 003.2-C: Diagnostics Explorer grouping, stale marker, open/detail action. Persistence는 003.2-B 결과만 사용한다.

### 7.0.1 Phase Deliverable Contract

각 Phase는 다음 산출물을 남긴다.

- 실패 테스트 또는 업데이트된 테스트
- 최소 구현 변경
- 필요한 경우 Tidy First 변경 내역
- Product/Field Debug/Development Log 분류
- 상태머신 또는 explicit steps 문서화
- Extension Host에서 확인해야 할 smoke step
- `npm test`와 `npm run build` 결과
- 남은 위험 또는 후속 task 연결

### 7.0.2 File And Layer Impact Guide

Phase별 예상 변경 위치는 다음을 기준으로 한다. 실제 task 작성 시 더 좁은 파일 범위로 줄이는 것을 우선한다.

| Phase       | Domain                                 | Application                                          | Infrastructure                                      | Presentation                                      | Scripts/Docs                        |
| ----------- | -------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------- | ----------------------------------- |
| 003.1       | none                                   | none                                                 | none                                                | command/view inventory only                       | README, release smoke, script tests |
| 003.2-A     | diagnostic value naming if needed      | refresh/analyze DTO mapping                          | none                                                | tree model mapper tests                           | none                                |
| 003.2-B     | stale/risk summary policy              | analysis persistence use case flow                   | filesystem analysis metadata store                  | notification result only                          | none                                |
| 003.2-C     | none or diagnostic grouping value      | diagnostics read model                               | opener port adapter if needed                       | Diagnostics tree grouping and context commands    | manifest validation if menu changes |
| 003.3       | detail semantics and action policy     | detail use cases                                     | opener/file metadata ports                          | detail command renderer and context menus         | README snippets if command changes  |
| 003.4       | conflict/shadowing/compatibility model | refresh/apply preflight mapping                      | target scan data only                               | badges/descriptions/diagnostic display            | docs for interpretation             |
| 003.5       | destructive action policy              | confirmation-required decisions and audit event DTOs | existing filesystem write/remove adapters only      | prompts and command input collection              | smoke checklist                     |
| 003.6       | refresh state value if needed          | invalidation controller and refresh source of truth  | watcher adapter lifecycle                           | provider update scheduling                        | integration/smoke tests             |
| 003.7       | none                                   | none                                                 | none                                                | none unless manifest drift is found               | README, troubleshooting, release gate |

## Phase 003.1. Phase 002 Completion Audit And Product Baseline

* Goal:
  - Phase 002 구현 상태를 제품 기준으로 재평가하고, 현재 구현/문서/테스트의 drift를 제거한다.
* Scope:
  - `.tasks/phase002/` archive verification
  - command inventory
  - manifest/menu/view contribution inventory
  - README and release smoke drift check
  - Extension Host manual smoke baseline
* Required Changes:
  - Phase 002 task list와 현재 command registry를 대조한다.
  - package command contribution과 `src/presentation/command-registry.js`가 1:1로 맞는지 확인한다.
  - README의 사용자 흐름이 현재 UI와 맞지 않는 항목을 수정한다.
  - `.tasks/phase002/release-smoke.md`를 참고해 Phase 003 smoke baseline을 새 `.tasks/release-smoke.md` 또는 plan subsection으로 만든다.
  - 현재 알려진 사용자 피드백을 baseline issue로 정리한다.
  - Diagnostics, Project Skills visibility, Codex/Claude badge, default repository, Git URL/path install, Extension Host run script 흐름을 smoke checklist에 포함한다.
* Architecture Notes:
  - 이 phase는 제품 behavior audit이므로 Domain/Application 기능 변경을 하지 않는다.
  - 문서 수정은 실제 package/command/source 상태와 맞아야 한다.
  - smoke script가 필요하면 Scripts 계층에 둔다.
* TDD Requirements:
  - command registry와 package contribution drift를 검증하는 기존 test를 유지한다.
  - README command list drift test가 없다면 추가를 검토한다.
  - release smoke checklist presence test를 업데이트한다.
* Configuration Rules:
  - audit script는 사용자 VSCode settings를 읽지 않는다.
  - Extension Host manual smoke는 사용자가 선택한 sandbox repository path를 명시한다.
* Logging Rules:
  - audit script output은 Development Log로 취급한다.
  - Product Log runtime behavior를 변경하지 않는다.
* State Management:
  - Audit steps:

    `CollectingCommands -> CollectingViews -> CheckingDocs -> CheckingSmoke -> RecordingGaps -> Completed`
  - Failure states:

    `CommandDrift`, `ViewDrift`, `DocsDrift`, `SmokeGap`
* Validation:
  - `npm test`
  - `npm run build`
  - Extension Development Host manual smoke checklist dry run
* Done Criteria:
  - Phase 002 archive가 보존되어 있다.
  - 현재 root `.tasks/plan.md`가 Phase 003만 설명한다.
  - README, package contribution, command registry, smoke checklist가 충돌하지 않는다.
* Risks:
  - 문서만 고치고 실제 UX 문제를 숨길 수 있다.
  - audit 결과를 다음 task에 연결하지 않으면 계획 문서가 형식적 산출물로 남는다.

## Phase 003.2. Diagnostics Explorer And Analysis Result Persistence

* Goal:
  - Analyze 결과와 refresh/scan diagnostic을 사용자가 신뢰할 수 있는 Diagnostics Explorer로 만든다.
* Scope:
  - diagnostic source attribution
  - category/severity grouping
  - source/applied/target context display
  - analysis result persistence
  - stale analysis marker
  - diagnostic open/detail actions
* Required Changes:
  - `SkillDiagnostic` read model에 `sourceId`, `targetId`, `category`, `severity`, `recommendation`, optional `filePath`, optional `line`, optional `dependencyCount`를 정규화한다.
  - Analyze All Skills 결과를 refresh read model에 일시 병합하는 현재 흐름을 persistence-backed analysis snapshot으로 확장한다.
  - Main Repository 내부 `.sponzey/analysis/`에 저장되는 repository-local analysis metadata port contract를 정의한다.
  - analysis metadata schema는 `schemaVersion`, `skillId`, `sourceHash`, `analyzedAt`, `riskLevel`, `diagnostics`, `dependencies`, `compatibility`, `analyzerVersion`을 포함한다.
  - metadata file 이름은 skill directory name만으로 직접 결정하지 않는다. path traversal과 unsafe character를 막기 위해 normalized skill id 또는 encoded id를 사용한다.
  - metadata schema가 알 수 없는 version이면 refresh를 실패시키지 말고 `analysis.metadata.unsupported-version` diagnostic으로 표시한다.
  - RefreshSkills는 persisted analysis summary를 source read model에 포함한다.
  - Diagnostics tree는 severity 또는 category 기준 grouping을 지원한다.
  - Diagnostics item에서 관련 source `SKILL.md` 열기 또는 source detail 보기 command를 지원한다.
  - watcher가 source file change를 감지하면 persisted analysis와 현재 source hash를 비교해 `analysisStatus: stale`을 표시한다.
  - Analyze notification은 diagnostic count와 Diagnostics view로 이동 가능한 action text를 제공한다.
* Architecture Notes:
  - analyzer rule은 persistence를 모른다.
  - analysis persistence는 SkillRepository 또는 AnalysisStore port 뒤에 둔다.
  - stale 판단은 Domain/Application policy로 둔다.
  - tree grouping은 Presentation mapper 책임이지만 grouping 기준 데이터는 read model에서 제공한다.
* TDD Requirements:
  - Analyze All Skills가 diagnostics를 repository analysis metadata에 저장하는 실패 테스트를 먼저 작성한다.
  - analysis metadata schema에 `schemaVersion`과 `sourceHash`가 없으면 invalid metadata diagnostic을 반환하는 테스트를 작성한다.
  - unsafe skill id가 metadata path traversal로 이어지지 않는 adapter 테스트를 작성한다.
  - RefreshSkills가 persisted risk/diagnostic summary를 source read model에 포함하는 테스트를 작성한다.
  - source hash가 last analyzed hash와 다르면 `analysisStatus: stale`이 되는 테스트를 작성한다.
  - Diagnostics tree grouping mapper 테스트를 작성한다.
  - diagnostic item payload로 `Open SKILL.md`가 source opener port를 호출하는 테스트를 작성한다.
  - malformed analysis metadata가 refresh 실패가 아니라 diagnostic으로 표시되는 테스트를 작성한다.
* Configuration Rules:
  - auto analyze 설정은 이 phase에서 추가하지 않는다.
  - analysis metadata path는 RuntimeContext main repository path에서 파생해 repository port에 전달한다.
  - use case 내부에서 settings를 재조회하지 않는다.
* Logging Rules:
  - `skill.analysis.completed`는 Product Log summary만 기록한다.
  - `analysis.metadata.write.failed`는 Product Log failure event로 반환한다.
  - rule detail과 stale comparison은 Field Debug Log 후보로 제한한다.
  - skill body와 matched secret value는 로그에 기록하지 않는다.
* State Management:
  - Analysis persistence state:

    `LoadingSources -> ReadingSkillFiles -> HashingSources -> RunningRules -> AggregatingDiagnostics -> ValidatingMetadataSchema -> WritingAnalysisMetadata -> RefreshingReadModel -> Completed`
  - Failure states:

    `SourceScanFailed`, `SourceReadFailed`, `SourceHashFailed`, `RuleFailed`, `MetadataSchemaInvalid`, `MetadataWriteFailed`, `ReadModelRefreshFailed`
  - Stale detection state:

    `LoadingSourceMetadata -> HashingSource -> ComparingLastAnalyzedHash -> MappingAnalysisStatus -> Completed`
  - Side effect boundaries:

    - `ReadingSkillFiles` reads through repository port only.
    - `HashingSources` uses hash port only.
    - `WritingAnalysisMetadata` is the only metadata write side effect.
    - `RefreshingReadModel` must not write filesystem state.
* Validation:
  - Analyze 후 Diagnostics view에 diagnostic이 표시된다.
  - Refresh 후에도 persisted analysis summary가 사라지지 않는다.
  - source file 수정 후 stale 상태가 표시된다.
  - unsupported metadata schema가 extension activation을 막지 않는다.
  - `npm test`와 `npm run build`가 통과한다.
* Done Criteria:
  - Diagnostics view는 source/target/category/severity를 식별할 수 있다.
  - Analyze result는 일시 notification에만 의존하지 않는다.
  - stale analysis 상태가 read model에 포함된다.
* Risks:
  - metadata schema를 source directory 내부에 둘지 repository index에 둘지 결정이 필요하다.
  - 초기는 repository-local metadata를 권장하고, index는 cache로만 취급한다.

## Phase 003.3. Skill Detail Read Model And User Action Clarity

* Goal:
  - 사용자가 source/applied/backup/diagnostic item에서 상태와 다음 행동을 명확히 판단하게 한다.
* Scope:
  - source detail
  - applied detail
  - backup detail
  - diagnostic detail
  - action availability rules
  - command result next-action messages
* Required Changes:
  - `Show Skill Detail` output을 source/applied/backup/diagnostic detail union으로 정규화한다.
  - source detail에 description, compatibility, riskLevel, analysisStatus, lastAnalyzedAt, dependencies, appliedTargetCount, sourceHash를 포함한다.
  - applied detail에 target, clientType, scope, applyMode, syncStatus, source link, targetHash, sourceHash, external/managed status를 포함한다.
  - backup detail에 snapshot id, original target, source client type, createdAt, source hash, promoted status를 포함한다.
  - diagnostic detail에 category, severity, sourceId/targetId, recommendation, file location, related commands를 포함한다.
  - tree context menu에서 source/applied/backup/diagnostic에 맞는 command만 노출되도록 `contextValue`를 재점검한다.
  - command result renderer에 next action이 필요한 결과만 짧은 recommendation을 표시한다.
* Architecture Notes:
  - detail composition은 Application use case 책임이다.
  - Presentation은 DTO를 렌더링하거나 VSCode message/open command로 연결한다.
  - filesystem path open은 repository opener port를 사용한다.
  - action availability rule은 Domain/Application policy로 둔다.
* TDD Requirements:
  - source detail DTO 테스트를 작성한다.
  - applied detail DTO 테스트를 작성한다.
  - backup detail DTO 테스트를 작성한다.
  - diagnostic detail DTO 테스트를 작성한다.
  - unsupported context item에서 command input collector가 unavailable result를 반환하는 테스트를 작성한다.
  - command result renderer가 warning/error/info를 정책대로 선택하는 테스트를 보강한다.
* Configuration Rules:
  - detail command는 RuntimeContext와 tree item payload만 사용한다.
  - settings/env를 재조회하지 않는다.
* Logging Rules:
  - detail 조회 성공은 Product Log를 남기지 않는다.
  - detail 조회 실패는 error code와 masked id만 Product Log 후보로 반환한다.
  - detail mapping debug는 기본 비활성 Field Debug Log 후보로 둔다.
* State Management:
  - Detail read state:

    `ResolvingItem -> LoadingRelatedMetadata -> MappingDetail -> Completed`
  - Failure states:

    `UnsupportedItem`, `SourceMissing`, `TargetMissing`, `BackupMissing`, `MetadataInvalid`
* Validation:
  - Extension Host에서 source, applied, backup, diagnostic item 각각에서 detail/open command를 실행한다.
  - tree context menu가 부적절한 명령을 노출하지 않는다.
* Done Criteria:
  - 사용자가 각 item의 의미와 안전한 다음 행동을 이해할 수 있다.
  - detail DTO가 테스트 더블로 검증 가능하다.
* Risks:
  - webview를 만들면 범위가 커진다.
  - Phase 003은 VSCode 기본 editor/message/tree 기반 detail에 한정한다.

## Phase 003.4. Conflict, Shadowing, And Compatibility Policy

* Goal:
  - 같은 이름의 skill이 Main/Global/Project에 동시에 존재할 때 충돌과 shadowing 가능성을 명확하게 표시한다.
* Scope:
  - source/target name conflict
  - project-over-global shadowing
  - Codex/Claude/custom compatibility summary
  - apply preflight warning
  - external skill preservation policy clarity
* Required Changes:
  - Domain policy로 `SkillConflict`와 `SkillShadowing` decision model을 정의한다.
  - RefreshSkills는 same-name source/global/project/applied relationships를 계산해 read model에 conflict summary를 포함한다.
  - Project target이 Global target보다 우선될 수 있는 client에서는 potential shadowing diagnostic을 생성한다.
  - Codex-only, Claude-only, unknown compatibility diagnostic을 apply target selection에 표시한다.
  - external target skill이 같은 이름으로 존재하면 default action은 preserve이고 import/backup/replace 선택지를 명시한다.
  - Diagnostics tree 또는 detail에서 conflict/shadowing category를 확인할 수 있게 한다.
* Architecture Notes:
  - conflict/shadowing policy는 Domain 또는 Application에 둔다.
  - client priority를 알 수 없는 경우 "potential conflict"로 보수적으로 표시한다.
  - Presentation은 badge/description만 표시한다.
* TDD Requirements:
  - project skill이 global skill과 같은 이름일 때 shadowing diagnostic을 반환하는 테스트를 작성한다.
  - global Codex와 Claude에 같은 name이 있어도 client가 다르면 conflict가 아닌 separate target으로 표시되는 테스트를 작성한다.
  - same target same name external folder가 있을 때 apply가 overwrite 없이 block되는 테스트를 유지/보강한다.
  - compatibility warning이 apply command 선택지 description에 표시되는 테스트를 작성한다.
  - custom client target은 unknown compatibility를 warning으로만 표시하는 테스트를 작성한다.
* Configuration Rules:
  - client priority 설정은 Phase 003에서 추가하지 않는다.
  - 기본 priority knowledge는 code policy로 명시하고 unknown은 conservative warning으로 처리한다.
* Logging Rules:
  - conflict detected summary는 Product Log가 아니라 Diagnostics/read model로 표현한다.
  - apply blocked due conflict는 Product Log event다.
  - conflict calculation detail은 Field Debug Log 후보로 둔다.
* State Management:
  - Conflict detection steps:

    `CollectingSources -> CollectingTargets -> GroupingBySkillName -> ApplyingClientPriorityPolicy -> MappingDiagnostics -> Completed`
  - Failure states:

    `TargetScanFailed`, `SourceScanFailed`, `PriorityUnknown`
* Validation:
  - duplicate name fixture로 conflict/shadowing diagnostics를 확인한다.
  - tree description이 너무 길어져 UI가 깨지지 않는지 Extension Host에서 확인한다.
* Done Criteria:
  - 사용자가 같은 이름의 skill이 어디에서 충돌하는지 알 수 있다.
  - external skill preservation policy가 UI와 command result에서 분명하다.
* Risks:
  - agent client priority를 잘못 단정할 수 있다.
  - 모르면 warning으로 표시하고 차단 정책과 분리한다.

## Phase 003.5. Safety Confirmation UX And Destructive Operation Review

* Goal:
  - delete, remove, move, copy update, conversion, backup promote 같은 위험 작업의 confirmation UX를 일관되게 만든다.
* Scope:
  - confirmation DTO taxonomy
  - command input collector prompts
  - Product Log blocked/completed events
  - audit trail payload consistency
  - high/critical risk action messaging
* Required Changes:
  - destructive/overwrite/replace/cleanup confirmation input 이름을 정규화한다.
  - `removeAppliedSkill`, `deleteSourceSkill`, `moveAppliedSkillToMainRepository`, `updateAppliedCopyFromSource`, `convertAppliedSkillMode`, `promoteBackupToSkillSource`, `deleteBackup` confirmation 흐름을 비교한다.
  - confirmation prompt text는 source delete와 target remove를 혼동하지 않게 작성한다.
  - Critical risk block과 High risk confirmation result가 Diagnostics/detail에서 추적 가능해야 한다.
  - audit record에는 operation type, status, diagnostic code, masked references만 남긴다.
* Architecture Notes:
  - confirmation required decision은 Domain/Application에 둔다.
  - Presentation은 사용자의 명시 입력만 수집한다.
  - audit adapter는 primary operation result를 변경하지 않는다.
* TDD Requirements:
  - confirmation 없이 destructive operation이 block되는 use case tests를 재점검한다.
  - command input collector prompt text snapshot 또는 behavior tests를 작성한다.
  - source delete가 target remove로 표시되지 않는 테스트를 작성한다.
  - move cleanup confirmation이 없으면 target cleanup이 실행되지 않는 테스트를 유지한다.
  - audit failure가 primary operation success를 실패로 바꾸지 않는 테스트를 유지한다.
* Configuration Rules:
  - destructive default behavior를 settings로 숨기지 않는다.
  - 모든 위험 선택은 explicit command input으로 전달한다.
* Logging Rules:
  - blocked/completed/failed는 Product Log다.
  - confirmation prompt content는 Development Log에만 테스트 fixture로 둔다.
  - full path와 skill body를 기록하지 않는다.
* State Management:
  - Confirmation state:

    `EvaluatingRisk -> RequiringConfirmation -> ReceivingDecision -> ExecutingOrBlocking -> Completed`
  - Failure states:

    `ConfirmationMissing`, `ConfirmationRejected`, `WriteFailed`, `AuditFailed`
* Validation:
  - Extension Host에서 delete/remove/move/update/convert/promote/delete-backup prompt를 확인한다.
  - prompt text가 사용자의 대상과 결과를 명확히 말한다.
* Done Criteria:
  - 위험 작업 UX가 일관된다.
  - 사용자가 원본 삭제와 적용 해제를 혼동하지 않는다.
* Risks:
  - prompt가 길어지면 사용자가 읽지 않는다.
  - prompt는 짧게 유지하고 detail command로 보완한다.

## Phase 003.6. Watcher Reliability, Refresh Consistency, And Race Guard

* Goal:
  - 파일 변경, Analyze result update, manual refresh, settings recomposition이 서로 read model을 덮어쓰지 않게 한다.
* Scope:
  - watcher debounce integration
  - manual refresh consistency
  - analyze diagnostics persistence interaction
  - settings recomposition watcher disposal
  - duplicate watcher prevention
* Required Changes:
  - Analyze result를 Diagnostics provider에만 일시 주입하는 흐름을 persistence-backed refresh와 정렬한다.
  - watcher refresh가 persisted analysis diagnostics를 보존하는지 테스트한다.
  - settings 변경 후 old watcher가 dispose되는지 확인한다.
  - duplicate watcher registration을 방지하는 integration test를 강화한다.
  - RefreshSkills read model이 source/applied/backup/diagnostics를 항상 같은 source of truth에서 재계산하게 한다.
* Architecture Notes:
  - watcher는 event source일 뿐 read model policy를 결정하지 않는다.
  - refresh use case가 read model source of truth다.
  - recomposition lifecycle은 extension boundary 책임이다.
* TDD Requirements:
  - analyze 후 manual refresh가 diagnostic을 보존하는 테스트를 작성한다.
  - watcher event 후 stale analysis marker가 유지되는 테스트를 작성한다.
  - settings recomposition 후 old watcher dispose가 호출되는 테스트를 작성한다.
  - multiple quick watcher events가 single refresh로 debounce되는 테스트를 유지/보강한다.
* Configuration Rules:
  - watcher target paths는 RuntimeContext에서 받는다.
  - watcher callback 내부에서 settings를 재조회하지 않는다.
* Logging Rules:
  - watcher registration failure는 Product Log failure다.
  - watcher event/debounce detail은 Field Debug Log다.
  - test fake watcher event sequence는 Development Log only다.
* State Management:
  - Refresh state:

    `Idle -> Invalidated -> Debouncing -> Refreshing -> ApplyingReadModel -> Idle`
  - Failure states:

    `WatcherRegistrationFailed`, `RefreshFailed`, `ProviderUpdateFailed`
* Validation:
  - fake watcher integration tests
  - Extension Host manual smoke with source file edit
  - `npm test`
  - `npm run build`
* Done Criteria:
  - manual refresh, analyze, watcher refresh가 Diagnostics/read model을 잃지 않는다.
  - settings recomposition 후 watcher가 중복되지 않는다.
* Risks:
  - 실제 filesystem watcher는 플랫폼별 차이가 있다.
  - adapter smoke는 temp directory로 제한한다.

## Phase 003.7. Release Candidate Packaging And User Documentation

* Goal:
  - Extension을 로컬 사용 가능한 release candidate 수준으로 정리한다.
* Scope:
  - README user flow
  - troubleshooting guide
  - release smoke checklist
  - package manifest validation
  - VSIX packaging readiness
  - Extension Host verification script
* Required Changes:
  - README에 현재 기능을 실제 명령명 기준으로 정리한다.
  - troubleshooting에 `code` command unavailable, default repository creation, Codex/Claude refresh, Diagnostics interpretation, permission failure를 포함한다.
  - `.tasks/release-smoke.md`를 Phase 003 기준으로 새로 작성한다.
  - release gate가 `npm test`, `npm run build`, manifest validation, architecture guard, smoke checklist presence를 실행하는지 확인한다.
  - VSIX packaging command를 도입할지 결정한다. 도입한다면 script는 runtime dependency가 아니어야 한다.
  - Extension Host manual smoke는 Main Repository setup, import/install, apply global/project, analyze diagnostics, backup/promote, remove/delete safety, watcher refresh를 포함한다.
* Architecture Notes:
  - scripts는 product runtime path에 의존하지 않는다.
  - packaging metadata drift는 script tests로 검증한다.
  - docs는 실제 command registry/package manifest와 충돌하지 않는다.
* TDD Requirements:
  - release gate script test를 유지/보강한다.
  - README command list drift test를 추가할 수 있다.
  - manifest icon/command/view/menu validation tests를 유지한다.
  - smoke checklist presence test를 Phase 003 checklist 이름으로 갱신한다.
* Configuration Rules:
  - release script는 user settings를 읽지 않는다.
  - packaging script는 explicit arguments와 local package metadata만 사용한다.
* Logging Rules:
  - release script output은 Development Log로 분류한다.
  - release failure는 machine-readable failure code를 출력한다.
* State Management:
  - Release gate state:

    `CheckingTests -> CheckingArchitecture -> CheckingManifest -> CheckingDocs -> CheckingSmoke -> Completed`
  - Failure states:

    `TestsFailed`, `ArchitectureFailed`, `ManifestFailed`, `DocsFailed`, `SmokeMissing`
* Validation:
  - `npm run release:gate`
  - Extension Development Host manual smoke
  - README command references match package manifest
* Done Criteria:
  - 사용자가 README만 보고 Extension Host에서 핵심 흐름을 재현할 수 있다.
  - release gate가 로컬 release candidate 판단에 충분한 signal을 제공한다.
* Risks:
  - packaging 자동화가 premature하면 제품 UX 결함을 숨길 수 있다.
  - Phase 003에서는 VSIX publishing이 아니라 local release candidate readiness를 목표로 한다.

## 8. Cross-Phase TDD Strategy

Phase 003 테스트 구조는 다음을 유지한다.

```text
Domain tests:
  value object, policy, conflict/shadowing decision, state transition

Application tests:
  use case input/output, fake ports, analysis persistence, diagnostics mapping, safety confirmation

Infrastructure tests:
  filesystem metadata, analysis store, opener, logger, watcher, archive, audit store with temp fixtures

Presentation tests:
  command input collection, command result rendering, tree model, diagnostics grouping, manifest contribution

Extension integration tests:
  activation, command wiring, runtime recomposition, analyze -> diagnostics provider, watcher refresh, tree updates

Scripts tests:
  architecture guard, manifest gate, release gate, smoke checklist presence

Manual smoke:
  Extension Development Host workflows
```

필수 회귀 테스트:

- Domain 계층이 외부 framework에 의존하지 않는다.
- Application 유스케이스가 concrete Infrastructure class를 생성하지 않는다.
- settings/env/workspace roots는 activation 또는 explicit recomposition에서만 수신된다.
- use case 내부에서 settings를 재조회하지 않는다.
- analyzer file content는 repository port 또는 explicit DTO로만 전달된다.
- Diagnostics는 Analyze 후 표시되고 Refresh 후 사라지지 않는다.
- Product Log에는 full path, secret, skill body가 없다.
- watcher event는 debounce되고 duplicate watcher가 생기지 않는다.
- source delete와 applied remove는 계속 분리된다.
- backup은 target을 변경하지 않는다.
- Critical risk apply는 target write 전에 차단된다.

### 8.1 Phase Test Matrix

각 Phase는 다음 테스트를 우선순위대로 작성한다.

| Phase   | First Failing Tests                                                                                 | Minimum Passing Implementation                                                | Regression Guard                                                    |
| ------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 003.1   | command registry와 package contribution drift test, smoke checklist presence test                    | inventory helper 또는 existing script rule 보강                                  | `npm run build` manifest/architecture gates                         |
| 003.2-A | diagnostic DTO mapper가 category/severity/sourceId를 보존하지 못하는 test                             | DTO/read model mapper 정리                                                       | existing tree model tests                                           |
| 003.2-B | Analyze All Skills 후 metadata가 저장되지 않는 use case test                                         | AnalysisStore port와 filesystem metadata adapter 최소 구현                         | malformed metadata adapter tests                                    |
| 003.2-C | refresh 후 persisted diagnostic이 사라지는 integration-style application test                         | RefreshSkills가 persisted summary를 read model에 병합                              | Diagnostics tree grouping tests                                     |
| 003.3   | source/applied/backup/diagnostic detail DTO 누락 test                                                | detail use case union output 최소 구현                                            | command renderer and context value tests                            |
| 003.4   | same-name project/global skill에서 potential shadowing diagnostic이 생성되지 않는 domain/application test | conflict/shadowing policy와 refresh mapping 최소 구현                              | apply preflight overwrite/external preservation tests               |
| 003.5   | destructive command가 confirmation 없이 실행되는 test                                                  | confirmation-required decision과 input collector prompt 정규화                      | audit failure does not fail primary success                         |
| 003.6   | analyze 후 watcher/manual refresh가 diagnostic을 잃는 test                                            | refresh source of truth 정렬과 invalidation controller 보강                          | duplicate watcher disposal/recomposition tests                      |
| 003.7   | release gate가 Phase 003 smoke checklist를 확인하지 못하는 test                                       | release gate script check 보강                                                   | README/package/command drift test if command documentation changes  |

### 8.2 Test Double Requirements

외부 의존성은 다음 test double로 대체 가능해야 한다.

- SkillRepository: source scan, skill read, metadata read/write, backup catalog read/write를 in-memory fake로 대체한다.
- SkillTargetStore: global/project target scan, apply, remove, copy update, mode conversion을 fake로 대체한다.
- AnalysisStore: metadata read/write failure와 unsupported schema를 fake로 재현한다.
- HashPort: sourceHash/targetHash mismatch와 stale 상태를 deterministic value로 재현한다.
- LoggerPort: Product/Field Debug/Development Log event와 payload masking을 캡처한다.
- WatcherPort: quick events, duplicate registration, dispose, recomposition을 fake event stream으로 재현한다.
- OpenerPort: VSCode editor를 실제로 열지 않고 open request만 검증한다.
- SettingsReader/WorkspaceReader: activation/recomposition boundary test에서만 사용하고 use case test에서는 직접 호출하지 않는다.

### 8.3 Mandatory Verification Commands

각 task 완료 시 다음 명령을 기본 검증으로 실행한다.

```text
npm test
npm run build
```

Focused test만 실행하고 전체 검증을 생략하면 task 문서에 다음을 남긴다.

- 생략한 명령
- 생략한 이유
- 남은 위험
- 다음에 반드시 실행할 시점

### 8.4 Manual Smoke Requirements

자동 테스트로 확인하기 어려운 VSCode UX는 Extension Development Host에서 다음을 확인한다.

- Activity Bar icon이 정상 표시된다.
- Main Repository, Global Skills, Project Skills, Diagnostics view visibility가 workspace 상태와 맞다.
- Project folder를 열었을 때 Project Skills view가 보이고, 단일 파일만 열었을 때 Project Skills view가 숨겨진다.
- Main Repository refresh가 filesystem error 없이 동작한다.
- Git URL/path install 결과가 Main Repository에 표시된다.
- source skill을 Global Codex, Global Claude, Project Codex, Project Claude 중 선택 적용할 수 있다.
- applied skill row에 Codex/Claude badge가 folder grouping 없이 표시된다.
- Analyze All Skills 결과가 notification과 Diagnostics view에 모두 반영된다.
- Diagnostics item에서 detail 또는 `SKILL.md` open action이 현재 VSCode instance의 새 탭으로 열린다.
- remove/delete/backup/move/promote prompt가 source와 target을 혼동하지 않는다.
- watcher refresh 후 Diagnostics와 stale marker가 유지된다.

## 9. Configuration And Runtime Environment Policy

Phase 003에서 허용되는 설정 흐름:

```text
Activation or Explicit Recomposition
-> Read VSCode Settings Once
-> Read Workspace Roots Once
-> Validate
-> Normalize
-> Freeze RuntimeContext
-> Inject RuntimeContext And Ports Into Handlers
```

거부되는 설정 흐름:

```text
Use Case
-> read VSCode settings
-> read process.env
-> mutate global config
-> hidden repository path lookup
```

Phase 003에서 새 설정은 추가하지 않는다. 꼭 필요하면 다음 조건을 만족해야 한다.

- 기본 동작이 설정 없이 안전해야 한다.
- 설정은 activation/recomposition에서만 읽는다.
- RuntimeContext field로 명시 전달한다.
- test double로 재현 가능해야 한다.
- 문서와 설정 schema를 함께 갱신한다.

### 9.1 RuntimeContext Handling Rules

RuntimeContext는 다음 흐름으로만 갱신한다.

```text
VSCode activation
  -> settings reader reads once
  -> workspace reader reads once
  -> runtime context builder validates and freezes values
  -> extension composition wires use cases and adapters
```

```text
Explicit settings/workspace recomposition
  -> dispose previous watchers
  -> read settings and workspace roots once
  -> build new RuntimeContext
  -> create new composition
  -> register new watchers
```

금지한다.

- use case 내부 settings reader 호출
- command handler 중간에서 main repository path를 다시 읽는 코드
- analyzer helper가 process environment를 읽는 코드
- watcher callback이 workspace folders를 직접 조회하는 코드
- test가 process environment를 변경해 product behavior를 검증하는 방식

### 9.2 New Setting Exception Template

Phase 003에서 새 설정이 필요하다고 판단되면 먼저 task 문서에 다음 양식을 채운다.

```text
Setting name:
Default behavior without this setting:
Why explicit command input is not enough:
Startup/recomposition read point:
RuntimeContext field:
Use cases receiving this value:
Tests proving no mid-runtime reread:
Docs updated:
```

이 양식을 채우지 못하면 설정을 추가하지 않는다.

### 9.3 Path And Repository Safety Rules

경로 관련 변경은 다음 규칙을 따른다.

- Main Repository는 source repository로만 표시한다.
- Main Repository path가 Global/Project target path와 같거나 그 하위/상위 관계이면 warning 또는 block policy를 명시한다.
- default repository `~/SponzeySkills` 생성은 activation/recomposition boundary 또는 explicit setup command에서만 수행한다.
- use case는 이미 normalize된 repository path value를 받는다.
- path validation 실패는 Product Log에 full path 없이 error code와 masked id만 기록한다.
- UI notification은 full path를 그대로 표시하지 않는다. 사용자가 경로 확인이 필요하면 detail/open action으로 이동시킨다.

## 10. Logging Strategy

Phase 003 Product Log event 후보:

```text
skill.analysis.completed
skill.analysis.failed
analysis.metadata.write.failed
diagnostics.detail.failed
skill.detail.failed
skill.apply.blocked
skill.source.delete.blocked
skill.conflict.detected.blocked
watcher.registration.failed
release.gate.failed
```

Phase 003 Field Debug Log event 후보:

```text
analysis.metadata.transition
diagnostics.grouping.detail
conflict.calculation.detail
shadowing.calculation.detail
watcher.event.received
watcher.debounce.completed
release.gate.step
```

Development Log event 후보:

```text
test.fixture.created
fake.watcher.event
smoke.step.completed
release.fixture.checked
```

민감 정보 정책:

- Product Log에는 full path를 기록하지 않는다.
- Field Debug Log도 masked id 또는 hash prefix만 기록한다.
- `SKILL.md` body와 secret-like matched value는 어떤 로그에도 기록하지 않는다.
- Diagnostics detail에는 file path가 필요할 수 있으나, notification/log에는 전체 경로를 직접 노출하지 않는다.

### 10.1 Product Log Payload Rules

Product Log는 다음 형태의 payload만 허용한다.

```pseudocode
productLog.info("skill.analysis.completed", {
  skillCount,
  diagnosticCount,
  highestSeverity,
  repositoryId
})
```

```pseudocode
productLog.warn("skill.apply.blocked", {
  skillName,
  targetScope,
  clientType,
  reasonCode,
  riskLevel
})
```

Product Log에 다음 payload를 넣지 않는다.

- absolute path
- full workspace path
- full home path
- `SKILL.md` content
- raw diagnostic matched text
- stack trace 전체
- user secret/token/key
- test fixture name

### 10.2 Field Debug Log Activation Rules

Field Debug Log는 기본 비활성이다. 활성화가 필요한 경우 다음 조건을 task와 사용자 문서에 명시한다.

- 활성화 주체: 사용자 명령, 설정, 또는 support 절차 중 하나
- 활성화 범위: analysis, watcher, filesystem operation, release gate 중 하나
- 보존 기간: session only 또는 명시 기간
- masking 기준: repository/workspace/home path를 hash 또는 축약 id로 변환
- 비활성화 절차: session 종료 또는 명시 disable

Field Debug Log는 Product Log를 대체하지 않는다. Product Log에는 사용자 영향 요약을 남기고, Field Debug Log에는 제한된 transition detail만 남긴다.

### 10.3 Development Log Containment Rules

Development Log는 test harness, local script, temporary smoke diagnostic에서만 사용한다.

금지한다.

- product command handler가 Development Log에 의존하는 구조
- Development Log만 보고 실패를 이해해야 하는 Product failure
- production default output channel에 Development Log trace를 상시 출력하는 구조
- test-only branch를 product code에 넣어 Development Log를 켜는 구조

### 10.4 Logging Review Questions

각 task 리뷰에서 다음 질문에 답한다.

- 이 event는 Product, Field Debug, Development 중 어디에 속하는가?
- Product Log failure event가 사용자 영향과 reason code를 설명하는가?
- Field Debug Log가 기본 비활성이고 범위가 제한되는가?
- Development Log가 배포 기본 동작에 포함되지 않는가?
- full path, skill body, secret-like value가 어떤 log에도 포함되지 않는가?
- 상태머신 terminal/failure state와 Product Log event가 연결되어 있는가?

## 11. State Machine Strategy

Phase 003에서 상태머신 또는 explicit steps contract가 필요한 흐름은 다음이다.

| Flow                         | Required Form                                            |
| ---------------------------- | -------------------------------------------------------- |
| analysis persistence         | explicit state list and transition tests                 |
| stale analysis calculation   | explicit steps and policy tests                          |
| conflict/shadowing detection | pure policy tests plus refresh mapping tests             |
| safety confirmation          | state machine or explicit confirmation-required decision |
| watcher refresh              | explicit debounce state tests                            |
| release gate                 | state list and script tests                              |

상태머신 문서에는 다음을 포함한다.

- states
- events
- transition conditions
- failure states
- terminal states
- side effect boundary
- Product Log mapping
- Field Debug Log mapping
- tests

### 11.1 State Machine Template

상태머신 또는 explicit steps contract가 필요한 task는 다음 템플릿을 채운다.

```text
Flow:
Owner layer:
Input:
Output:
States:
Events:
Guards:
Side effects:
Failure states:
Terminal states:
Product Log mapping:
Field Debug Log mapping:
Tests:
```

`Owner layer`는 Domain 또는 Application 중 하나여야 한다. UI, VSCode adapter, filesystem adapter를 owner로 두지 않는다.

### 11.2 Side Effect Boundary Rules

상태 전이 중 외부 I/O가 필요한 경우 다음 규칙을 지킨다.

- filesystem read/write는 Infrastructure adapter가 수행한다.
- Application state machine은 adapter를 port로만 호출한다.
- Domain state machine은 side effect를 직접 실행하지 않고 decision만 반환한다.
- transition test는 side effect 실행 여부를 fake port call로 검증한다.
- 실패 상태는 side effect 이전 실패와 side effect 이후 실패를 구분한다.

예:

```text
CheckingConflict -> RiskBlocked
  Side effect: none
  Product Log: skill.apply.blocked

WritingTarget -> WriteFailed
  Side effect: targetStore.write attempted
  Product Log: skill.apply.failed
  Field Debug Log: skill.apply.transition
```

### 11.3 State Machine Minimum Coverage

상태머신을 도입한 task는 최소 다음 테스트를 포함한다.

- 정상 경로가 terminal completed state로 끝난다.
- 각 guard failure가 지정된 failure state로 전이한다.
- side effect는 허용된 state에서만 호출된다.
- failure state에 대응하는 Product Log event가 생성된다.
- transition detail은 Field Debug Log 후보로만 남는다.
- 상태 전이가 boolean flag 조합으로 우회되지 않는다.

## 12. Dependency And Boundary Rules

### 12.1 Boundary Matrix

| Capability           | Domain                                    | Application                              | Infrastructure                   | Presentation                          |
| -------------------- | ----------------------------------------- | ---------------------------------------- | -------------------------------- | ------------------------------------- |
| Diagnostics Explorer | diagnostic category/severity/source value | map diagnostics to read model            | persisted metadata read/write    | tree grouping and commands            |
| Analysis Persistence | risk/stale policy                         | run analyzer and persist summary         | repository metadata adapter      | notification and refresh trigger      |
| Skill Detail         | detail value semantics                    | compose detail DTO                       | file metadata/opener ports       | render command result and tree action |
| Conflict/Shadowing   | conflict policy                           | collect sources/targets and apply policy | scan sources/targets             | display badge/description             |
| Safety Confirmation  | destructive/overwrite policy              | block/allow decision                     | execute filesystem write/remove  | collect explicit confirmation         |
| Watcher Reliability  | no external dependency                    | refresh invalidation contract            | watcher adapter                  | schedule provider update              |
| Release Gate         | none                                      | none                                     | script filesystem/package checks | none                                  |

### 12.2 Port Rules

Phase 003에서 필요한 port는 다음 원칙을 따른다.

- Analysis metadata read/write는 repository port 또는 별도 analysis store port 뒤에 둔다.
- Opener port는 source/applied/diagnostic detail에서만 호출한다.
- Watcher port 또는 VSCode watcher adapter는 refresh policy를 결정하지 않는다.
- Logger port는 result events만 처리한다.
- SettingsReader/WorkspaceReader는 activation/recomposition boundary에서만 사용한다.

### 12.3 Dependency Validation

각 task 완료 전 다음을 확인한다.

1. Domain에서 VSCode, filesystem, network, process environment import가 없다.
2. Application에서 concrete Infrastructure class 생성이 없다.
3. Presentation에서 filesystem adapter 호출이 없다.
4. Infrastructure에서 UI rendering 또는 command input collector import가 없다.
5. use case 내부에서 settings/env를 읽지 않는다.
6. logger implementation이 Domain으로 들어가지 않는다.
7. external dependency는 fake port로 대체 가능하다.
8. task가 Tidy First인지 기능 변경인지 구분되어 있다.
9. 외부 API, DB, filesystem, network, shell 접근은 Infrastructure 또는 Scripts 경계에만 존재한다.
10. DB가 도입되지 않은 현재 Phase에서는 persistence를 local repository metadata file로 제한한다.
11. network 접근이 필요한 Git URL/path install은 resolver adapter 뒤에 있고 Application test는 fake resolver로 검증한다.
12. VSCode API 접근은 extension boundary, Presentation, Infrastructure VSCode adapter에만 존재한다.
13. command handler가 domain policy를 재구현하지 않고 use case output 또는 policy result를 표시한다.

### 12.4 Architecture Guard Expansion Candidates

Phase 003에서 architecture guard를 확장할 경우 다음 rule을 우선한다.

- `src/domain/**`에서 `vscode`, `fs`, `path`, `child_process`, `process.env` import 또는 접근 금지
- `src/application/**`에서 `src/infrastructure/**` import 금지
- `src/presentation/**`에서 filesystem adapter import 금지
- `src/infrastructure/**`에서 `src/presentation/**` import 금지
- `src/application/**`에서 VSCode settings reader concrete class 생성 금지
- product source에서 test fixture path 문자열 사용 금지

Architecture guard 확장은 Tidy First task로 분리한다. Guard를 추가하면서 동시에 제품 behavior를 바꾸지 않는다.

## 13. Risk And Mitigation

| Risk                                          | Impact                   | Mitigation                                       | Verification                        |
| --------------------------------------------- | ------------------------ | ------------------------------------------------ | ----------------------------------- |
| Analyze diagnostic disappears after refresh   | 사용자가 위험 정보를 놓침           | persistence-backed analysis summary              | analyze -> refresh integration test |
| Diagnostics tree becomes noisy                | 사용자가 원인을 찾기 어려움          | grouping by severity/category/source             | tree mapper tests and manual smoke  |
| source detail exposes full path or skill body | privacy/security issue   | masking in logs, body exclusion in notifications | log tests                           |
| conflict policy over-blocks safe cases        | usability degradation    | warning vs block separation                      | policy tests                        |
| shadowing priority is inaccurate              | wrong user guidance      | conservative potential conflict wording          | fixture tests                       |
| watcher overwrites analysis state             | stale/diagnostics lost   | single refresh source of truth                   | watcher integration test            |
| confirmation text is ambiguous                | accidental delete/remove | prompt text review and tests                     | command input tests                 |
| release gate misses UI regression             | false confidence         | manual smoke checklist with screenshots optional | smoke checklist review              |

## 14. Review Checklist

Architecture:

- Domain remains independent of VSCode/filesystem/network/env.
- Application use cases expose explicit input/output.
- External I/O stays behind ports/adapters.
- Presentation maps read model and collects input only.
- Infrastructure does not decide domain policy.

Configuration:

- Settings are read only at activation/recomposition.
- RuntimeContext is not mutated.
- No hidden singleton config exists.
- Watcher paths come from RuntimeContext.

Diagnostics:

- Diagnostic includes source or target context when available.
- Severity/category/recommendation are preserved.
- Analyze diagnostics persist across refresh when required.
- Diagnostics view does not expose skill body.

Logging:

- Product Log contains only minimal user-impact summary.
- Field Debug Log is disabled by default.
- Development Log is not production default.
- Full paths and secrets are masked or omitted.

State:

- Complex flows have explicit states/steps.
- Failure states are named.
- Terminal/failure states map to Product Log when user-impacting.
- Transition detail is Field Debug only.

Testing:

- Failing tests were written first.
- Fake ports replace external dependencies.
- Adapter tests use temp fixtures only.
- `npm test` and `npm run build` pass.

Product:

- Main Repository remains source-only.
- Global/Project Target remains applied-only.
- Remove and Delete are not mixed.
- Backup does not mutate target.
- External skill preservation is the default.
- Critical risk apply is blocked before target write.

## 15. Definition Of Done

Phase 003 is complete when all of the following are true.

- Phase 002 documents are archived under `.tasks/phase002/`.
- Analyze diagnostics are visible in Diagnostics and persist through refresh according to the chosen metadata strategy.
- Diagnostics can be explored by source/target, severity, and category.
- Skill detail clearly distinguishes source, applied, backup, and diagnostic contexts.
- Compatibility, conflict, and shadowing warnings are visible without destructive side effects.
- Safety confirmation UX is consistent for delete/remove/move/update/convert/promote.
- Watcher refresh, manual refresh, analyze, and recomposition do not lose read model state.
- README and release smoke checklist match current extension behavior.
- Release gate provides enough signal for local release candidate readiness.
- `npm test` passes.
- `npm run build` passes.
- No AGENTS.md architecture/configuration/logging/state-machine rule is violated.

### 15.1 Required Verification Evidence

Phase 003 완료 시 다음 증거를 남긴다.

| Verification Item                                                          | Required Evidence                                                                 |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 도메인 계층이 외부 프레임워크에 의존하지 않는다.                                             | architecture guard output 또는 source import review                                |
| 유스케이스가 명시적 입력과 출력을 가진다.                                                 | use case tests and public input/output DTO review                                  |
| 외부 환경 값이 프로그램 시작 이후 암묵적으로 재조회되지 않는다.                                  | runtime context builder tests and use case grep/review                             |
| 설정 값이 프로세스 중간에 삽입되거나 변경되지 않는다.                                      | recomposition tests and no mutable global config review                            |
| 외부 API, DB, 파일시스템, 네트워크 접근이 경계 계층에만 존재한다.                              | architecture guard and adapter tests                                               |
| 테스트 더블로 외부 의존성을 대체할 수 있다.                                             | fake repository/target/logger/watcher/opener tests                                 |
| 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되어 있다.         | logger route tests and payload masking tests                                       |
| 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.                                        | logger configuration/release gate review                                           |
| 복잡한 내부 흐름이 플래그 조합이 아니라 명시적 상태 전이로 표현된다.                              | state transition tests or explicit steps tests                                     |
| 리팩터링과 기능 변경이 가능한 한 분리되어 있다.                                           | task checklist or commit/review notes                                              |
| Main Repository가 Global Target으로 암묵 취급되지 않는다.                              | source/target tests and Extension Host smoke                                       |
| source delete와 applied remove가 같은 command path로 합쳐지지 않는다.                   | command registry tests and destructive operation tests                             |
| Backup command가 target을 변경하지 않는다.                                          | transfer use case tests                                                            |
| Critical risk skill이 target write 전에 차단된다.                                  | apply preflight tests                                                              |
| Analyze diagnostics가 refresh 이후에도 유지된다.                                      | analyze -> refresh integration-style test                                          |
| watcher refresh가 analysis/stale/read model state를 잃지 않는다.                    | watcher invalidation tests                                                         |

### 15.2 Phase 003 Completion Report Requirements

Phase 003 종료 보고에는 다음을 포함한다.

- 완료한 task 목록
- 실행한 자동 검증 명령과 결과
- 수행한 Extension Host manual smoke 항목
- 남은 known limitation
- AGENTS.md와 충돌했던 계획이 있으면 어떤 기준으로 정리했는지
- release candidate로 볼 수 없는 blocker가 남아 있는지

## 16. Prohibited Implementation Patterns

Do not implement the following.

- Domain importing VSCode API
- Domain reading filesystem/network/environment
- Application creating concrete Infrastructure classes
- Presentation directly opening filesystem paths
- use case reading VSCode settings
- runtime hidden mutable config
- logger singleton access
- analyzer persistence hidden inside rule functions
- conflict/shadowing policy implemented as UI label condition only
- watcher directly mutating tree item arrays
- diagnostics shown only as notifications when persistence is required
- Product Log containing full path, secret, or skill body
- Field Debug Log enabled by default
- source delete and applied remove using same command path
- backup command mutating target
- Main Repository treated as a Global Target
- test-only branch in product code
- feature change without failing test
- large refactor mixed with behavior change

## 17. Next Actions

Execute Phase 003 in the following order.

1. Create `.tasks/task001.md` for Phase 003.1 audit and product baseline.
   - Include command registry vs package contribution verification.
   - Include README, release smoke, Extension Host baseline drift review.
   - Do not change runtime behavior in this task.
2. Create `.tasks/task002.md` for Phase 003.2-A Diagnostics DTO/read model Tidy First cleanup.
   - Include mapper tests for `sourceId`, `targetId`, `category`, `severity`, `recommendation`.
   - Do not add persistence in this task.
3. Create `.tasks/task003.md` for Phase 003.2-B analysis metadata port/store.
   - Include `.sponzey/analysis/` schema, schemaVersion, sourceHash, unsupported metadata handling.
   - Include filesystem adapter tests and fake port use case tests.
4. Create `.tasks/task004.md` for Phase 003.2-C Diagnostics Explorer grouping, stale marker, and open/detail action.
   - Include analyze -> refresh diagnostic preservation.
   - Include Diagnostics tree grouping tests and opener port tests.
5. Create `.tasks/task005.md` for Phase 003.3 source/applied/backup/diagnostic detail read model enrichment.
   - Include context-specific detail DTO tests.
   - Include command context value/menu drift validation if command exposure changes.
6. Create `.tasks/task006.md` for Phase 003.4 conflict/shadowing/compatibility policy.
   - Include potential shadowing warning tests.
   - Include external skill preservation and apply preflight tests.
7. Create `.tasks/task007.md` for Phase 003.5 safety confirmation UX and destructive operation consistency.
   - Include prompt behavior tests for delete/remove/move/update/convert/promote/delete-backup.
   - Include audit payload masking and Product Log blocked/completed/failed tests.
8. Create `.tasks/task008.md` for Phase 003.6 watcher/analyze/manual refresh race guard.
   - Include fake watcher event stream tests.
   - Include settings recomposition watcher disposal tests.
9. Create `.tasks/task009.md` for Phase 003.7 README, troubleshooting, release smoke, and release gate hardening.
   - Include `code` command unavailable troubleshooting.
   - Include Diagnostics interpretation, Codex/Claude refresh, default repository setup, permission failure.
   - Include release gate check for Phase 003 smoke checklist.
10. Do not start registry, marketplace, cloud sync, webview editor, Git version automation, AI rewrite, or OpenAI API upload in Phase 003.

Each task must include:

- Summary
- Scope
- Related Plan Items
- Dependencies
- Architecture Notes
- Functional Requirements
- Non-Functional Requirements
- Implementation Steps
- TDD Checklist
- Validation Checklist
- Logging Requirements
- State Machine Requirements
- Done Criteria

Each task must also include these explicit fields:

- Changed layers
- External I/O boundary
- RuntimeContext fields used
- New settings, default `None`
- Product Log events
- Field Debug Log events
- Development Log usage
- First failing tests
- Manual smoke steps
- AGENTS.md rules checked

Task authors must not mark a checkbox complete unless the related test, implementation, review, or smoke evidence exists. If evidence is not available, leave the checkbox unchecked and record the blocker.
