# Sponzey Skills Manager Phase 004 Development Plan

## 0. Revision Purpose

이 문서는 Phase 003 산출물을 `.tasks/phase003/`에 보관한 뒤 시작하는 다음 개발 단계의 기준 계획이다.

Phase 004는 MVP 기능을 더 많이 붙이는 단계가 아니다. 이미 구현된 Main Repository, Global Skills, Project Skills, Codex/Claude target, import/install, apply/remove, copy/backup/move, promote, analyze, diagnostics, watcher, release gate 흐름을 기반으로 "스킬 원본 관리 도구"가 갖춰야 할 버전 관리, 백업 복구성, 정책 기반 분석, target profile governance를 제품 수준으로 끌어올리는 단계다.

이 계획은 `PROJECT.md`의 제품 정의와 `AGENTS.md`의 개발 운영 원칙을 우선 기준으로 삼는다. 충돌이 발생하면 `AGENTS.md`의 Layered Architecture, Clean Architecture, Tidy First, TDD, 설정 관리, 로그 정책, 상태머신 기준을 우선한다.

Phase 004의 계획 문장은 실행 가능한 개발 지시로 작성한다. 모호한 권장 표현을 작업 지시로 사용하지 않는다. 각 구현 단계는 목적, 범위, required changes, architecture notes, TDD requirements, configuration rules, logging rules, state management, validation, done criteria, risks를 포함한다.

## 1. Project Goal

Sponzey Skills Manager의 최종 목표는 Agent Skills를 안전하고 일관된 방식으로 보관, 분석, 적용, 제거, 회수, 백업하는 VSCode Extension을 제공하는 것이다.

Phase 004의 목표는 다음 네 가지다.

1. Main Repository를 단순 폴더 목록이 아니라 감사 가능하고 복구 가능한 source repository로 만든다.
2. backup snapshot을 단순 보관 항목이 아니라 compare, restore, promote, cleanup이 가능한 lifecycle로 확장한다.
3. Codex, Claude, custom target을 명시적인 target profile로 모델링하여 apply, diagnostics, conflict, compatibility 판단을 일관되게 만든다.
4. analyzer를 단순 위험 표시에서 정책 기반 진단과 remediation 제안까지 확장한다.

Phase 004 완료 후 사용자는 다음 작업을 할 수 있어야 한다.

- Main Repository의 source skill identity, hash, analysis summary, applied target 상태를 신뢰할 수 있는 index로 확인한다.
- source skill 변경, backup snapshot, applied target 변경을 비교하고 복구 또는 승격 여부를 판단한다.
- Codex, Claude, custom target별 compatibility와 shadowing 위험을 apply 전에 확인한다.
- 위험 diagnostic을 Diagnostics view에서 확인하고, 허용된 remediation action을 명확하게 실행한다.
- local release candidate 수준에서 packaging metadata, smoke checklist, release gate evidence를 재현한다.

Phase 004에서 명시적으로 제외하는 항목은 다음이다.

- cloud 기반 스킬 동기화
- public marketplace publish
- 원격 registry 검색 UI 전체 구현
- LLM 기반 skill rewrite 또는 자동 수정
- 스킬 실행 sandbox 구현
- VSCode custom webview editor
- telemetry 또는 외부 분석 서버 전송

## 2. Phase Archive Policy

현재 Phase 003 문서는 다음 위치에 보관한다.

```text
.tasks/
  plan.md                  # 현재 Phase 004 계획
  phase001/
  phase002/
  phase003/
    plan.md
    task001.md
    ...
    task022.md
    release-smoke.md
```

Phase 004 task 파일은 루트 `.tasks/task001.md`, `.tasks/task002.md` 형식으로 새로 생성한다. Phase 003 task 파일을 수정하지 않는다. Phase 003 문서는 사실 오류, 회고 보강, 검증 증거 추가가 필요한 경우에만 변경한다.

Phase 004가 완료되면 루트 `.tasks/plan.md`, `.tasks/task*.md`, `.tasks/release-smoke.md`를 `.tasks/phase004/`로 이동한다.

## 3. Current Implementation Baseline

Phase 004 계획은 현재 구현의 다음 상태를 기준으로 한다.

### 3.1 Implemented Product Capabilities

현재 제품은 다음 기능을 이미 가진 것으로 본다.

- VSCode Activity Bar에 Sponzey Skills view container가 존재한다.
- Main Repository view, Global Skills view, Project Skills view, Diagnostics view가 존재한다.
- folder/workspace가 열린 경우에만 Project Skills view가 노출되도록 manifest condition을 사용한다.
- Main Repository 기본 경로로 `~/SponzeySkills`를 생성하고 사용할 수 있다.
- Main Repository는 source repository이며 global target으로 암묵 취급하지 않는다.
- Main Repository는 `skills/`, `backups/`, `.sponzey/` 구조를 초기화한다.
- Codex global target과 Claude global target을 지원한다.
- project target으로 Codex project path와 Claude project path를 지원한다.
- Global/Project target 등록 시 Codex, Claude, All 선택 흐름을 제공한다.
- Applied Global/Project skill row는 target folder grouping 없이 skill row에 Codex/Claude badge를 표시한다.
- source skill을 global 또는 project target에 symlink/copy mode로 적용할 수 있다.
- applied skill을 target에서 remove할 수 있고 source delete와 구분한다.
- applied skill을 Main Repository로 copy, backup, move할 수 있다.
- backup catalog를 확인하고 backup을 source skill로 promote할 수 있다.
- GitHub URL 또는 local path 기반 skill install 흐름이 존재한다.
- source skill archive export/import 흐름이 존재한다.
- analyzer는 structure, quality, security, dependency, compatibility diagnostic을 생성한다.
- Diagnostics view는 analyze 결과와 refresh diagnostic을 표시한다.
- analyze 결과는 refresh 이후에도 보존될 수 있도록 metadata store가 존재한다.
- watcher debounce, manual refresh, analyze refresh race guard가 도입되어 있다.
- Product Log, Field Debug Log, Development Log 분리 기반이 존재한다.
- release gate script가 test, build, manifest, architecture, smoke checklist를 검증한다.

### 3.2 Current Verification Baseline

Phase 003 종료 시점의 기준 검증은 다음으로 본다.

- `npm test` 통과
- `npm run build` 통과
- `npm run release:gate` 통과
- Extension Development Host manual smoke checklist 존재

Phase 004의 모든 작업은 이 baseline을 낮추지 않는다. 자동 테스트가 통과하더라도 Extension Development Host에서 사용자 흐름이 깨지면 완료로 보지 않는다.

### 3.3 Current Code Boundary

현재 코드 구조는 다음 계층을 기준으로 유지한다.

```text
src/domain/
src/application/
src/infrastructure/
src/presentation/
src/extension-composition.js
src/extension-runtime-session.js
scripts/
test/
```

Phase 004는 이 구조를 유지한다. 새 기능은 아래 책임에 맞게 배치한다.

| Layer          | Allowed Responsibilities                                                                                                           | Forbidden Responsibilities                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Domain         | skill identity, repository index policy, backup lifecycle policy, target profile policy, analyzer policy, state transition rules   | VSCode API, filesystem, git command execution, environment lookup, logger implementation |
| Application    | use case input/output, port orchestration, confirmation decision, state machine execution, Product Log event emission through port | direct VSCode UI calls, direct filesystem calls, direct process/env reads                |
| Infrastructure | filesystem repository, metadata store, hash port, local git capability adapter, archive port, settings reader, logger adapter      | domain policy decisions, tree row formatting                                             |
| Presentation   | tree items, command registry, input collection, notification/action rendering, VSCode opener                                       | business policy, direct metadata mutation                                                |
| Scripts        | release gate, manifest checks, architecture checks, smoke checklist validation                                                     | product runtime behavior                                                                 |

## 4. Current Plan Assessment

### 4.1 Strengths To Preserve

- Main Repository와 applied target의 개념이 분리되어 있다.
- source delete, target remove, backup, copy, move가 명령과 유스케이스에서 구분되어 있다.
- Codex/Claude target 선택과 badge 표시가 존재한다.
- 외부 I/O는 filesystem, VSCode, logger, settings, watcher adapter 뒤에 있다.
- analyzer diagnostic이 tree와 notification에 연결되어 있다.
- watcher refresh와 manual refresh의 source of truth가 정리되어 있다.
- release gate와 smoke checklist가 반복 검증 기반을 제공한다.

### 4.2 Product Gaps To Address

Phase 004에서 해결해야 할 주요 빈틈은 다음이다.

- Main Repository의 source identity가 folder name 중심에 머물면 rename, backup promote, external import, Git diff 시 추적성이 약해진다.
- backup snapshot은 생성과 promote 흐름은 있으나 compare, restore, cleanup, immutable audit 기준이 충분히 명시되어 있지 않다.
- GitHub/path install은 존재하지만 Main Repository 자체의 local Git versioning, status, diff, snapshot commit 흐름은 없다.
- analyzer diagnostic은 생성되지만 built-in policy pack, severity override rule, remediation action contract가 부족하다.
- Codex/Claude/custom target 판단이 여러 흐름에 흩어지면 apply, conflict, diagnostics, badge가 서로 다르게 동작할 위험이 있다.
- Diagnostics view는 문제를 보여주지만 "사용자가 다음에 실행할 수 있는 안전한 행동"이 명확하지 않은 항목이 있다.
- release readiness는 local gate까지 갖췄지만 VSIX 후보 검증과 Extension Host smoke evidence 관리가 아직 제품 릴리스 기준으로 충분하지 않다.

### 4.3 Architecture Risks

Phase 004에서 통제할 위험은 다음이다.

- repository index가 filesystem scan 결과를 중복 저장하면서 stale state를 만들 위험
- Git command execution이 Domain 또는 Application 정책을 오염시킬 위험
- backup restore가 source delete 또는 target overwrite와 혼동될 위험
- policy pack이 외부 설정 파일에 과도하게 의존할 위험
- target profile이 settings reader나 VSCode workspace state에서 암묵적으로 재조회될 위험
- diagnostics remediation action이 위험 작업 confirmation을 우회할 위험
- release packaging script가 network dependency 또는 global tool dependency를 암묵적으로 요구할 위험
- task 작성자가 계획의 추상 원칙을 실제 테스트, 포트, 로그, 상태머신 항목으로 변환하지 않고 체크박스만 생성할 위험
- repository index, Git versioning, backup restore가 같은 metadata 파일을 동시에 갱신하면서 책임 경계가 흐려질 위험

### 4.4 AGENTS.md Alignment Decisions

Phase 004는 다음 결정을 따른다.

| AGENTS.md Principle          | Phase 004 Decision                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Layered Architecture         | repository index, target profile, backup lifecycle, analyzer policy는 Domain/Application에 둔다. VSCode와 filesystem은 adapter에 둔다.                    |
| Clean Architecture           | Git, filesystem, settings, logger, opener, archive, process execution은 port 뒤에 둔다.                                                               |
| Tidy First                   | index read model 정리, target profile naming 정리, backup DTO 정리는 기능 변경 task와 분리한다.                                                                  |
| TDD                          | 모든 의미 있는 기능은 실패 테스트, 최소 구현, 정리 순서로 진행한다.                                                                                                         |
| Configuration Policy         | Phase 004에서 외부 설정 파일을 기본 전제로 삼지 않는다. 설정은 시작 시 1회 읽고 RuntimeContext 또는 use case input으로 전달한다.                                                     |
| Runtime Environment Handling | repository path, workspace roots, target paths, logging mode, packaging capability는 runtime composition에서 수신하고 내부로 명시 전달한다.                      |
| Logging Policy               | repository version event, backup lifecycle event, analyzer policy result, remediation execution은 Product/Field Debug/Development Log 중 하나로 분류한다. |
| State Machine Policy         | backup restore, source promotion, repository snapshot, remediation action은 명시적 상태와 전이 테스트를 가진다.                                                  |

### 4.5 Plan Review Findings And Corrections

이 검토에서 확인한 계획 보강 사항은 다음과 같다. 각 항목은 Phase 004 task 작성 시 반드시 반영한다.

| Finding | Correction Applied To This Plan | Required Verification |
| --- | --- | --- |
| Phase 004용 release smoke checklist가 이미 존재하지만 Phase 004.1 문장은 초안 생성을 후속 작업처럼 설명했다. | Phase 004.1은 checklist 생성이 아니라 현재 `.tasks/release-smoke.md`와 release gate marker의 일치 여부를 검증하도록 수정한다. | task001에서 `.tasks/release-smoke.md`, `scripts/release-gate.mjs`, release smoke checklist test를 대조한다. |
| Phase별 목표는 명확하지만 task로 분해할 때 reviewable unit 기준이 부족했다. | `7.0.1 Reviewable Task Slicing Rules`를 추가해 task 크기와 계층 변경 한계를 고정한다. | 각 task가 기능 2~3개 이하를 포함하고, Tidy First와 behavior change가 분리되어 있는지 리뷰한다. |
| Phase exit gate가 테스트 명령 중심으로만 보일 수 있었다. | `7.0.2 Phase Exit Gates`를 추가해 automated, architectural, runtime, manual smoke, documentation exit gate를 분리한다. | task 완료 보고에 exit gate evidence를 남긴다. |
| AGENTS.md의 설정/로그/상태머신 원칙이 task 작성 중 누락될 수 있었다. | `8.5`, `9.1`, `10.5`, `11.4`에 task별 증거 요구사항과 transition table 기준을 추가한다. | task template의 Related Plan Items와 Done Criteria에 해당 section을 링크한다. |
| Git versioning과 VSIX candidate가 core runtime dependency로 오해될 수 있었다. | Git은 local capability, VSIX는 release candidate validation으로 제한한다고 반복 명시한다. | non-Git repository test와 missing packaging tool scenario test를 요구한다. |

### 4.6 Priority And Non-Negotiable Order

Phase 004는 다음 우선순위를 바꾸지 않는다.

1. Baseline integrity를 먼저 검증한다.
2. Repository Index V2와 stable source identity를 먼저 구현한다.
3. Git versioning, backup lifecycle, analyzer policy, target profile은 Repository Index V2 이후에 진행한다.
4. Diagnostics remediation은 backup lifecycle, analyzer policy, target profile이 안정된 뒤 진행한다.
5. Release candidate readiness는 모든 기능 phase 이후에 진행한다.

다음 작업은 선행 조건 없이 시작하지 않는다.

- `VersionControlPort`는 `RepositoryIndexStore`와 source identity 정책이 정리되기 전에는 구현하지 않는다.
- `RestoreBackupToTarget`은 backup comparison summary와 conflict policy가 테스트되기 전에는 구현하지 않는다.
- Diagnostics remediation action은 allowed action policy와 confirmation route가 테스트되기 전에는 Presentation command에 노출하지 않는다.
- VSIX local candidate script는 release gate가 Phase 004 smoke checklist를 검증하기 전에는 추가하지 않는다.

## 5. Architecture Direction

### 5.1 Target Architecture

Phase 004의 핵심 경계는 다음이다.

```text
Presentation
  -> Application Use Cases
    -> Domain Models / Policies / State Machines
    -> Ports
Infrastructure
  -> Port Implementations
Scripts
  -> Release-time validation only
```

Presentation은 VSCode command, tree, picker, notification을 담당한다. Presentation은 source hash 계산, backup restore 정책, risk severity 결정, Git status 해석을 직접 수행하지 않는다.

Application은 use case를 담당한다. Use case는 명시적 input과 output을 가진다. Use case는 settings를 내부에서 다시 읽지 않는다. Use case는 port를 통해 외부 I/O를 요청하고, Domain policy의 판단을 받아 다음 행동을 결정한다.

Domain은 값 객체, 정책, 상태머신을 담당한다. Domain은 VSCode API, filesystem, Git command, environment variable, logger implementation에 의존하지 않는다.

Infrastructure는 filesystem, Git, archive, logger, settings, VSCode adapter를 담당한다. Infrastructure는 Domain의 판단을 바꾸지 않는다.

### 5.2 New Or Strengthened Ports

Phase 004에서 필요한 port는 다음 후보를 기준으로 설계한다. 실제 추가 여부는 task에서 실패 테스트로 검증한 뒤 결정한다.

| Port                    | Owner Layer  | Implementation Layer                | Purpose                                                                   |
| ----------------------- | ------------ | ----------------------------------- | ------------------------------------------------------------------------- |
| `RepositoryIndexStore`  | Application  | Infrastructure/filesystem           | source identity, hash, applied summary, backup summary metadata를 저장/조회한다. |
| `VersionControlPort`    | Application  | Infrastructure/local-git            | local Git status, diff summary, snapshot commit capability를 제공한다.         |
| `BackupComparisonPort`  | Application  | Infrastructure/filesystem/hash      | backup/source/target hash와 file list 차이를 계산한다.                            |
| `PolicyPackProvider`    | Application  | Infrastructure or built-in module   | built-in analyzer policy pack을 제공한다. 외부 파일 의존을 기본값으로 삼지 않는다.              |
| `TargetProfileProvider` | Application  | Infrastructure/settings-composition | Codex/Claude/custom target profile을 시작 시 구성해 전달한다.                        |
| `ReleaseArtifactPort`   | Scripts only | Scripts                             | VSIX candidate capability를 검증한다. product runtime에서는 사용하지 않는다.             |

### 5.3 Repository Identity Direction

Source skill identity는 folder name만으로 판단하지 않는다. Phase 004에서는 다음 식별자를 분리한다.

- `sourceId`: Sponzey가 부여하는 안정적인 source identity
- `sourceName`: 사용자가 보는 skill folder name
- `sourcePath`: Main Repository 내부 physical path
- `sourceHash`: 현재 source content hash
- `metadataVersion`: repository metadata schema version
- `origin`: created/imported/installed/promoted/copied/moved

기존 source skill에 `sourceId`가 없으면 refresh 또는 index rebuild 단계에서 deterministic migration을 수행한다. Migration은 source content를 변경하지 않거나, 변경이 필요하면 별도 confirmation 또는 metadata-only write policy를 따른다.

### 5.4 Backup Lifecycle Direction

Backup snapshot은 immutable로 취급한다. Backup을 수정하지 않는다. Backup을 source로 승격하거나 target에 restore할 때 새 operation record를 남긴다.

Backup lifecycle action은 다음으로 구분한다.

- `CreateBackup`: target 상태를 Main Repository backup area에 snapshot으로 저장한다.
- `CompareBackup`: backup과 source 또는 target의 file list/hash 차이를 보여준다.
- `PromoteBackupToSource`: backup을 source skill 후보로 생성한다.
- `RestoreBackupToTarget`: backup을 selected target으로 적용한다. 기존 target overwrite는 confirmation 없이는 실행하지 않는다.
- `DeleteBackup`: backup snapshot을 삭제한다. 삭제 전 snapshot id, source target, createdAt을 확인한다.

### 5.5 Analyzer Policy Direction

Analyzer는 다음 레이어로 나눈다.

- structure analyzer: `SKILL.md`, folder structure, metadata consistency
- description quality analyzer: description specificity, automatic invocation risk
- security analyzer: destructive command, secret exfiltration, unsafe path, prompt injection pattern
- dependency analyzer: shell, runtime, MCP, network dependency declaration
- compatibility analyzer: Codex/Claude/custom profile compatibility
- policy evaluator: built-in policy pack을 적용해 severity와 remediation suggestion을 만든다.

Policy evaluator는 외부 config file을 기본값으로 사용하지 않는다. Built-in policy를 코드 내 명시 모델로 둔다. 향후 team policy file을 추가할 경우 Phase 004에서는 설계 hook만 두고 자동 로딩은 도입하지 않는다.

## 6. Development Principles

### 6.1 TDD Cycle

모든 기능 변경은 다음 순서로 수행한다.

1. 실패하는 테스트를 먼저 작성한다.
2. 테스트를 통과하는 최소 구현을 작성한다.
3. 중복, naming, boundary 문제를 정리한다.
4. 전체 test/build/release gate를 실행한다.
5. 필요한 Extension Host manual smoke를 수행한다.

테스트 없이 구현을 먼저 작성하지 않는다. UI command만 바꾸는 작업도 command registry, tree model, command renderer test 중 최소 하나를 먼저 작성한다.

### 6.2 Tidy First Rules

기능 변경 전에 필요한 정리 작업은 별도 task 또는 별도 커밋 단위로 분리한다.

Phase 004에서 허용되는 Tidy First 작업은 다음이다.

- repository index DTO naming 정리
- backup snapshot read model naming 정리
- target profile type naming 정리
- analyzer diagnostic code naming 정리
- command result renderer case 분리
- smoke checklist format 정리

Tidy First 작업은 사용자 visible behavior를 바꾸지 않는다. Behavior가 바뀌면 기능 task로 분리한다.

### 6.3 Configuration Rules

Phase 004에서 새 설정을 추가하지 않는 것을 기본값으로 한다.

새 설정이 반드시 필요하면 다음 조건을 모두 만족한다.

- 설정 목적과 기본값을 task 문서에 적는다.
- 설정은 extension activation 또는 runtime recomposition 시점에 1회 읽는다.
- 읽은 값은 `RuntimeContext`, constructor argument, function argument, use case input 중 하나로 전달한다.
- use case 내부에서 settings reader, process env, global state를 다시 조회하지 않는다.
- 설정 변경 event가 발생하면 새 RuntimeContext를 만들고 새 use case/session에 명시적으로 주입한다.

거부하는 방식은 다음이다.

- use case 중간에 `process.env`, VSCode config, workspace state를 직접 조회한다.
- analyzer policy가 실행 중 외부 file을 암묵적으로 읽는다.
- Git capability를 global constant로 저장하고 runtime 중 변경한다.
- packaging script 결과를 product runtime behavior 결정에 사용한다.

### 6.4 Logging Rules

Phase 004에서 모든 새 log event는 다음 중 하나로 분류한다.

- Product Log: 사용자 영향이 있는 operation completion/failure
- Field Debug Log: 현장 문제 재현에 필요한 제한적 상세 상태
- Development Log: test fixture, local script, smoke execution detail

Product Log는 다음 event 후보를 포함한다.

- `repository.index.rebuilt`
- `repository.index.failed`
- `repository.version.snapshot.created`
- `repository.version.snapshot.failed`
- `backup.compare.completed`
- `backup.restore.completed`
- `backup.restore.blocked`
- `backup.delete.completed`
- `policy.analysis.completed`
- `remediation.action.completed`
- `remediation.action.blocked`

Field Debug Log는 다음 event 후보를 포함한다.

- `repository.index.scan.detail`
- `version.status.detail`
- `backup.compare.detail`
- `policy.rule.matched`
- `target.profile.resolved`
- `remediation.transition.detail`

Development Log는 다음 event 후보를 포함한다.

- `fake.version.port.command`
- `fixture.backup.created`
- `smoke.step.completed`
- `release.artifact.check.detail`

로그 payload는 skill body, full prompt, secret, raw matched sensitive text를 포함하지 않는다. Path는 필요한 경우 repository-relative path 또는 masked path로 기록한다.

### 6.5 State Machine Rules

Phase 004에서 다음 흐름은 명시적 상태머신 또는 explicit steps contract를 가진다.

- repository index rebuild
- repository snapshot creation
- backup compare
- backup restore to target
- backup promote to source
- analyzer policy evaluation
- diagnostic remediation action
- release candidate validation

상태머신은 Domain 또는 Application에 둔다. UI, filesystem adapter, Git adapter에 상태 전이 규칙을 두지 않는다.

상태머신은 최소한 다음 정보를 가진다.

- state
- event
- transition condition
- side effect boundary
- failure state
- terminal state

상태 전이는 테스트 가능해야 한다. Failure state는 Product Log 또는 Field Debug Log 기준과 연결한다.

## 7. Implementation Phases

### 7.0 Phase Dependency Map

Phase 004는 다음 순서로 진행한다.

| Order | Phase | Depends On          | Unlocks                     | Deliverable                                               |
| ----- | ----- | ------------------- | --------------------------- | --------------------------------------------------------- |
| 1     | 004.1 | Phase 003 archive   | all later phases            | baseline verification and drift report                    |
| 2     | 004.2 | 004.1               | 004.3, 004.4, 004.5         | repository index v2 and stable source identity            |
| 3     | 004.3 | 004.2               | 004.8                       | local Git status/snapshot capability behind port          |
| 4     | 004.4 | 004.2               | 004.7                       | backup compare/restore lifecycle                          |
| 5     | 004.5 | 004.2               | 004.6, 004.7                | built-in analyzer policy pack and remediation suggestions |
| 6     | 004.6 | 004.2, 004.5        | 004.7                       | target profile governance and compatibility contract      |
| 7     | 004.7 | 004.4, 004.5, 004.6 | 004.8                       | diagnostics remediation workflow                          |
| 8     | 004.8 | all previous        | Phase 004 release candidate | release gate, smoke evidence, VSIX candidate decision     |

### 7.0.1 Reviewable Task Slicing Rules

Phase 004 task는 다음 기준으로만 분해한다.

- 하나의 task는 기능 2~3개 이하만 포함한다.
- 하나의 task는 하나의 주요 계층 변경을 중심으로 작성한다.
- Domain policy와 Infrastructure adapter를 같은 task에 넣어야 할 경우, 먼저 Domain/Application fake-port test를 작성하고 adapter 구현은 별도 sub-step으로 제한한다.
- Presentation command 노출은 underlying Application use case와 safety confirmation test가 존재한 뒤 별도 task 또는 같은 task의 마지막 step으로만 진행한다.
- Tidy First task는 behavior 변경을 포함하지 않는다.
- Behavior 변경 task는 실패 테스트, 최소 구현, 정리 순서를 task checkbox로 명시한다.
- Release script 또는 documentation task는 product runtime code 변경을 포함하지 않는다.

Task가 다음 조건 중 하나라도 만족하면 더 작은 task로 분리한다.

- Domain, Application, Infrastructure, Presentation을 모두 동시에 변경한다.
- 새 metadata schema와 UI command를 동시에 도입한다.
- filesystem write와 delete를 같은 task에서 새로 추가한다.
- command title, context menu, tree item, use case, adapter, release gate를 한 번에 변경한다.
- 테스트 fixture보다 production code 변경이 먼저 설명되어 있다.

### 7.0.2 Phase Exit Gates

각 Phase는 다음 exit gate를 통과해야 완료로 본다.

Automated gate:

- 관련 focused test가 통과한다.
- `npm test`가 통과한다.
- manifest, command, view, scripts, architecture가 변경된 경우 `npm run build`가 통과한다.
- release checklist 또는 gate가 변경된 경우 `npm run release:gate`가 통과한다.

Architecture gate:

- Domain은 외부 framework, filesystem, process, logger implementation을 import하지 않는다.
- Application은 구체 Infrastructure implementation을 생성하지 않는다.
- Presentation은 domain policy를 재구현하지 않는다.
- Infrastructure는 Presentation tree item 또는 command renderer를 import하지 않는다.

Configuration gate:

- 새 설정이 없으면 task에 "No new setting"을 명시한다.
- 새 설정이 있으면 startup read location, RuntimeContext field, receiving use cases, tests를 명시한다.
- 실행 중 settings, environment, process 값을 재조회하지 않는다.

Logging gate:

- 새 log event는 Product Log, Field Debug Log, Development Log 중 하나로 분류한다.
- Product Log payload allowlist를 벗어나지 않는다.
- Field Debug Log는 기본 비활성 상태를 유지한다.
- Development Log는 production default path에 포함하지 않는다.

State machine gate:

- side effect가 있는 세 단계 이상 흐름은 상태, 이벤트, 전이, guard, failure, terminal state를 문서화한다.
- confirmation 이전 side effect가 없는지 테스트한다.
- terminal failure가 사용자 영향이 있으면 Product Log event를 정의한다.

Manual smoke gate:

- 사용자 visible behavior가 바뀌면 Extension Development Host smoke 항목을 task에 추가한다.
- smoke를 실행하지 못한 경우 exact blocker, command, expected behavior를 기록한다.

### Phase 004.1. Phase 003 Archive And Baseline Integrity

* Goal:
  - Phase 003 산출물이 `.tasks/phase003/`에 보존되어 있고, 현재 root `.tasks/plan.md`가 Phase 004만 설명하도록 정리한다.
  - Phase 004 시작 전에 현재 command/view/script/documentation/test baseline을 고정한다.
* Scope:
  - `.tasks/phase003/` archive verification
  - package command contribution inventory
  - README and release smoke drift inventory
  - current test/build/release gate baseline
* Required Changes:
  - `.tasks/phase003/plan.md`, `.tasks/phase003/task001.md`부터 `.tasks/phase003/task022.md`, `.tasks/phase003/release-smoke.md`가 존재하는지 확인한다.
  - root `.tasks`에는 Phase 004 계획과 Phase 004 task 파일만 두도록 유지한다.
  - command registry와 `package.json` contributes.commands가 1:1로 맞는지 기존 test를 확인한다.
  - README의 사용자 흐름과 실제 command title/icon/view condition이 충돌하지 않는지 문서 test를 유지한다.
  - Phase 004용 `.tasks/release-smoke.md`가 존재하고 `scripts/release-gate.mjs`의 required smoke markers와 일치하는지 확인한다.
  - release smoke checklist test가 Phase 004 필수 section과 product signal을 검증하는지 확인한다.
* Architecture Notes:
  - product runtime code 변경을 기본적으로 포함하지 않는다.
  - script/test 문서 drift 확인은 Scripts/Test 영역에서만 수행한다.
  - Domain/Application/Infrastructure/Persisted metadata를 변경하지 않는다.
* TDD Requirements:
  - 새 behavior가 없으면 새 product test를 추가하지 않는다.
  - release smoke checklist presence test가 Phase 004 checklist 이름을 요구하도록 실패 테스트를 먼저 준비한다.
  - package/command drift가 있으면 기존 manifest test를 먼저 실패하게 만든 뒤 수정한다.
* Configuration Rules:
  - 새 설정을 추가하지 않는다.
  - baseline 검증에서 환경 변수나 외부 path를 product runtime에 주입하지 않는다.
* Logging Rules:
  - product runtime log를 추가하지 않는다.
  - release script detail은 Development Log 또는 script output 영역으로만 남긴다.
* State Management:
  - 상태머신이 필요하지 않다.
  - release gate는 Phase 004.8에서 explicit validation steps contract로 다룬다.
* Validation:
  - `find .tasks/phase003 -maxdepth 1 -type f | sort`
  - `npm test`
  - `npm run build`
  - `npm run release:gate`
* Done Criteria:
  - Phase 003 문서가 `.tasks/phase003/`에 보존되어 있다.
  - root `.tasks/plan.md`는 Phase 004 계획만 포함한다.
  - root `.tasks/release-smoke.md`는 Phase 004 checklist만 포함한다.
  - 현재 baseline 검증 결과를 Phase 004 task001에 기록할 수 있다.
* Risks:
  - Phase 003의 미완료 체크박스가 archive된 경우 다음 phase에서 완료로 오해될 수 있다.
  - task001은 archive 상태와 검증 결과를 명확히 기록한다.

### Phase 004.2. Repository Index V2 And Stable Source Identity

* Goal:
  - Main Repository의 source skill을 folder name이 아니라 안정적인 identity와 index metadata로 추적한다.
  - rename, import, promote, backup restore, Git diff, diagnostics persistence가 같은 source를 일관되게 참조하게 만든다.
* Scope:
  - repository index schema v2
  - stable `sourceId`
  - source hash summary
  - source origin tracking
  - index rebuild use case
  - stale or unsupported metadata diagnostic
* Required Changes:
  - Domain에 `SkillSourceIdentity`, `RepositoryIndexEntry`, `RepositoryIndexPolicy`를 정의한다.
  - Application에 `RebuildRepositoryIndex` 또는 기존 refresh use case의 index rebuild step을 명시한다.
  - Infrastructure에 repository-local `.sponzey/index` 또는 기존 metadata store 확장을 구현한다.
  - source skill에 기존 metadata가 없으면 `sourceId`를 부여하는 migration path를 만든다.
  - migration은 source skill body를 변경하지 않는다. metadata write가 필요한 경우 metadata path에만 기록한다.
  - unsupported schema version은 refresh 실패가 아니라 Diagnostics item으로 표시한다.
  - source list read model에 `sourceId`, `sourceHash`, `origin`, `indexStatus`, `lastIndexedAt`을 포함한다.
* Architecture Notes:
  - Domain은 filesystem path를 문자열 값으로 보유할 수 있으나 filesystem API를 호출하지 않는다.
  - RepositoryIndexStore는 Application port로 두고 filesystem 구현은 Infrastructure에 둔다.
  - Presentation은 index DTO를 표시만 한다. sourceId 생성, hash 비교, schema migration 판단을 하지 않는다.
  - HashPort는 Infrastructure 구현을 사용하고 테스트에서는 deterministic fake로 대체한다.
* TDD Requirements:
  - `sourceId`가 없는 기존 source skill을 refresh하면 stable identity가 생성되는 실패 테스트를 작성한다.
  - 같은 folder name rename scenario에서 metadata가 유지되는지 또는 새 source로 처리되는지 정책 테스트를 작성한다.
  - unsupported index schema version이 refresh failure가 아니라 diagnostic으로 반환되는 테스트를 작성한다.
  - source hash 변경 시 `indexStatus: stale` 또는 equivalent read model 값이 생성되는 테스트를 작성한다.
  - RepositoryIndexStore filesystem 구현은 temp directory 기반 test로 검증한다.
* Configuration Rules:
  - index metadata path는 Main Repository path에서 파생한다.
  - index path를 외부 설정으로 추가하지 않는다.
  - Main Repository path는 runtime composition에서 받은 값을 use case input 또는 RuntimeContext로 전달한다.
* Logging Rules:
  - index rebuild 성공/실패는 Product Log로 기록한다.
  - scan detail, migrated entry count, unsupported schema detail은 Field Debug Log로 기록한다.
  - test fixture index write는 Development Log 범위로 제한한다.
* State Management:
  - Repository index rebuild state:
    - `Idle`
    - `ScanningRepository`
    - `ReadingExistingIndex`
    - `ComputingIdentity`
    - `ComputingHash`
    - `WritingIndex`
    - `Completed`
    - `Failed`
  - Filesystem write side effect는 `WritingIndex`에서만 발생한다.
  - Failure state는 partial index write를 숨기지 않고 diagnostic으로 반환한다.
* Validation:
  - focused repository index tests
  - `npm test`
  - `npm run build`
  - Extension Host에서 Main Repository refresh 후 source row가 사라지지 않는지 확인한다.
* Done Criteria:
  - source skill row와 diagnostics가 `sourceId`를 통해 같은 source를 참조한다.
  - 기존 Main Repository가 metadata 없이도 refresh 가능하다.
  - unsupported metadata가 전체 refresh를 중단하지 않는다.
  - Domain이 filesystem, VSCode, logger 구현체에 의존하지 않는다.
* Risks:
  - metadata migration이 사용자 skill folder를 오염시킬 수 있다.
  - metadata write 위치를 `.sponzey/` 아래로 제한하고 source body를 변경하지 않는다.

### Phase 004.3. Local Git Repository Versioning

* Goal:
  - Main Repository를 local Git repository로 사용할 때 source changes, backup changes, metadata changes를 확인하고 snapshot commit 후보를 만들 수 있게 한다.
  - Git은 core runtime requirement가 아닌 local capability이며 Main Repository가 Git repo가 아니어도 core 기능이 동작해야 한다.
* Scope:
  - Git availability detection
  - repository status summary
  - source diff summary
  - snapshot commit use case
  - no-network local-only Git flow
* Required Changes:
  - Application port `VersionControlPort`를 정의한다.
  - Infrastructure에 local Git implementation을 둔다.
  - Git command execution은 Infrastructure 밖으로 노출하지 않는다.
  - `GetRepositoryVersionStatus` use case를 추가하거나 repository detail read model에 version status를 포함한다.
  - `CreateRepositorySnapshot` use case는 explicit input으로 commit message 후보와 included paths를 받는다.
  - snapshot commit은 사용자가 명시적으로 실행할 때만 수행한다.
  - Git이 없거나 repository가 Git repo가 아니면 failure가 아니라 `versioningUnavailable` 상태로 표시한다.
* Architecture Notes:
  - Domain은 Git command, process execution, `.git` directory를 직접 알지 않는다.
  - Application은 port result를 `VersionStatus` value로 정규화한다.
  - Presentation은 version status 표시와 command 실행만 담당한다.
  - Scripts release gate는 product Git capability와 분리한다.
* TDD Requirements:
  - Git unavailable fake port result가 UI-blocking error가 아니라 status item으로 표시되는 테스트를 작성한다.
  - dirty repository fake result가 changed source count, backup count, metadata count로 매핑되는 테스트를 작성한다.
  - snapshot commit use case가 empty change set이면 commit을 실행하지 않는 테스트를 작성한다.
  - snapshot commit use case가 confirmation 없이 실행되지 않는 테스트를 작성한다.
  - infrastructure Git implementation은 temp Git repo가 사용 가능할 때만 adapter test로 제한한다. Git binary 부재 시 test는 deterministic fake를 사용한다.
* Configuration Rules:
  - Git binary path를 새 설정으로 추가하지 않는다.
  - Git availability는 startup/runtime composition 시 capability로 판단하고 use case에 명시 전달한다.
  - process env를 use case 내부에서 읽지 않는다.
* Logging Rules:
  - snapshot commit 성공/실패는 Product Log로 기록한다.
  - Git status raw detail은 Field Debug Log로 제한하고 full diff body를 Product Log에 남기지 않는다.
  - fake Git command는 Development Log 범위로만 기록한다.
* State Management:
  - Repository snapshot state:
    - `EvaluatingCapability`
    - `ReadingStatus`
    - `RequiringConfirmation`
    - `CreatingSnapshot`
    - `Completed`
    - `Unavailable`
    - `Blocked`
    - `Failed`
  - `CreatingSnapshot` 이전에는 Git write side effect를 실행하지 않는다.
* Validation:
  - focused versioning use case tests
  - fake port tests
  - `npm test`
  - `npm run build`
  - Extension Host에서 Git repo가 아닌 Main Repository가 정상 표시되는지 확인한다.
* Done Criteria:
  - Git이 없는 환경에서도 Main Repository, apply, backup, analyze가 계속 동작한다.
  - Git repo에서는 changed summary가 표시된다.
  - snapshot commit은 명시적 confirmation 이후에만 실행된다.
* Risks:
  - Git 기능이 core skill management 실패로 전파될 수 있다.
  - VersionControlPort failure는 repository diagnostic으로 변환하고 core refresh를 중단하지 않는다.

### Phase 004.4. Backup Compare, Restore, And Lifecycle Governance

* Goal:
  - Backup snapshot을 생성/목록/promote에서 compare/restore/delete governance까지 확장한다.
  - Backup은 destructive action이 아니며, restore와 delete는 명시 confirmation이 필요한 별도 작업으로 유지한다.
* Scope:
  - backup-source compare
  - backup-target compare
  - restore backup to selected target
  - backup lifecycle audit record
  - immutable backup metadata validation
* Required Changes:
  - Domain에 `BackupLifecyclePolicy`와 `BackupComparisonSummary`를 정의한다.
  - Application에 `CompareBackup`, `RestoreBackupToTarget`, `ValidateBackupSnapshot` use case를 추가한다.
  - 기존 promote flow는 backup lifecycle policy와 같은 confirmation/audit vocabulary를 사용한다.
  - backup metadata에 snapshot id, createdAt, original target, original client type, source hash, file count, schema version을 검증한다.
  - restore target에 같은 name의 existing skill이 있으면 overwrite confirmation 없이는 target write를 실행하지 않는다.
  - restore는 Main Repository source를 변경하지 않는다. Source 생성은 promote command만 수행한다.
  - backup delete는 snapshot id와 createdAt을 confirmation prompt에 포함한다.
* Architecture Notes:
  - backup comparison은 hash/file list port를 사용한다.
  - filesystem copy/delete는 Infrastructure target/repository store 구현에서만 수행한다.
  - UI는 backup compare result를 표시하고 허용된 command만 노출한다.
  - audit store는 Application port로 호출하고 Infrastructure에서 파일로 저장한다.
* TDD Requirements:
  - backup과 source가 동일한 경우 `InSync` comparison result를 반환하는 테스트를 작성한다.
  - backup과 target file list가 다른 경우 added/removed/changed count를 반환하는 테스트를 작성한다.
  - restore target에 external folder가 있으면 confirmation 없이 blocked되는 테스트를 작성한다.
  - restore가 source repository를 변경하지 않는 테스트를 작성한다.
  - delete backup이 audit record를 남기는 테스트를 작성한다.
  - malformed backup metadata가 restore 실패 전에 diagnostic으로 표시되는 테스트를 작성한다.
* Configuration Rules:
  - backup path는 Main Repository의 기존 backup area에서 파생한다.
  - backup retention 설정을 Phase 004에서 새로 추가하지 않는다.
  - restore target은 command input으로 명시적으로 받는다.
* Logging Rules:
  - backup compare completion은 Product Log 또는 Field Debug Log 중 사용자 영향 기준으로 분류한다. 단순 compare 성공은 Product Log를 과도하게 늘리지 않는다.
  - restore completed/blocked/failed는 Product Log로 기록한다.
  - file-level diff detail은 Field Debug Log로 제한한다.
  - backup body 또는 skill content는 로그에 남기지 않는다.
* State Management:
  - Backup restore state:
    - `ReadingBackup`
    - `ValidatingMetadata`
    - `SelectingTarget`
    - `CheckingConflict`
    - `RequiringConfirmation`
    - `WritingTarget`
    - `WritingAudit`
    - `Completed`
    - `Blocked`
    - `Failed`
  - `WritingTarget` 이전에는 target filesystem mutation을 실행하지 않는다.
  - `Blocked`는 overwrite denied, invalid metadata, critical diagnostic, unsupported target을 구분한다.
* Validation:
  - focused backup lifecycle tests
  - temp directory filesystem tests
  - `npm test`
  - `npm run build`
  - Extension Host에서 backup compare, restore prompt, delete prompt를 확인한다.
* Done Criteria:
  - backup compare result가 source/target 차이를 명확히 보여준다.
  - restore는 confirmation 없이 existing target을 덮어쓰지 않는다.
  - backup snapshot은 restore/promote 과정에서 수정되지 않는다.
  - backup lifecycle audit record가 생성된다.
* Risks:
  - restore와 promote가 사용자에게 같은 동작처럼 보일 수 있다.
  - command title, prompt, detail text에서 "restore to target"과 "promote to source"를 명확히 분리한다.

### Phase 004.5. Built-In Policy Pack And Advanced Analyzer

* Goal:
  - Analyzer를 위험 문자열 탐지 수준에서 built-in policy pack 기반 진단으로 확장한다.
  - diagnostic마다 severity, category, evidence summary, recommendation, allowed remediation action을 제공한다.
* Scope:
  - built-in analyzer policy model
  - dependency declaration normalization
  - security rule expansion
  - compatibility policy connection
  - remediation suggestion contract
* Required Changes:
  - Domain에 `AnalyzerPolicy`, `PolicyRule`, `PolicyFinding`, `RemediationSuggestion` value를 정의한다.
  - Built-in policy pack은 코드 내부 명시 모델로 둔다.
  - External policy file 자동 로딩은 도입하지 않는다.
  - dependency analyzer는 shell command, runtime tool, MCP/tool dependency, network dependency를 분류한다.
  - security analyzer는 destructive operation, broad filesystem access, secret exfiltration wording, prompt injection wording, hidden download/install instruction을 구분한다.
  - description quality analyzer는 overly generic description과 unsafe auto-invocation phrase를 diagnostic으로 반환한다.
  - analyzer output은 Diagnostics view와 persisted analysis metadata에 동일한 normalized code를 사용한다.
* Architecture Notes:
  - Domain policy는 text pattern과 severity decision을 담을 수 있다.
  - file read는 Application/Infrastructure adapter에서 수행한다.
  - policy evaluator는 skill content input을 받아 pure result를 반환하게 만든다.
  - Presentation은 remediation suggestion을 command availability로 매핑한다.
* TDD Requirements:
  - destructive shell instruction fixture가 Critical 또는 High finding을 반환하는 테스트를 작성한다.
  - dependency declaration이 tool/runtime/MCP/network category로 정규화되는 테스트를 작성한다.
  - overly generic description fixture가 quality diagnostic을 반환하는 테스트를 작성한다.
  - analyzer metadata persisted output이 policy rule code와 analyzerVersion을 포함하는 테스트를 작성한다.
  - Critical risk apply가 target write 전에 계속 차단되는 regression test를 유지한다.
* Configuration Rules:
  - policy pack은 외부 파일 설정에 의존하지 않는다.
  - policy version은 code constant가 아니라 analyzer output metadata의 explicit value로 전달한다.
  - blockCriticalRiskApply 등 기존 설정을 사용한다면 runtime composition에서 1회 읽고 use case input으로 전달한다.
* Logging Rules:
  - policy analysis completed summary는 Product Log 후보이다.
  - matched rule code와 count는 Field Debug Log로 기록할 수 있다.
  - matched raw text와 skill body는 로그에 남기지 않는다.
* State Management:
  - Policy evaluation state:
    - `ReadingSkill`
    - `ParsingSkillMetadata`
    - `EvaluatingStructure`
    - `EvaluatingSecurity`
    - `EvaluatingDependencies`
    - `EvaluatingCompatibility`
    - `PersistingAnalysis`
    - `Completed`
    - `Failed`
  - `PersistingAnalysis` 실패는 analyze result를 사용자에게 표시하되 persisted state diagnostic을 함께 반환한다.
* Validation:
  - focused analyzer policy tests
  - analyzer integration tests with fixture skills
  - `npm test`
  - `npm run build`
  - Extension Host에서 Analyze All Skills 후 Diagnostics view에 policy code와 recommendation이 표시되는지 확인한다.
* Done Criteria:
  - diagnostic code가 analyzer, persisted metadata, tree item에서 일관된다.
  - Critical/High/Medium/Low severity가 policy rule 기준으로 산출된다.
  - dependency diagnostic이 사용자가 이해할 수 있는 category와 recommendation을 포함한다.
  - 외부 policy file 없이 기본 analyzer가 동작한다.
* Risks:
  - pattern matching이 과도하게 false positive를 만들 수 있다.
  - severity와 recommendation을 테스트 fixture로 고정하고, Field Debug Log로 rule count만 추적한다.

### Phase 004.6. Target Profile Governance And Compatibility Contract

* Goal:
  - Codex, Claude, custom target을 명시적 target profile로 모델링하여 apply, scan, conflict, shadowing, diagnostics, badges가 같은 규칙을 사용하게 한다.
* Scope:
  - target profile domain model
  - global/project target compatibility
  - project workspace target visibility
  - badge mapping
  - conflict and shadowing policy reuse
* Required Changes:
  - Domain에 `TargetProfile`, `AgentClientType`, `TargetScope`, `TargetCompatibility`를 정의하거나 기존 모델을 정리한다.
  - Codex profile은 global path와 project relative path를 명시한다.
  - Claude profile은 global path와 project relative path를 명시한다.
  - Custom profile은 unknown compatibility를 warning으로 표시하되 default block으로 취급하지 않는다.
  - All 선택은 Codex와 Claude target profiles를 명시적으로 확장한 결과로 처리한다.
  - Presentation tree badge는 profile에서 제공되는 client type을 표시한다. Folder grouping을 되돌리지 않는다.
  - Project Skills view는 workspace folder가 있을 때만 표시한다. file-only window에서는 표시하지 않는다.
* Architecture Notes:
  - target profile resolution은 runtime composition에서 수행하고 Application에 명시 전달한다.
  - Use case는 settings reader 또는 VSCode workspace를 직접 조회하지 않는다.
  - Presentation은 `contextValue`, icon, label, description 매핑만 담당한다.
  - Domain policy는 target priority를 모르는 경우 `potential` conflict로 표시한다.
* TDD Requirements:
  - All 선택이 Codex와 Claude target commands로 확장되는 테스트를 작성한다.
  - Codex-only skill을 Claude target에 적용하려 할 때 compatibility warning이 생성되는 테스트를 작성한다.
  - custom target이 unknown compatibility warning을 생성하되 default block되지 않는 테스트를 작성한다.
  - file-only workspace manifest condition이 Project Skills view를 숨기는 manifest test를 유지한다.
  - tree item이 target folder grouping 없이 skill row badge를 표시하는 regression test를 유지한다.
* Configuration Rules:
  - default target path는 startup/runtime composition에서 resolve한다.
  - target profile을 command 실행 중 settings에서 다시 읽지 않는다.
  - custom target 추가가 필요하면 command input으로 명시 수신하고 runtime context 또는 target repository state로 전달한다.
* Logging Rules:
  - target profile registration completed/failed는 Product Log로 기록한다.
  - profile resolution detail은 Field Debug Log로 기록한다.
  - test fake profile resolution은 Development Log로만 기록한다.
* State Management:
  - Target registration state:
    - `CollectingClientSelection`
    - `ResolvingProfile`
    - `ValidatingPath`
    - `CheckingOverlap`
    - `WritingTargetRegistration`
    - `RefreshingViews`
    - `Completed`
    - `Blocked`
    - `Failed`
  - overlap with Main Repository는 `Blocked` 또는 warning policy로 명시한다.
* Validation:
  - focused target profile tests
  - command input collector tests
  - tree model tests
  - manifest tests
  - `npm test`
  - `npm run build`
  - Extension Host에서 Codex/Claude/All 등록과 badge 표시를 확인한다.
* Done Criteria:
  - target profile logic이 apply, scan, diagnostics, badge에서 동일하게 사용된다.
  - Project Skills view visibility가 folder/workspace 상태와 일치한다.
  - custom target은 unknown compatibility로 표시되지만 core flow를 깨지 않는다.
* Risks:
  - target profile abstraction이 과해져 기존 간단한 Codex/Claude 흐름을 복잡하게 만들 수 있다.
  - 기존 use case를 먼저 Tidy First로 정리하고, behavior 변경은 compatibility test로 보호한다.

### Phase 004.7. Diagnostics Remediation Workflow

* Goal:
  - Diagnostics view를 단순 문제 목록에서 안전한 다음 행동을 제공하는 workflow로 확장한다.
  - Remediation action은 위험 작업 confirmation과 backup lifecycle policy를 우회하지 않는다.
* Scope:
  - diagnostic detail action contract
  - allowed remediation mapping
  - remediation confirmation
  - remediation audit event
  - diagnostic resolution status
* Required Changes:
  - `SkillDiagnostic` read model에 `allowedActions`, `blockedActions`, `resolutionStatus`를 추가한다.
  - remediation action 후보는 `Open SKILL.md`, `Analyze Again`, `Backup Before Remove`, `Compare Backup`, `Restore Backup`, `Promote Backup`, `Remove Applied Skill`, `Set Main Repository`처럼 안전하게 분리한다.
  - destructive or mutating remediation은 기존 confirmation use case를 반드시 통과한다.
  - diagnostic action이 target write/delete를 직접 수행하지 않는다.
  - action 실행 결과는 diagnostic refresh를 트리거하되 기존 persisted analysis를 무조건 삭제하지 않는다.
* Architecture Notes:
  - Domain은 diagnostic code와 allowed action policy를 결정한다.
  - Application은 action execution을 use case로 라우팅한다.
  - Presentation은 context menu와 command palette action만 노출한다.
  - Opener port는 file open action에서만 사용한다.
* TDD Requirements:
  - Critical risk diagnostic이 `Apply` remediation을 제공하지 않는 테스트를 작성한다.
  - missing main repository diagnostic이 `Set Main Repository` action을 제공하는 테스트를 작성한다.
  - backup-related diagnostic이 `Compare Backup` action을 제공하는 테스트를 작성한다.
  - remediation action이 remove/delete confirmation 없이 mutation을 실행하지 않는 테스트를 작성한다.
  - action result가 Diagnostics view refresh를 발생시키는 command renderer/tree provider 테스트를 작성한다.
* Configuration Rules:
  - remediation action availability는 외부 설정 파일에서 읽지 않는다.
  - block/warn risk policy는 runtime context에서 받은 값만 사용한다.
  - action execution 중 settings를 재조회하지 않는다.
* Logging Rules:
  - remediation action completed/blocked/failed는 Product Log로 기록한다.
  - action routing detail과 diagnostic code는 Field Debug Log로 기록한다.
  - raw skill content는 로그에 포함하지 않는다.
* State Management:
  - Remediation action state:
    - `ReadingDiagnostic`
    - `ResolvingAllowedAction`
    - `CheckingRisk`
    - `RequiringConfirmation`
    - `ExecutingUseCase`
    - `RefreshingDiagnostics`
    - `Completed`
    - `Blocked`
    - `Failed`
  - `ExecutingUseCase` 이전에는 external side effect를 수행하지 않는다.
* Validation:
  - focused remediation policy tests
  - command registry/context menu tests
  - tree data provider tests
  - `npm test`
  - `npm run build`
  - Extension Host에서 Diagnostics item의 action visibility와 confirmation을 확인한다.
* Done Criteria:
  - Diagnostics item은 가능한 다음 행동을 명확히 제공한다.
  - 위험 remediation은 confirmation 없이 실행되지 않는다.
  - action 완료 후 Diagnostics view가 현재 상태와 일치한다.
* Risks:
  - Diagnostics view가 너무 많은 command로 복잡해질 수 있다.
  - action은 severity/category별 최소 세트로 제한하고, command title은 목적을 명확히 표시한다.

### Phase 004.8. Release Candidate Packaging And Smoke Evidence

* Goal:
  - Phase 004 결과를 local release candidate로 검증할 수 있게 release gate, smoke checklist, packaging metadata를 강화한다.
  - VSIX publishing은 하지 않는다. Local VSIX candidate 생성 가능성만 검토한다.
* Scope:
  - Phase 004 release smoke checklist
  - release gate update
  - manifest/package metadata validation
  - VSIX candidate script decision without runtime or network dependency
  - Extension Host smoke evidence template
* Required Changes:
  - `.tasks/release-smoke.md`를 Phase 004 기준으로 작성한다.
  - smoke checklist에는 repository index, Git unavailable handling, backup compare/restore, policy analyzer, target profile registration, diagnostic remediation, watcher refresh를 포함한다.
  - release gate가 Phase 004 smoke checklist 존재와 필수 section을 검증하게 한다.
  - packaging metadata validation은 icon, publisher, displayName, categories, commands, views, view/title menus, activation behavior를 확인한다.
  - VSIX candidate script를 도입할 경우 product runtime dependency로 추가하지 않는다.
  - VSIX 생성 도구가 없으면 release gate가 network install을 시도하지 않고 actionable skip/failure reason을 출력한다.
* Architecture Notes:
  - Scripts는 product runtime에 의존하지 않는다.
  - Release artifact generation은 Domain/Application/Infrastructure/Presentation 계층에 영향을 주지 않는다.
  - Extension Host smoke evidence는 문서와 script validation만 담당한다.
* TDD Requirements:
  - release smoke checklist presence test가 Phase 004 필수 항목 누락 시 실패하도록 작성한다.
  - manifest validation test가 새 command/view/menu drift를 잡도록 유지한다.
  - release gate test가 `npm test`, `npm run build`, manifest check, smoke checklist check를 포함하는지 확인한다.
  - VSIX script를 추가하면 missing tool scenario를 deterministic test로 검증한다.
* Configuration Rules:
  - packaging tool path를 product 설정으로 추가하지 않는다.
  - release script는 command-line input만 사용한다.
  - product runtime에서 release environment value를 읽지 않는다.
* Logging Rules:
  - release script output은 Development Log 또는 script stdout으로만 다룬다.
  - product runtime Product Log를 release script에서 만들지 않는다.
* State Management:
  - Release candidate validation state:
    - `CheckingTests`
    - `CheckingBuild`
    - `CheckingManifest`
    - `CheckingArchitecture`
    - `CheckingSmokeChecklist`
    - `CheckingPackagingCapability`
    - `Completed`
    - `Failed`
    - `SkippedPackaging`
  - `SkippedPackaging`은 VSIX tool absence처럼 제품 기능 실패가 아닌 release environment issue를 표시한다.
* Validation:
  - `npm test`
  - `npm run build`
  - `npm run release:gate`
  - Extension Development Host manual smoke
* Done Criteria:
  - README와 release smoke checklist가 현재 behavior와 충돌하지 않는다.
  - release gate가 Phase 004 필수 검증을 포함한다.
  - VSIX publishing 없이 local release candidate readiness를 판단할 수 있다.
* Risks:
  - packaging tool 설치를 release gate가 암묵적으로 수행하면 network dependency가 생긴다.
  - Phase 004에서는 network install을 금지하고 missing tool은 명시적 skip/failure reason으로 처리한다.

## 8. Cross-Phase TDD Strategy

Phase 004 테스트 구조는 다음을 유지한다.

Domain tests:

- repository identity policy
- backup lifecycle policy
- analyzer policy rules
- target profile compatibility
- state transition rules

Application tests:

- repository index rebuild use case
- version status and snapshot use cases with fake ports
- backup compare/restore/promote/delete use cases
- analyzer policy evaluation orchestration
- remediation action routing
- target profile registration and apply preflight

Infrastructure tests:

- filesystem repository index store
- filesystem backup comparison/hash behavior
- local Git port adapter with deterministic skip if Git is unavailable
- analysis metadata persistence
- audit store append behavior

Presentation tests:

- tree model badge and detail mapping
- command registry and context values
- command input collector for Codex/Claude/All/custom target
- diagnostics action visibility
- command result renderer

Extension tests:

- activation and runtime composition
- default repository creation
- view visibility and command contribution drift
- watcher refresh integration

Scripts tests:

- architecture guard
- manifest gate
- release gate
- release smoke checklist presence and section validation

Manual smoke:

- Extension Development Host에서 실제 사용자 흐름을 확인한다.
- Manual smoke는 자동 테스트의 대체물이 아니다.
- Manual smoke 결과는 `.tasks/release-smoke.md` 또는 Phase 004 completion note에 기록한다.

### 8.1 Phase Test Matrix

| Phase | First Failing Test                                         | Minimum Implementation                          | Regression Gate          |
| ----- | ---------------------------------------------------------- | ----------------------------------------------- | ------------------------ |
| 004.1 | Phase 004 smoke checklist presence test                    | archive verification and checklist stub         | `npm run release:gate`   |
| 004.2 | source without index metadata lacks stable identity        | RepositoryIndexStore and sourceId migration     | refresh/analyze tests    |
| 004.3 | Git unavailable crashes or blocks refresh                  | VersionControlPort unavailable result           | repository refresh tests |
| 004.4 | restore overwrites existing target without confirmation    | BackupLifecyclePolicy and restore state machine | transfer/use case tests  |
| 004.5 | high-risk fixture lacks policy code/recommendation         | built-in policy evaluator                       | apply preflight tests    |
| 004.6 | All target selection does not map to Codex/Claude profiles | target profile model and mapper                 | tree badge tests         |
| 004.7 | diagnostic action mutates target without confirmation      | remediation action router                       | confirmation tests       |
| 004.8 | release gate ignores Phase 004 smoke sections              | release gate checklist validation               | release gate tests       |

### 8.2 Test Double Requirements

- RepositoryIndexStore는 in-memory fake와 filesystem implementation을 모두 가진다.
- VersionControlPort는 unavailable, clean, dirty, commit failure 상태를 fake로 재현한다.
- BackupComparisonPort는 deterministic file hash fixture를 사용한다.
- PolicyPackProvider는 built-in provider와 test fixture provider를 구분한다.
- TargetProfileProvider는 Codex, Claude, All, custom profile을 fake로 제공한다.
- LoggerPort는 Product/Field Debug/Development event classification을 검증할 수 있어야 한다.
- ConfirmationPort는 accept, cancel, unavailable state를 명시적으로 재현한다.

### 8.3 Mandatory Verification Commands

Phase 004의 각 task는 변경 범위에 맞춰 다음 중 필요한 명령을 실행한다.

```sh
npm test
npm run build
npm run release:gate
```

Focused test가 있으면 먼저 실행하고, task 완료 전 전체 `npm test`를 실행한다. Manifest, command, view, release gate를 변경한 task는 반드시 `npm run build`와 `npm run release:gate`를 실행한다.

### 8.4 Manual Smoke Requirements

Phase 004 manual smoke는 다음 항목을 포함한다.

- Extension Development Host가 실행된다.
- Main Repository가 `~/SponzeySkills` 또는 선택 path에서 초기화된다.
- repository index rebuild 후 source skill이 목록에 표시된다.
- Git repo가 아닌 Main Repository에서 Git unavailable 상태가 core flow를 막지 않는다.
- backup compare가 source/target 차이를 표시한다.
- restore backup prompt가 overwrite confirmation을 요구한다.
- Analyze All Skills 후 Diagnostics에 policy code, severity, recommendation이 표시된다.
- Codex, Claude, All target 등록 후 badge가 skill row에 표시된다.
- Project Skills view는 folder/workspace window에서 보이고 file-only window에서 숨겨진다.
- Diagnostics item action이 위험 작업 confirmation을 우회하지 않는다.
- watcher refresh 후 index/diagnostic/read model state가 유지된다.

### 8.5 TDD Evidence Required Per Task

각 task는 완료 전에 다음 TDD evidence를 남긴다.

- 첫 번째 실패 테스트의 파일 경로와 테스트 이름
- 실패 테스트가 검증한 사용자 visible behavior 또는 domain rule
- 최소 구현으로 통과시킨 production file 경로
- 외부 의존성을 대체한 fake port 이름
- error path test 이름
- 설정, 로그, 상태 전이 중 해당 task에서 검증한 항목
- 리팩터링을 수행한 경우 behavior 변경이 없음을 보호한 regression test 이름

다음 작업은 TDD evidence 없이 완료 처리하지 않는다.

- repository metadata schema 추가 또는 migration
- Git status, diff, snapshot capability
- backup restore, backup delete, source promote
- analyzer policy severity 변경
- target profile compatibility 변경
- diagnostic remediation action 추가
- release gate required marker 변경

### 8.6 Fixture And Test Data Rules

Phase 004 test fixture는 다음 규칙을 따른다.

- fixture skill body는 실제 secret, token, private path를 포함하지 않는다.
- destructive pattern fixture는 실제 실행 가능한 위험 command를 실행하지 않는다.
- filesystem adapter test는 temp directory 안에서만 write/delete를 수행한다.
- Git adapter test는 local temp repository만 사용하고 network remote를 만들지 않는다.
- VSCode adapter test는 fake API 또는 existing extension test harness를 사용한다.
- release gate test는 실제 package publish나 network install을 수행하지 않는다.

## 9. Configuration And Runtime Environment Policy

Phase 004에서 허용되는 설정 흐름은 다음뿐이다.

```text
VSCode settings / workspace folders / extension context
  -> settings reader and runtime composition
  -> validate and normalize
  -> build RuntimeContext
  -> inject RuntimeContext into use cases and sessions
  -> pass explicit input to functions
```

금지되는 흐름은 다음이다.

```text
UseCase -> reads VSCode configuration directly
Domain -> reads environment variable
Analyzer -> loads external policy file implicitly
Git use case -> reads process.env during execution
Command handler -> mutates global config mid-operation
```

Phase 004에서 새 설정은 원칙적으로 추가하지 않는다. 꼭 필요하면 다음 양식을 task 문서에 포함한다.

```text
Setting name:
Reason:
Default:
Startup read location:
RuntimeContext field:
Use cases receiving the value:
Tests:
Why command input is insufficient:
Why built-in default is insufficient:
```

설정 변경 event가 발생하면 기존 watcher/session을 dispose하고 새 RuntimeContext로 재구성한다. 기존 use case 내부에 설정을 주입하거나 실행 중 변경하지 않는다.

### 9.1 Runtime Recomposition Contract

Runtime recomposition은 다음 순서를 따른다.

```text
SettingsChanged or WorkspaceChanged
  -> Dispose current watchers and sessions
  -> Read external settings once
  -> Read workspace folders once
  -> Validate and normalize paths
  -> Build frozen RuntimeContext
  -> Recreate use case wiring with explicit dependencies
  -> Register watchers from RuntimeContext
  -> Refresh read model through Application use case
```

다음 동작을 금지한다.

- watcher callback 내부에서 settings를 재조회한다.
- command handler가 RuntimeContext를 mutate한다.
- Git capability를 runtime 중간에 global variable로 변경한다.
- analyzer policy가 실행 중 외부 policy file path를 읽는다.
- test가 product code의 process environment를 중간에 변경하도록 요구한다.

Runtime recomposition을 변경하는 task는 다음 테스트를 포함한다.

- settings reader가 recomposition당 1회만 호출되는 테스트
- old watcher dispose가 호출되는 테스트
- new RuntimeContext가 use case에 명시 전달되는 테스트
- invalid path가 use case 내부 I/O 전에 diagnostic으로 변환되는 테스트
- field debug mode 변경이 다음 RuntimeContext에서만 반영되는 테스트

### 9.2 Metadata Configuration Boundary

Repository metadata schema는 외부 설정이 아니다. Phase 004 metadata는 다음 규칙을 따른다.

- schema version은 metadata record 안에 저장한다.
- metadata path는 Main Repository path에서 파생한다.
- metadata path를 사용자 설정으로 추가하지 않는다.
- unsupported schema는 refresh failure가 아니라 diagnostic으로 표시한다.
- migration은 source skill body를 변경하지 않는다.
- migration write는 `.sponzey/` 아래 metadata area로 제한한다.

## 10. Logging Strategy

### 10.1 Product Log Payload Rules

Product Log는 사용자 영향이 있는 최소 이벤트만 기록한다.

허용 필드:

- operation
- status
- sourceId
- backupId
- targetId
- clientType
- targetScope
- riskLevel
- diagnosticCount
- errorCode
- maskedPath

금지 필드:

- skill body
- full prompt text
- secret
- raw matched sensitive text
- full filesystem path when relative or masked path is enough
- raw Git diff body

### 10.2 Field Debug Log Activation Rules

Field Debug Log는 기본 비활성이다. 활성화 조건은 시작 시 수신한 runtime logging mode로 결정한다.

허용 범위:

- repository index scan detail
- Git status classification detail
- backup comparison summary detail
- analyzer policy matched rule code
- target profile resolution detail
- remediation transition trace

보존 기간을 설정으로 받을 경우 시작 시 1회만 읽고 RuntimeContext로 전달한다. 런타임 중간에 Field Debug Log 설정을 삽입하지 않는다.

### 10.3 Development Log Containment Rules

Development Log는 test harness, local script, smoke helper에서만 사용한다. Production default behavior에 포함하지 않는다.

Development Log는 Product Log를 대신하지 않는다. 사용자에게 영향을 주는 실패는 Product Log 또는 user-facing error로 표현한다.

### 10.4 Logging Review Questions

리뷰어는 각 PR 또는 task 완료 시 다음을 확인한다.

- 이 이벤트는 Product Log, Field Debug Log, Development Log 중 무엇인가?
- Product Log에 민감 정보가 없는가?
- Field Debug Log가 기본 활성화되어 있지 않은가?
- Development Log가 production default path에 포함되지 않는가?
- Domain이 logger implementation에 의존하지 않는가?

### 10.5 Log Event Acceptance Criteria

새 log event는 task 문서에 다음 형식으로 정의한다.

```text
Event name:
Level: Product | Field Debug | Development
Emitted by layer:
Trigger state or use case:
Allowed payload fields:
Forbidden payload fields:
Masking rule:
Test:
```

Product Log event는 다음 기준 중 하나를 만족할 때만 추가한다.

- 사용자가 실행한 작업이 완료되었다.
- 사용자가 실행한 작업이 차단되었다.
- 사용자가 실행한 작업이 실패했다.
- repository, target, backup, analysis 상태에 사용자 영향이 있는 변경이 생겼다.

Field Debug Log event는 다음 기준을 만족해야 한다.

- 문제 재현 또는 현장 진단에 필요한 제한적 상세 상태다.
- 기본 비활성이다.
- payload는 path masking 또는 relative identifier를 사용한다.
- raw skill body, raw diff, secret-like text를 포함하지 않는다.

Development Log event는 다음 위치에서만 허용한다.

- test harness
- fake port
- local release script
- smoke helper

## 11. State Machine Strategy

Phase 004 상태머신은 다음 기준을 따른다.

- 복잡한 내부 흐름을 boolean flag 조합으로 표현하지 않는다.
- 상태, 이벤트, 전이 조건, 실패 상태, 종료 상태를 명시한다.
- side effect boundary를 상태에 연결한다.
- 상태 전이는 unit test로 검증한다.
- 상태 변경은 로그 정책과 연결한다.
- 상태머신은 Domain 또는 Application에 둔다.

### 11.1 State Machine Template

새 상태머신은 task 문서에 다음 양식을 포함한다.

```text
State machine name:
Owner layer:
States:
Events:
Transition table:
Side effect states:
Failure states:
Terminal states:
Product Log events:
Field Debug Log events:
Tests:
```

### 11.2 Side Effect Boundary Rules

다음 side effect는 명시 상태 이전에 실행하지 않는다.

- repository metadata write
- Git commit
- target write
- target delete
- backup delete
- source promote
- audit record write

예:

```text
CheckingConflict -> Blocked
CheckingConflict -> RequiringConfirmation
RequiringConfirmation -> WritingTarget
WritingTarget -> WritingAudit
WritingAudit -> Completed
```

`WritingTarget` 이전에는 filesystem mutation이 없어야 한다.

### 11.3 State Machine Minimum Coverage

각 상태머신은 최소 테스트를 가진다.

- happy path terminal state
- blocked path
- failure path
- cancellation path
- side effect not called before confirmation
- Product Log event emitted on terminal failure when user impact exists

### 11.4 Required Transition Table Format

상태머신이 필요한 task는 다음 transition table을 task 문서에 작성한다.

| From State | Event | Guard | To State | Side Effect | Product Log | Field Debug Log | Test |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Idle` | `Start` | valid input | `Validating` | none | none | transition trace when Field Debug is enabled | state starts test |
| `Validating` | `InvalidInput` | missing required input | `Blocked` | none | operation blocked event if user-visible | validation detail | invalid input test |

Side Effect 값은 다음 중 하나로만 작성한다.

- `none`
- `metadata-read`
- `metadata-write`
- `target-write`
- `target-delete`
- `backup-write`
- `backup-delete`
- `git-read`
- `git-write`
- `audit-write`
- `notification-only`

`target-write`, `target-delete`, `backup-delete`, `git-write`, `audit-write`가 있는 transition은 confirmation 또는 explicit non-destructive policy test를 가져야 한다.

## 12. Dependency And Boundary Rules

### 12.1 Boundary Matrix

| Feature              | Domain                        | Application                              | Infrastructure                        | Presentation                | Scripts                      |
| -------------------- | ----------------------------- | ---------------------------------------- | ------------------------------------- | --------------------------- | ---------------------------- |
| Repository Index     | identity policy, schema value | rebuild orchestration                    | metadata store, hash port             | source row display          | release checklist validation |
| Local Git Versioning | version status value          | version use cases                        | Git adapter                           | command/result display      | artifact check stays in release scripts only |
| Backup Lifecycle     | backup policy, state machine  | compare/restore/promote/delete use cases | filesystem copy/hash/audit            | commands/detail tree        | smoke checklist              |
| Analyzer Policy      | policy rules, findings        | analyzer orchestration                   | skill file read, metadata persistence | diagnostics display/actions | none                         |
| Target Profiles      | profile compatibility policy  | target selection/apply preflight         | settings/path resolution              | badges/context menus        | manifest condition tests     |
| Remediation          | allowed action policy         | action router                            | underlying ports                      | diagnostics context menu    | smoke checklist              |
| Release Candidate    | none                          | none                                     | none                                  | none                        | gate scripts                 |

### 12.2 Port Rules

- Port interface는 Application 또는 Domain 경계에 둔다.
- Port implementation은 Infrastructure에 둔다.
- Test double은 Application tests에서 직접 사용할 수 있어야 한다.
- Infrastructure implementation failure는 use case output 또는 diagnostic으로 정규화한다.
- Presentation에서 Infrastructure implementation을 직접 import하지 않는다.

### 12.3 Dependency Validation

Phase 004 완료 전 다음을 확인한다.

- Domain이 VSCode API를 import하지 않는다.
- Domain이 filesystem module을 import하지 않는다.
- Domain이 process/env를 조회하지 않는다.
- Application use case가 settings reader를 직접 호출하지 않는다.
- Presentation이 filesystem repository implementation을 직접 호출하지 않는다.
- Infrastructure가 presentation tree item을 import하지 않는다.
- Scripts가 product runtime state를 변경하지 않는다.

### 12.4 Architecture Guard Expansion Candidates

Phase 004에서 architecture guard를 확장할 경우 다음 rule을 우선한다.

- `src/domain/**` cannot import `vscode`, `fs`, `node:fs`, `child_process`, settings reader, logger implementation.
- `src/application/**` cannot import `vscode` or direct filesystem adapter implementation except through declared ports.
- `src/presentation/**` cannot import filesystem infrastructure implementation.
- `src/infrastructure/**` cannot import presentation modules.
- `scripts/**` cannot be imported by product runtime source.

## 13. Risk And Mitigation

| Risk                                         | Impact                                            | Mitigation                                                   | Verification                            |
| -------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| repository index becomes stale               | source identity and diagnostics become unreliable | source hash, schema version, rebuild state, stale diagnostic | index rebuild tests                     |
| Git feature blocks non-Git repositories      | core MVP flow breaks                              | unavailable status instead of thrown failure                 | fake unavailable Git tests              |
| backup restore overwrites external skill     | data loss                                         | conflict check and confirmation state before write           | restore blocked tests                   |
| policy analyzer false positives are noisy    | users ignore diagnostics                          | severity fixtures, recommendation text, category grouping    | analyzer fixture tests and manual smoke |
| target profile drift between apply and tree  | user sees wrong Codex/Claude state                | shared profile model and tree regression tests               | target profile tests                    |
| remediation bypasses safety prompts          | destructive action without consent                | action router uses existing confirmation use cases           | confirmation regression tests           |
| release gate depends on network tool install | local validation becomes flaky                    | no network install, explicit missing tool state              | release gate tests                      |
| logs leak skill content                      | sensitive prompt or secret exposure               | payload allowlist and tests for logger mapping               | logging tests                           |

## 14. Review Checklist

Reviewers must verify the following before accepting a Phase 004 task.

Architecture:

- Domain does not depend on VSCode, filesystem, network, process env, logger implementation.
- Use case has explicit input and output.
- External systems are accessed only through ports/adapters.
- Presentation only maps commands, views, labels, icons, prompts, and output.
- Scripts are not imported by product runtime code.

Configuration:

- New settings were avoided unless explicitly justified.
- External environment values are read once at startup/runtime composition.
- Values are passed through RuntimeContext, constructor arguments, function arguments, or use case input.
- No hidden global config lookup exists inside Domain/Application.
- Runtime setting changes rebuild context/session instead of mutating running use cases.

Logging:

- Each new log event is Product, Field Debug, or Development.
- Product Log contains only minimal user-impacting information.
- Field Debug Log is not default enabled.
- Development Log is not part of production default behavior.
- No skill body, secret, raw matched sensitive text, or full diff body is logged.

State Machine:

- Complex flows use explicit states and transitions.
- Side effects occur only in side effect states.
- Failure and cancellation states are tested.
- Product Log is connected to user-impacting terminal failure.

TDD:

- Failing tests were written before implementation.
- Test doubles replace filesystem, Git, settings, logger, confirmation, and VSCode dependencies where needed.
- Error cases are tested.
- Refactoring and feature behavior changes are separated when possible.

Product:

- Main Repository is still not treated as a Global Target.
- Source delete and target remove are not merged.
- Backup create does not mutate target.
- Restore and delete require explicit confirmation when destructive.
- Critical risk apply is blocked before target write.
- Project Skills view visibility matches workspace/folder state.
- Codex/Claude badges remain skill-row badges, not folder grouping.

## 15. Definition Of Done

Phase 004 is complete when all of the following are true.

- Phase 003 documents are archived under `.tasks/phase003/`.
- Root `.tasks/plan.md` describes Phase 004 only.
- Repository index v2 provides stable source identity and schema diagnostics.
- Existing Main Repository folders without metadata remain usable.
- Local Git versioning is a non-required local capability and does not break non-Git repositories.
- Backup compare and restore workflows exist and are protected by confirmation.
- Backup snapshots remain immutable.
- Analyzer policy pack produces normalized diagnostic codes, severity, recommendation, and dependency categories.
- Target profiles drive apply, scan, diagnostics, badge, and compatibility decisions consistently.
- Diagnostics remediation actions are explicit and cannot bypass safety confirmations.
- Release smoke checklist covers all Phase 004 user-visible flows.
- `npm test` passes.
- `npm run build` passes.
- `npm run release:gate` passes.
- Extension Development Host manual smoke is executed or any blocker is recorded with exact command/error/context.

### 15.1 Required Verification Evidence

Phase 004 completion report must include:

- changed task files list
- source code files changed
- test files added or updated
- focused tests executed
- full verification commands executed
- Extension Host manual smoke result
- unresolved risk list
- configuration changes, if any
- Product/Field Debug/Development Log events added
- state machines added or changed

### 15.2 Mandatory Validation Criteria

Phase 004 plan and tasks must verify the following.

| Required Criterion                                                | Phase 004 Evidence                      |
| ----------------------------------------------------------------- | --------------------------------------- |
| 도메인 계층이 외부 프레임워크에 의존하지 않는다.                                       | architecture guard and review checklist |
| 유스케이스가 명시적 입력과 출력을 가진다.                                           | application use case tests              |
| 외부 환경 값이 프로그램 시작 이후 암묵적으로 재조회되지 않는다.                              | runtime context tests                   |
| 설정 값이 프로세스 중간에 삽입되거나 변경되지 않는다.                                    | settings recomposition tests            |
| 외부 API, DB, 파일시스템, 네트워크 접근이 경계 계층에만 존재한다.                         | architecture guard                      |
| 테스트 더블로 외부 의존성을 대체할 수 있다.                                         | fake ports in application tests         |
| 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되어 있다. | logger/router tests                     |
| 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.                                     | logging review and tests                |
| 복잡한 내부 흐름이 플래그 조합이 아니라 명시적 상태 전이로 표현된다.                           | state machine tests                     |
| 리팩터링과 기능 변경이 가능한 한 분리되어 있다.                                       | task and commit review                  |

## 16. Prohibited Implementation Patterns

Phase 004에서 다음 구현은 금지한다.

- Main Repository를 Global Target으로 자동 취급한다.
- source delete와 target remove를 같은 command path로 합친다.
- backup create가 target을 변경한다.
- restore가 confirmation 없이 existing target을 덮어쓴다.
- Git command를 Domain 또는 Presentation에서 직접 실행한다.
- analyzer가 외부 policy file을 암묵적으로 읽는다.
- use case 내부에서 VSCode settings 또는 process env를 직접 조회한다.
- Runtime 중간에 설정 값을 삽입하거나 변경한다.
- Field Debug Log를 기본 활성화한다.
- Product Log에 skill body, secret, raw matched text, full diff body를 기록한다.
- Diagnostics remediation action이 safety confirmation을 우회한다.
- target profile logic을 command별로 중복 구현한다.
- Project Skills view를 file-only window에서 강제로 표시한다.
- Codex/Claude badge 표시를 folder grouping으로 되돌린다.
- release gate가 network install을 암묵적으로 수행한다.
- VSIX publish를 Phase 004 범위에 포함한다.
- custom webview editor를 Phase 004 범위에 포함한다.

## 17. Next Actions

Phase 004는 다음 순서로 task 파일을 만든 뒤 실행한다.

1. Create `.tasks/task001.md` for Phase 004.1 archive and baseline integrity.
   - Include verification that `.tasks/phase003/plan.md`, `.tasks/phase003/task001.md` through `.tasks/phase003/task022.md`, and `.tasks/phase003/release-smoke.md` exist.
   - Include current `npm test`, `npm run build`, `npm run release:gate` baseline.
2. Create `.tasks/task002.md` for Repository Index V2 Tidy First.
   - Include DTO naming, metadata schema naming, and source read model cleanup.
   - Do not change user-visible behavior in this task.
3. Create `.tasks/task003.md` for stable source identity and index rebuild use case.
   - Include sourceId migration, sourceHash, unsupported schema diagnostics, and index store tests.
4. Create `.tasks/task004.md` for local Git version status behind `VersionControlPort`.
   - Include unavailable/non-Git handling.
   - Do not add network dependency.
5. Create `.tasks/task005.md` for repository snapshot creation flow.
   - Include confirmation, state machine, Product Log event, and fake Git tests.
6. Create `.tasks/task006.md` for Backup Compare.
   - Include source/backup and target/backup comparison summaries.
   - Include malformed backup metadata diagnostics.
7. Create `.tasks/task007.md` for Backup Restore lifecycle.
   - Include overwrite confirmation, immutable backup rule, restore audit record, and Extension Host prompt smoke.
8. Create `.tasks/task008.md` for Built-In Analyzer Policy Pack.
   - Include policy rule codes, severity mapping, dependency category normalization, and persisted metadata output.
9. Create `.tasks/task009.md` for analyzer recommendation and remediation suggestion contract.
   - Include `allowedActions`, `blockedActions`, and severity-based action policy.
10. Create `.tasks/task010.md` for Target Profile Governance.
    - Include Codex/Claude/All/custom profile model, compatibility warnings, and badge regression tests.
11. Create `.tasks/task011.md` for Diagnostics Remediation Workflow.
    - Include diagnostic context commands, action routing, confirmation enforcement, and Product Log events.
12. Create `.tasks/task012.md` for Phase 004 release smoke checklist and release gate hardening.
    - Include smoke checklist section validation and Extension Host evidence template.
13. Create `.tasks/task013.md` only if VSIX local candidate script is justified without network dependency.
    - If packaging tool dependency would require network install or global mutation, record the decision to defer instead of implementing.
14. Do not start cloud sync, public registry search UI, marketplace publish, LLM rewrite, custom webview editor, or skill execution sandbox in Phase 004.

## 18. Task Authoring Template

Each Phase 004 task file must use this structure.

```markdown
# Task XXX. Title

## 1. Summary

- [ ] Purpose
- [ ] Problem solved
- [ ] Expected state after completion

## 2. Scope

### Included

- [ ] Included change 1
- [ ] Included change 2

### Excluded

- [ ] Excluded change 1
- [ ] Excluded change 2

## 3. Related Plan Items

- [ ] `.tasks/plan.md` section
- [ ] `AGENTS.md` principle
- [ ] `PROJECT.md` requirement

## 4. Dependencies

### Previous Tasks

- [ ] Previous task or `None`

### Next Tasks

- [ ] Next task or `None`

## 5. Architecture Notes

- [ ] Changed layer
- [ ] Dependency direction
- [ ] Port/interface boundary
- [ ] External system access location

## 6. Functional Requirements

- [ ] Requirement 1
- [ ] Requirement 2

## 7. Non-Functional Requirements

- [ ] Configuration rule
- [ ] Logging rule
- [ ] Error handling rule
- [ ] Testability rule

## 8. Implementation Steps

- [ ] Write failing tests first
- [ ] Implement minimum behavior
- [ ] Refactor after green
- [ ] Verify boundaries
- [ ] Update docs or smoke checklist when required

## 9. TDD Checklist

- [ ] Unit tests
- [ ] Use case tests
- [ ] Port fake tests
- [ ] Error tests
- [ ] Logging tests when relevant
- [ ] State transition tests when relevant

## 10. Validation Checklist

- [ ] Functional requirements met
- [ ] Non-functional requirements met
- [ ] Domain has no external framework dependency
- [ ] Runtime settings are explicit
- [ ] External I/O is behind boundary
- [ ] Logs follow 3-level policy
- [ ] State machine is explicit when needed
- [ ] Tidy First and feature changes are separated when possible

## 11. Logging Requirements

### Product Log

- [ ] Event and payload

### Field Debug Log

- [ ] Event and payload

### Development Log

- [ ] Event and payload

## 12. State Machine Requirements

- [ ] Needed or not needed
- [ ] States
- [ ] Events
- [ ] Transitions
- [ ] Failure states
- [ ] Terminal states
- [ ] Tests

## 13. Done Criteria

- [ ] Implementation complete
- [ ] Tests pass
- [ ] Build passes when required
- [ ] Release gate passes when required
- [ ] Extension Host smoke completed when required
- [ ] Remaining risks recorded
```

Task authors must not mark a checkbox complete unless the related test, implementation, review, or smoke evidence exists. If evidence is not available, leave the checkbox unchecked and record the blocker.
