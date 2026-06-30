# Sponzey Skills Manager MVP Development Plan

작성일: 2026-06-28

## 1. Project Goal

Sponzey Skills Manager MVP의 목표는 Agent Skills의 "원본 저장소"와 "적용 위치"를 분리해 관리하는 VSCode Extension을 만드는 것이다.

MVP는 다음 규칙을 제품 동작, 코드 구조, 테스트, UI에 모두 반영해야 한다.

- Main Skill Repository는 스킬 원본을 보관하는 로컬 저장소다.
- Main Skill Repository는 Global Skill Target 또는 Project Skill Target이 아니다.
- 스킬은 Main Skill Repository에 존재한다는 이유만으로 활성 스킬이 되지 않는다.
- 스킬은 사용자가 명시적으로 Global 또는 Project Target에 적용해야 agent가 읽는 위치에 배치된다.
- 전역 또는 프로젝트에 이미 존재하는 스킬은 Main Skill Repository로 copy, backup, move할 수 있어야 한다.
- backup은 target을 변경하지 않는 snapshot 작업이다.
- remove는 target 적용 항목만 제거하며 source를 삭제하지 않는다.
- Critical risk skill은 target write 전에 차단한다.

MVP 완료 시 사용자는 다음을 수행할 수 있어야 한다.

1. Main Skill Repository를 설정하고 초기화한다.
2. Main Repository, Global Skills, Project Skills, Diagnostics 목록을 본다.
3. `SKILL.md` 기반 스킬을 생성한다.
4. 기존 스킬을 Main Repository로 import한다.
5. 스킬 구조와 기본 위험도를 분석한다.
6. source skill을 global target에 symlink 또는 copy 방식으로 적용한다.
7. source skill을 project target에 symlink 또는 copy 방식으로 적용한다.
8. global/project target에서 적용된 스킬을 source 삭제 없이 제거한다.
9. target에만 존재하는 external skill을 감지한다.
10. target skill을 Main Repository로 copy한다.
11. target skill을 Main Repository에 backup snapshot으로 저장한다.
12. target skill을 Main Repository로 move할 때 target cleanup 여부를 명시적으로 확인한다.
13. MVP command palette 명령과 tree view로 위 기능을 실행한다.

## 2. Current Plan Assessment

### 2.1 Final Goal

현재 계획의 최종 목표는 명확하다. 핵심은 "스킬 실행기"가 아니라 "스킬 원본과 적용 위치를 안전하게 관리하는 도구"다. 이 방향은 `PROJECT.md`와 일치한다.

### 2.2 Strengths

기존 계획의 강점은 다음이다.

- Main Repository와 Target의 분리를 MVP의 중심 목표로 잡았다.
- `backup`, `copy`, `move`의 의미를 구분했다.
- Domain/Application/Infrastructure/Presentation 계층을 제안했다.
- RuntimeContext 기반 설정 수신 방식을 포함했다.
- Product Log, Field Debug Log, Development Log를 구분했다.
- apply, remove, transfer, analyze 절차에 상태머신을 제안했다.
- TDD와 acceptance test를 포함했다.

### 2.3 Gaps Fixed In This Revision

이번 업데이트에서 다음 부족한 부분을 수정한다.

- 모든 phase에 `Goal`, `Scope`, `Required Changes`, `Architecture Notes`, `TDD Requirements`, `Configuration Rules`, `Logging Rules`, `State Management`, `Validation`, `Done Criteria`, `Risks`를 고정 형식으로 추가한다.
- "테스트를 추가한다", "로그를 남긴다", "상태를 관리한다" 같은 표현을 구체적인 검증 항목으로 바꾼다.
- AGENTS.md의 금지 패턴을 계획의 review gate와 prohibited pattern에 직접 연결한다.
- 설정을 "시작 시 최초 1회 수신"하고 이후 명시 전달한다는 규칙을 phase별로 반복 적용한다.
- 외부 I/O가 adapter에만 존재해야 한다는 검증 항목을 추가한다.
- 개발용 로그가 프로덕션 기본 동작에 포함되지 않아야 한다는 검증 항목을 추가한다.
- 상태머신 적용 기준과 상태/이벤트/전이 조건/실패 상태/종료 상태 산출물을 명시한다.
- UI 구현이 너무 이르게 시작되지 않도록 phase 순서를 고정한다.

### 2.4 Architecture Risks Identified

다음 위험을 반드시 통제한다.

- UI command handler에 domain policy가 들어가는 위험
- filesystem adapter가 use case decision을 대신 결정하는 위험
- RuntimeContext 대신 설정 singleton 또는 환경 변수를 직접 읽는 위험
- backup/copy/move 의미가 코드에서 섞이는 위험
- remove와 delete가 섞여 source가 삭제되는 위험
- Product Log에 내부 상태 또는 민감 정보가 들어가는 위험
- 상태머신 대신 boolean flag 조합으로 복잡한 절차를 관리하는 위험

## 3. Architecture Direction

### 3.1 Layers

다음 계층을 고정한다.

```text
Presentation
Application
Domain
Infrastructure
```

각 계층의 책임은 다음과 같다.

| Layer          | Responsibility                                     | Forbidden                         |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Presentation   | command, tree view, 사용자 입력, 결과 표시                  | 도메인 정책 구현, 파일시스템 직접 접근            |
| Application    | 유스케이스 조합, 포트 호출, 상태머신 실행, 로그 이벤트 생성                | 설정 재조회, 구체 adapter 생성             |
| Domain         | 모델, 값 객체, 정책, 상태 전이 규칙, 위험도 decision               | VSCode API, 파일시스템, 네트워크, 환경 변수 접근 |
| Infrastructure | 파일시스템, VSCode API, 설정 수신, index storage, logger 구현 | 유스케이스 정책 결정                       |

### 3.2 Dependency Direction

의존 방향은 다음만 허용한다.

```text
Presentation -> Application -> Domain
Infrastructure -> Application ports
Infrastructure -> Domain value types only when implementing ports
Domain -> no outer dependency
```

다음 import를 검증으로 금지한다.

- `domain`에서 VSCode API import
- `domain`에서 filesystem, network, process environment import
- `application`에서 concrete infrastructure class import
- `presentation`에서 filesystem adapter import
- `infrastructure`에서 presentation import

### 3.3 Core Use Cases

MVP 유스케이스는 다음 단위로 구현한다.

```text
BuildRuntimeContext
RefreshSkills
ListMainRepositorySkills
ListGlobalSkills
ListProjectSkills
CreateSkill
ImportSkillToMainRepository
AnalyzeSkill
AnalyzeAllSkills
ApplySkillToGlobalTarget
ApplySkillToProjectTarget
RemoveSkillFromGlobalTarget
RemoveSkillFromProjectTarget
CopyAppliedSkillToMainRepository
BackupAppliedSkillToMainRepository
MoveAppliedSkillToMainRepository
SwitchApplyMode
ShowSkillDiagnostics
```

각 유스케이스는 명시적인 input과 output을 가져야 한다.

```text
UseCaseInput
UseCaseOutput
RequiredPorts
RuntimeContext
DomainPolicyDecision
LogEvents
```

## 4. Development Principles

### 4.1 Layered Architecture

- 계층별 책임을 코드 위치와 테스트 이름에 반영한다.
- 계층을 건너뛰는 호출을 금지한다.
- adapter는 포트 뒤에 숨긴다.
- command handler는 use case를 호출하고 result를 표시하는 역할만 한다.

### 4.2 Clean Architecture

- Domain은 가장 안쪽 계층으로 둔다.
- Domain은 외부 시스템을 알지 못한다.
- Application은 port interface만 안다.
- Infrastructure는 port interface를 구현한다.
- 외부 API, DB, 파일시스템, 네트워크, 환경 변수 접근은 Infrastructure에만 둔다.

### 4.3 Tidy First

- 기능 변경 전에 필요한 구조 정리는 별도 작업으로 분리한다.
- 정리 작업은 behavior를 바꾸지 않는다.
- 정리 작업에는 회귀 방지 테스트 또는 import guard test를 둔다.
- 리팩터링과 기능 변경은 가능한 한 별도 커밋으로 분리한다.

### 4.4 TDD

각 기능 작업은 다음 순서로만 진행한다.

1. 실패하는 테스트를 작성한다.
2. 테스트를 통과하는 최소 구현을 작성한다.
3. 중복과 구조 문제를 정리한다.
4. 설정, 로그, 상태 전이, 오류 처리를 테스트한다.
5. 외부 의존성은 테스트 더블, 포트, 인터페이스로 대체한다.

## 5. Implementation Phases

## Phase 0. Project Bootstrap And Architecture Guard

* Goal:
  - 개발자가 같은 구조에서 작업할 수 있는 최소 extension 프로젝트와 테스트 실행 기반을 만든다.
  - 계층 의존성 위반을 초기에 잡는 guard를 만든다.
* Scope:
  - 프로젝트 scaffold
  - build/test/lint command
  - layer directory 생성
  - import boundary test
  - fixture 정책
* Required Changes:
  - `src/domain`, `src/application`, `src/infrastructure`, `src/presentation` 디렉터리를 만든다.
  - 테스트 디렉터리를 domain/usecase/adapter/integration 기준으로 나눈다.
  - extension entrypoint를 만들되, domain/application을 import할 수 있는 최소 wiring만 둔다.
  - dependency guard 테스트를 작성한다.
  - fixture는 실제 home/global path를 사용하지 않고 temp root에서만 생성되도록 helper를 만든다.
* Architecture Notes:
  - Domain과 Application은 VSCode API 없이 import 가능해야 한다.
  - Presentation과 Infrastructure는 Domain을 직접 수정하지 않는다.
  - Bootstrap 단계에서 제품 기능을 구현하지 않는다.
* TDD Requirements:
  - `domain` import smoke test를 먼저 작성한다.
  - `domain`에서 금지된 module import가 없음을 검사하는 테스트를 작성한다.
  - extension entrypoint import smoke test를 작성한다.
* Configuration Rules:
  - 이 phase에서는 설정값을 사용하지 않는다.
  - default path를 코드 전역 상수로 두지 않는다.
* Logging Rules:
  - 제품 로그 구현은 아직 만들지 않는다.
  - test runner diagnostic은 Development Log로 분류한다.
* State Management:
  - 상태머신을 구현하지 않는다.
  - 상태머신을 둘 위치만 `src/domain/state` 또는 `src/application/state`로 확정한다.
* Validation:
  - test command가 실행된다.
  - build command가 실행된다.
  - import guard가 실패/성공을 구분한다.
* Done Criteria:
  - 새로운 기능 없이 프로젝트 기본 구조와 테스트 기반만 존재한다.
  - Domain이 외부 framework에 의존하지 않는다는 검증이 있다.
* Risks:
  - UI scaffold가 먼저 커지면 domain policy가 command handler로 들어간다.
  - 이 phase에서 UI 구현을 시작하지 않는다.

## Phase 1. RuntimeContext And Configuration Boundary

* Goal:
  - 외부 환경 값과 설정 값을 프로그램 시작 시 최초 1회만 수신하고, 이후 명시적으로 전달하는 구조를 만든다.
* Scope:
  - `RuntimeContext`
  - settings reader port
  - settings validation
  - path normalization boundary
  - context replacement flow
* Required Changes:
  - `RuntimeContext` 값 객체를 정의한다.
  - `SettingsReaderPort`를 정의한다.
  - `RuntimeContextBuilder`를 구현한다.
  - Main Repository path, global target path, project target path를 validate한다.
  - `mainRepositoryPath`가 global target과 같거나 그 하위이면 blocking diagnostic 또는 strong warning을 반환한다.
  - settings change event는 기존 context를 mutate하지 않고 새 context를 만든다.
* Architecture Notes:
  - `RuntimeContextBuilder`는 Application boundary에 둔다.
  - 실제 VSCode settings 접근은 Infrastructure adapter에 둔다.
  - 유스케이스는 settings reader를 받지 않고 `RuntimeContext`를 받는다.
* TDD Requirements:
  - settings reader가 context build 중 1회만 호출되는 실패 테스트를 먼저 작성한다.
  - use case가 settings reader 없이 실행되는 테스트를 작성한다.
  - `mainRepositoryPath == globalTargetPath` validation 테스트를 작성한다.
  - runtime 중간 config mutation을 허용하지 않는 테스트를 작성한다.
* Configuration Rules:
  - 외부 설정 파일 의존을 기본값으로 삼지 않는다.
  - process 중간 환경 변수 삽입 또는 변경을 금지한다.
  - 환경 값은 `RuntimeContext`, 생성자 인자, 함수 인자, use case input으로만 전달한다.
* Logging Rules:
  - context validation 실패는 `runtime.context.validation.failed` Product Log event contract로 정의한다.
  - validation detail은 `config.validation.detail` Field Debug Log event contract로 정의한다.
  - 실제 logger adapter는 Phase 8에서 구현한다.
* State Management:
  - context build는 단순 흐름이면 상태머신을 만들지 않는다.
  - validation 단계가 3단계 이상으로 늘면 `RuntimeContextBuildState`를 도입한다.
* Validation:
  - 외부 환경 값이 프로그램 시작 이후 암묵적으로 재조회되지 않는지 테스트한다.
  - 설정 값이 프로세스 중간에 삽입되거나 변경되지 않는지 테스트한다.
* Done Criteria:
  - `RuntimeContext`는 immutable하다.
  - settings reader는 Infrastructure에만 있다.
  - 유스케이스 생성 시 context가 명시적으로 주입된다.
* Risks:
  - 설정 singleton을 만들면 AGENTS.md와 충돌한다.
  - 설정 변경 이벤트를 기존 객체 mutation으로 처리하지 않는다.

## Phase 2. Domain Model, Policies, And Decisions

* Goal:
  - MVP 핵심 도메인 개념과 정책을 외부 의존성 없이 구현한다.
* Scope:
  - value object
  - entity
  - enum
  - domain policy
  - machine-readable decision
* Required Changes:
  - `SkillName`, `SkillDescription`, `MainRepositoryPath`, `SkillTargetPath`, `WorkspaceRoot`, `HashValue`, `Timestamp`를 정의한다.
  - `SkillSource`, `SkillTarget`, `AppliedSkill`, `SkillBackup`, `SkillDiagnostic`, `SkillDependency`, `SkillTransferOperation`, `RepositoryIndex`를 정의한다.
  - `RepositoryPathPolicy`, `ApplyConflictPolicy`, `RiskPolicy`, `RemovePolicy`, `TransferPolicy`, `SyncStatusPolicy`를 구현한다.
  - policy result는 UI 문장이 아니라 code, severity, recommendation을 포함한다.
* Architecture Notes:
  - Domain policy는 외부 path를 직접 normalize하지 않는다.
  - Domain은 검증된 value object를 받는다.
  - Product Log event name은 Domain에 두지 않는다.
* TDD Requirements:
  - Main Repository가 Global Target으로 취급되지 않는 테스트를 먼저 작성한다.
  - remove policy가 source deletion을 거부하는 테스트를 작성한다.
  - backup policy가 target mutation을 거부하는 테스트를 작성한다.
  - Critical risk가 apply blocked decision을 반환하는 테스트를 작성한다.
  - external target collision이 overwrite forbidden decision을 반환하는 테스트를 작성한다.
* Configuration Rules:
  - Domain은 설정을 읽지 않는다.
  - policy는 명시 input 또는 `RuntimeContext`에서 파생된 값만 받는다.
* Logging Rules:
  - Domain은 logger를 호출하지 않는다.
  - policy decision은 Application에서 log event로 변환할 수 있게 serializable해야 한다.
* State Management:
  - 이 phase에서는 상태머신의 입력으로 사용할 decision type을 만든다.
  - 상태 전이는 Phase 5 이후 구현한다.
* Validation:
  - Domain 계층이 외부 framework에 의존하지 않는지 import guard로 확인한다.
  - 모든 policy test는 filesystem 없이 실행된다.
* Done Criteria:
  - Domain test가 fake port 없이 순수하게 실행된다.
  - policy decision이 UI와 infrastructure에 독립적이다.
* Risks:
  - path string을 그대로 흘리면 target/source 구분 오류가 생긴다.
  - value object 없이 구현하지 않는다.

## Phase 3. Skill Parser And Static Analyzer

* Goal:
  - `SKILL.md` 구조 분석과 기본 위험도 분석을 구현한다.
* Scope:
  - skill manifest parse
  - structure rules
  - description rules
  - security rules
  - dependency rule interface와 MVP 기본 rule 구현
  - compatibility rule interface와 MVP 기본 rule 구현
  - risk aggregation
* Required Changes:
  - `SkillParserPort`를 정의한다.
  - `SKILL.md` 존재 여부를 검사한다.
  - frontmatter parse 결과를 domain-neutral DTO로 변환한다.
  - `name`, `description` 필수 필드를 검사한다.
  - directory name과 `name` 불일치를 진단한다.
  - references/scripts/assets 참조 누락을 진단한다.
  - 위험 패턴 rule을 만든다.
* MVP Rule Set:

  | Rule                                | Severity    |
  | ----------------------------------- | ----------- |
  | Missing `SKILL.md`                  | critical    |
  | Missing `name`                      | high        |
  | Missing `description`               | high        |
  | Directory name mismatch             | warning     |
  | Description too broad               | warning     |
  | `rm -rf` instruction                | critical    |
  | `curl                               | sh` pattern | critical |
  | secret exfiltration instruction     | critical    |
  | credential access request           | high        |
  | network upload/download instruction | high        |
  | broad `allowed-tools`               | medium      |
  | missing referenced file             | warning     |
* Architecture Notes:
  - Parser adapter가 파일을 읽는다.
  - Analyzer use case는 parser port와 rule engine을 조합한다.
  - Analyzer는 VSCode settings를 읽지 않는다.
* TDD Requirements:
  - valid minimal skill이 Low risk를 반환하는 테스트를 작성한다.
  - missing `SKILL.md`가 critical diagnostic을 반환하는 테스트를 작성한다.
  - missing description이 high diagnostic을 반환하는 테스트를 작성한다.
  - `rm -rf`, `curl | sh`, secret exfiltration pattern이 critical을 반환하는 테스트를 작성한다.
  - missing reference가 warning을 반환하는 테스트를 작성한다.
* Configuration Rules:
  - rule enable/disable 설정을 MVP에 넣지 않는다.
  - 위험도 정책 변경 요청은 `post-mvp-risk-policy-backlog` 항목으로 기록하고 MVP 구현에 섞지 않는다.
* Logging Rules:
  - analysis completion은 `skill.analysis.completed` Product Log event contract다.
  - rule별 상세 실행은 `analysis.rule.completed` Field Debug Log event contract다.
  - 테스트 fixture trace는 Development Log다.
* State Management:
  - AnalyzeSkill 흐름은 상태머신으로 정의한다.
  - 상태: `LoadingSkillDirectory`, `ParsingSkillMd`, `RunningStructureRules`, `RunningSecurityRules`, `CalculatingRisk`, `Completed`.
  - 실패 상태: `MissingSkillMd`, `ParseFailed`, `UnreadableFile`, `AnalysisFailed`.
* Validation:
  - analyzer output은 serializable해야 한다.
  - analyzer는 테스트 더블 parser로 실행 가능해야 한다.
* Done Criteria:
  - 기본 위험도 분석이 동작한다.
  - Critical risk가 apply policy에서 사용할 수 있는 형태로 전달된다.
* Risks:
  - analyzer가 파일시스템을 직접 읽으면 테스트가 어려워진다.
  - parser adapter와 analyzer rule을 분리한다.

## Phase 4. Filesystem Adapters And Repository Storage

* Goal:
  - 실제 파일시스템을 포트 뒤에 숨기고, source/target/backup을 안전하게 읽고 쓸 수 있게 한다.
* Scope:
  - repository initializer
  - source scanner
  - target scanner
  - symlink/copy/external/broken link detection
  - metadata read/write
  - directory hash
  - safe copy/remove
  - index storage
* Required Changes:
  - `FileSystemSkillRepository`를 구현한다.
  - `FileSystemTargetStore`를 구현한다.
  - `DirectoryHashService`를 구현한다.
  - `JsonIndexStore`를 구현한다.
  - repository structure는 `skills/`, `backups/`, `.sponzey/`를 생성한다.
  - `.sponzey.json`, `.sponzey-applied.json`, `.sponzey-backup.json` roundtrip을 구현한다.
  - safe recursive copy는 destination overwrite를 기본 거부한다.
  - safe remove는 target entry만 제거하고 source를 건드리지 않는다.
* Architecture Notes:
  - Infrastructure adapter는 use case decision 없이 overwrite/delete를 결정하지 않는다.
  - Adapter는 typed error를 반환한다.
  - Application이 adapter error를 use case output과 Product Log event로 변환한다.
* TDD Requirements:
  - temp repository init 테스트를 작성한다.
  - source scan이 `skills/*/SKILL.md`만 source로 인식하는 테스트를 작성한다.
  - target scan이 symlink, managed copy, external, broken symlink를 구분하는 테스트를 작성한다.
  - backup snapshot이 target hash와 metadata를 기록하는 테스트를 작성한다.
  - safe remove가 source를 삭제하지 않는 테스트를 작성한다.
* Configuration Rules:
  - adapter는 path를 설정에서 읽지 않는다.
  - adapter는 use case input으로 받은 path만 사용한다.
* Logging Rules:
  - adapter는 logger를 직접 호출하지 않는다.
  - filesystem failure는 typed error로 반환하고 Application이 로그를 결정한다.
* State Management:
  - adapter 자체는 상태머신을 갖지 않는다.
  - 상태머신의 side effect step에서 adapter를 호출한다.
* Validation:
  - 외부 API, DB, 파일시스템, 네트워크 접근이 Infrastructure에만 존재하는지 import guard로 확인한다.
  - adapter tests는 실제 home directory 또는 실제 global skill path를 건드리지 않는다.
* Done Criteria:
  - all adapter tests run in temp directories.
  - path traversal과 overwrite 기본 거부가 테스트된다.
* Risks:
  - symlink 테스트가 플랫폼별로 다르게 실패할 수 있다.
  - symlink capability check를 adapter output에 포함한다.

## Phase 5. Scan, Index, And Read Models

* Goal:
  - Main Repository, Global Skills, Project Skills, Diagnostics tree view가 사용할 read model을 만든다.
* Scope:
  - target registry
  - refresh use case
  - index calculation
  - managed/external matching
  - sync status
  - diagnostics aggregation
* Required Changes:
  - `RefreshSkills` use case를 구현한다.
  - `ListMainRepositorySkills`, `ListGlobalSkills`, `ListProjectSkills`, `ShowSkillDiagnostics` output DTO를 만든다.
  - Codex global target, Claude global target, workspace project target을 `RuntimeContext`에서 받은 값으로 계산한다.
  - source와 applied skill matching을 구현한다.
  - external skill을 별도 상태로 표시한다.
  - broken symlink와 shadowing diagnostic을 만든다.
* Architecture Notes:
  - Read model은 Presentation 전용 DTO다.
  - Tree view는 read model만 읽고 domain entity를 수정하지 않는다.
  - Index는 cache이며 source of truth는 filesystem이다.
* TDD Requirements:
  - main repository source가 명시 적용 전 inactive로 표시되는 테스트를 작성한다.
  - global target symlink가 main source를 가리키면 managed symlink로 표시되는 테스트를 작성한다.
  - `.sponzey-applied.json`이 있는 copy는 managed copy로 표시되는 테스트를 작성한다.
  - source 연결이 없는 target skill은 external로 표시되는 테스트를 작성한다.
  - broken symlink diagnostic 테스트를 작성한다.
* Configuration Rules:
  - target path는 `RuntimeContext`에서 전달받는다.
  - refresh 중 settings를 재조회하지 않는다.
* Logging Rules:
  - refresh completion은 Product Log다.
  - scan step detail은 Field Debug Log다.
  - fixture scan detail은 Development Log다.
* State Management:
  - target scan이 3단계 이상으로 복잡해지면 `TargetScanStateMachine`을 사용한다.
  - 상태: `LoadingTargets`, `ScanningEntries`, `MatchingSources`, `CalculatingSync`, `Completed`.
  - 실패 상태: `TargetUnreadable`, `EntryParseFailed`, `IndexWriteFailed`.
* Validation:
  - refresh는 idempotent해야 한다.
  - index invalidation 후 재계산 결과가 동일 fixture에서 안정적이어야 한다.
* Done Criteria:
  - 세 목록과 diagnostics read model이 생성된다.
  - tree view 없이 use case 테스트로 검증된다.
* Risks:
  - read model이 domain entity와 섞이면 UI 변경이 domain에 영향을 준다.
  - mapper를 별도 계층에 둔다.

## Phase 6. Create And Import Skill

* Goal:
  - Main Repository에 source skill을 생성하고 외부 skill을 import한다.
* Scope:
  - create source
  - import local folder
  - import target skill path
  - name conflict handling
  - source metadata
  - optional post-import analysis
* Required Changes:
  - `CreateSkill` use case를 구현한다.
  - `ImportSkillToMainRepository` use case를 구현한다.
  - minimal `SKILL.md` template을 application use case input으로 생성한다.
  - name conflict는 overwrite하지 않고 conflict output 또는 rename output을 반환한다.
  - source metadata에 origin 정보를 기록한다.
* Architecture Notes:
  - Template 생성 정책은 Presentation에 두지 않는다.
  - Import copy는 repository port를 통해 수행한다.
  - Analyzer 실행 여부는 use case input으로 명시한다.
* TDD Requirements:
  - create skill이 `skills/<name>/SKILL.md`에만 생성되는 테스트를 작성한다.
  - create skill이 global/project target에 자동 적용되지 않는 테스트를 작성한다.
  - invalid skill name이 생성되지 않는 테스트를 작성한다.
  - import conflict가 overwrite하지 않는 테스트를 작성한다.
  - import metadata origin이 기록되는 테스트를 작성한다.
* Configuration Rules:
  - create/import는 main repository path를 `RuntimeContext`에서 받는다.
  - command 실행 중 repository path를 다시 읽지 않는다.
* Logging Rules:
  - create/import 성공과 실패는 Product Log다.
  - conflict detail은 Field Debug Log다.
  - template fixture detail은 Development Log다.
* State Management:
  - import는 상태머신으로 관리한다.
  - 상태: `ValidatingInput`, `LoadingSourceFolder`, `CheckingNameConflict`, `WritingMainRepository`, `WritingMetadata`, `OptionalAnalysis`, `Completed`.
  - 실패 상태: `InvalidInput`, `SourceUnreadable`, `NameConflictBlocked`, `WriteFailed`, `AnalysisFailed`.
* Validation:
  - source 생성과 target 적용이 분리되어 있음을 acceptance test에 포함한다.
* Done Criteria:
  - 새 skill 생성과 import가 target을 변경하지 않는다.
  - import use case input의 `runAnalysisAfterImport`가 `true`이면 analyzer를 실행하고, `false`이면 분석 상태를 `Unanalyzed`로 기록한다.
* Risks:
  - import가 암묵적으로 apply까지 수행하면 프로젝트 원칙과 충돌한다.
  - import와 apply를 같은 command로 묶지 않는다.

## Phase 7. Apply And Remove Skill

* Goal:
  - source skill을 global/project target에 symlink/copy로 적용하고, 적용 항목을 source 삭제 없이 제거한다.
* Scope:
  - apply state machine
  - remove state machine
  - symlink apply
  - copy apply
  - metadata
  - conflict detection
  - risk blocking
  - remove safety
  - switch mode initial support
* Required Changes:
  - `ApplySkillToGlobalTarget`과 `ApplySkillToProjectTarget`을 구현한다.
  - `RemoveSkillFromGlobalTarget`과 `RemoveSkillFromProjectTarget`을 구현한다.
  - `SwitchApplyMode`는 MVP에서 symlink-to-copy와 copy-to-symlink 전환 계획, conflict decision, confirmation requirement output을 구현한다.
  - `.sponzey-applied.json` metadata를 기록한다.
  - Critical risk는 target write 전에 차단한다.
  - High risk는 explicit confirmation input 없이는 proceed하지 않는다.
  - external delete는 MVP에서 기본 차단한다.
* Architecture Notes:
  - Presentation은 confirmation을 수집해 use case input으로 전달한다.
  - Use case는 confirmation UI를 호출하지 않는다.
  - Filesystem write는 target store port 뒤에 둔다.
* TDD Requirements:
  - symlink apply가 link를 생성하는 테스트를 작성한다.
  - copy apply가 actual directory를 생성하는 테스트를 작성한다.
  - target conflict가 overwrite되지 않는 테스트를 작성한다.
  - Critical risk가 target write 전에 blocked result를 반환하는 테스트를 작성한다.
  - remove symlink가 source를 유지하는 테스트를 작성한다.
  - remove copy가 source를 유지하는 테스트를 작성한다.
  - remove external이 기본 차단되는 테스트를 작성한다.
* Configuration Rules:
  - apply mode default는 `RuntimeContext`에서 온다.
  - command 중간에 설정을 재조회해 apply mode를 바꾸지 않는다.
* Logging Rules:
  - apply/remove completed와 blocked는 Product Log다.
  - state transition은 Field Debug Log다.
  - fake target store call은 Development Log다.
* State Management:
  - ApplySkill 상태:

    `ValidatingInput -> LoadingSource -> LoadingTarget -> CheckingConflict -> AnalyzingRisk -> WaitingForRiskConfirmation -> WritingTarget -> WritingMetadata -> VerifyingResult -> Completed`
  - ApplySkill 실패 상태:

    `InvalidInput`, `SourceMissing`, `TargetUnavailable`, `ConflictDetected`, `RiskBlocked`, `WriteFailed`, `VerificationFailed`
  - RemoveAppliedSkill 상태:

    `ValidatingInput -> LoadingAppliedSkill -> CheckingManagedState -> CheckingLocalModification -> WaitingForConfirmation -> RemovingTargetEntry -> VerifyingSourceUntouched -> Completed`
  - RemoveAppliedSkill 실패 상태:

    `InvalidInput`, `AppliedSkillMissing`, `ExternalDeleteBlocked`, `TargetModified`, `RemoveFailed`, `SourceTouchedFailure`
* Validation:
  - 복잡한 내부 흐름이 flag 조합이 아니라 상태 전이로 표현되는지 테스트한다.
  - remove 후 source hash가 변하지 않았음을 검증한다.
* Done Criteria:
  - symlink/copy apply가 동작한다.
  - remove가 source를 삭제하지 않는다.
  - risk blocked path가 target write 전에 종료된다.
* Risks:
  - remove와 delete가 섞이면 데이터 손실이 발생한다.
  - use case 이름과 command 이름에서 remove/delete를 엄격히 구분한다.

## Phase 8. Transfer Target Skill To Main Repository

* Goal:
  - target skill을 Main Repository로 copy, backup, move한다.
* Scope:
  - transfer state machine
  - copy-to-main
  - backup-to-main
  - move-to-main
  - transfer metadata
  - audit record
  - conflict handling
* Required Changes:
  - `CopyAppliedSkillToMainRepository`를 구현한다.
  - `BackupAppliedSkillToMainRepository`를 구현한다.
  - `MoveAppliedSkillToMainRepository`를 구현한다.
  - `PromoteBackupToSkill`은 MVP에서 command로 노출하지 않는다. 단, backup metadata에 `promotedToSkillSourceId` 필드를 유지하고, promotion 가능 여부를 판단하는 domain policy decision만 구현한다.
  - backup path는 `backups/<timestamp>/<scope-client-skill>/` 형태로 생성한다.
  - backup metadata는 source target path, scope, client, apply mode, hash를 기록한다.
  - transfer operation audit record를 index 또는 metadata store에 기록한다.
* Architecture Notes:
  - backup/copy/move semantics는 별도 use case 또는 명확한 operation type으로 분리한다.
  - TransferPolicy는 domain에 둔다.
  - 실제 copy/remove는 repository/target ports를 통해 수행한다.
* TDD Requirements:
  - backup이 target을 변경하지 않는 테스트를 작성한다.
  - backup metadata가 source target path, scope, client, apply mode, hash를 기록하는 테스트를 작성한다.
  - copy가 `skills/` 아래 source를 만들고 target을 유지하는 테스트를 작성한다.
  - copy conflict가 overwrite하지 않는 테스트를 작성한다.
  - move가 cleanup confirmation 없이는 target을 제거하지 않는 테스트를 작성한다.
  - managed symlink가 Main Repository를 가리키면 move no-op을 반환하는 테스트를 작성한다.
  - broken symlink transfer가 diagnostic을 반환하는 테스트를 작성한다.
* Configuration Rules:
  - backup path root는 `RuntimeContext.backupPolicy`에서 받는다.
  - move cleanup default는 command 중간 설정 재조회 없이 input으로 전달한다.
* Logging Rules:
  - transfer copy/backup/move completed와 blocked는 Product Log다.
  - transfer transition은 Field Debug Log다.
  - fixture transfer trace는 Development Log다.
* State Management:
  - TransferSkill 상태:

    `ValidatingInput -> LoadingTargetSkill -> DetectingApplyMode -> CheckingNameConflict -> AnalyzingRisk -> PlanningTransfer -> WaitingForConfirmation -> WritingMainRepository -> WritingTransferMetadata -> OptionalTargetCleanup -> VerifyingResult -> Completed`
  - TransferSkill 실패 상태:

    `InvalidInput`, `TargetMissing`, `BrokenSymlink`, `NameConflictBlocked`, `RiskBlocked`, `WriteFailed`, `CleanupFailed`, `VerificationFailed`
  - Backup은 `OptionalTargetCleanup` 전이를 금지한다.
  - Copy는 `OptionalTargetCleanup` 전이를 금지한다.
  - Move는 confirmation 없이는 `OptionalTargetCleanup`으로 전이하지 않는다.
* Validation:
  - backup/copy/move 결과가 서로 다른 output type 또는 operation type을 가진다.
  - backup은 target hash가 전후 동일해야 한다.
* Done Criteria:
  - 전역/프로젝트 target skill을 Main Repository로 copy할 수 있다.
  - 전역/프로젝트 target skill을 backup snapshot으로 저장할 수 있다.
  - move는 target cleanup 여부를 명시적으로 확인한다.
* Risks:
  - copy/move conflict overwrite는 데이터 손실 위험이다.
  - overwrite는 MVP에서 기본 금지하고 rename 또는 backup 선택으로만 처리한다.

## Phase 9. Logging Infrastructure

* Goal:
  - Product Log, Field Debug Log, Development Log를 분리 구현하고 민감 정보 노출을 방지한다.
* Scope:
  - logger port
  - product logger adapter
  - field debug logger adapter
  - development logger adapter
  - masking policy
  - log tests
* Required Changes:
  - `LoggerPort`를 정의한다.
  - Product Log event schema를 정의한다.
  - Field Debug Log는 opt-in policy를 따른다.
  - Development Log는 local/test mode에서만 활성화한다.
  - path masking utility를 만든다.
  - secret-like value detection test를 만든다.
* Architecture Notes:
  - Domain은 logger에 의존하지 않는다.
  - Application이 log event를 생성한다.
  - Infrastructure가 출력 대상을 구현한다.
* TDD Requirements:
  - Product Log에 full home path가 포함되지 않는 테스트를 작성한다.
  - Product Log에 fake secret pattern이 포함되지 않는 테스트를 작성한다.
  - Field Debug Log가 disabled 상태에서 출력되지 않는 테스트를 작성한다.
  - Development Log가 production mode에서 no-op인 테스트를 작성한다.
* Configuration Rules:
  - logging mode는 시작 시 1회 RuntimeContext로 전달한다.
  - Field Debug Log 활성화 조건과 보존 기간은 중간 재조회하지 않는다.
* Logging Rules:
  - Product Log: 사용자 영향, 핵심 상태 변화, 장애 원인 추적 최소 정보만 기록한다.
  - Field Debug Log: 현장 재현용 transition/scan detail만 제한적으로 기록한다.
  - Development Log: 로컬 개발과 테스트에서만 fixture/mock detail을 기록한다.
* State Management:
  - 상태머신 terminal/failure state는 Product Log event로 매핑한다.
  - 상태머신 transition은 Field Debug Log event로 매핑한다.
* Validation:
  - 로그 3단계가 코드와 테스트에서 분리되어 있는지 확인한다.
  - 개발용 로그가 프로덕션 기본 동작에 포함되지 않는지 확인한다.
* Done Criteria:
  - 모든 use case가 logger port를 통해 이벤트를 전달할 수 있다.
  - 민감 정보 마스킹 테스트가 통과한다.
* Risks:
  - 로그가 domain에 들어가면 Clean Architecture 위반이다.
  - logger 구현체를 singleton으로 직접 호출하지 않는다.

## Phase 10. Presentation Layer And Commands

* Goal:
  - MVP 기능을 VSCode command palette, tree view, context menu로 사용할 수 있게 한다.
* Scope:
  - extension activation
  - use case factory wiring
  - command registry
  - tree views
  - context menu
  - input/confirmation collection
  - result mapping
* Required Changes:
  - MVP command를 등록한다.
  - Main Repository tree를 구현한다.
  - Global Skills tree를 구현한다.
  - Project Skills tree를 구현한다.
  - Diagnostics tree를 구현한다.
  - read model mapper를 구현한다.
  - confirmation dialog result를 use case input으로 전달한다.
  - error/result message mapper를 구현한다.
* Required Commands:

  ```text
  Sponzey Skills: Set Main Repository
  Sponzey Skills: Open Main Repository
  Sponzey Skills: Refresh Skills
  Sponzey Skills: Create Skill
  Sponzey Skills: Import Skill
  Sponzey Skills: Copy Applied Skill to Main Repository
  Sponzey Skills: Move Applied Skill to Main Repository
  Sponzey Skills: Backup Applied Skill to Main Repository
  Sponzey Skills: Analyze Skill
  Sponzey Skills: Analyze All Skills
  Sponzey Skills: Apply Skill Globally
  Sponzey Skills: Apply Skill to Project
  Sponzey Skills: Remove Skill from Global
  Sponzey Skills: Remove Skill from Project
  Sponzey Skills: Delete Skill from Main Repository
  Sponzey Skills: Switch Apply Mode
  Sponzey Skills: Show Skill Diagnostics
  ```
* Architecture Notes:
  - Presentation은 use case를 호출하고 result를 표시한다.
  - Presentation은 policy decision을 만들지 않는다.
  - Presentation은 filesystem adapter를 직접 호출하지 않는다.
* TDD Requirements:
  - command handler가 use case를 호출하고 domain policy를 구현하지 않는 테스트를 작성한다.
  - tree item mapper가 external marker, risk level, sync status를 표시하는 테스트를 작성한다.
  - Critical blocked result가 warning/error UI message로 mapping되는 테스트를 작성한다.
  - confirmation result가 use case input으로 전달되는 테스트를 작성한다.
* Configuration Rules:
  - command handler는 settings를 직접 읽지 않는다.
  - extension activation 또는 context rebuild flow에서만 RuntimeContext를 교체한다.
* Logging Rules:
  - UI command 시작 자체는 기본 Product Log로 남기지 않는다.
  - 사용자 영향이 있는 use case result만 Product Log로 남긴다.
  - UI input detail은 로그에 기록하지 않는다.
* State Management:
  - Presentation은 상태머신을 소유하지 않는다.
  - Presentation은 use case output의 state/result를 표시한다.
* Validation:
  - command palette MVP 명령이 등록되어 있는지 extension integration test로 확인한다.
  - tree view가 read model만 사용하는지 mapper test로 확인한다.
* Done Criteria:
  - MVP command와 tree view가 동작한다.
  - UI 계층에 도메인 정책이 없다.
* Risks:
  - UI부터 구현하면 정책이 command handler에 들어간다.
  - Phase 0-9 완료 전 tree view를 구현하지 않는다.

## Phase 11. Watchers, Refresh, And Release Hardening

* Goal:
  - 파일 변경 감지, refresh invalidation, acceptance test, manual smoke를 완성한다.
* Scope:
  - main repository watcher
  - target watcher
  - debounce refresh
  - stale analysis marker
  - acceptance tests
  - manual smoke checklist
  - release review gate
* Required Changes:
  - watcher adapter를 Infrastructure에 둔다.
  - watcher event는 use case를 우회하지 않고 refresh invalidation을 호출한다.
  - source 변경 시 analysis stale 표시를 만든다.
  - target 삭제 시 missing target 상태를 만든다.
  - broken symlink 상태를 refresh에서 재검출한다.
  - acceptance test suite를 작성한다.
  - manual smoke 문서를 작성한다.
* Architecture Notes:
  - Watcher는 파일 변경 이벤트 source일 뿐이다.
  - Watcher가 domain state를 직접 수정하지 않는다.
  - Refresh use case가 read model과 index를 갱신한다.
* TDD Requirements:
  - watcher event가 index invalidation을 호출하는 테스트를 작성한다.
  - source 변경 후 stale analysis가 표시되는 테스트를 작성한다.
  - target deletion 후 missing target이 표시되는 테스트를 작성한다.
  - broken symlink 재검출 테스트를 작성한다.
* Configuration Rules:
  - watcher 대상 경로는 RuntimeContext에서 받는다.
  - watcher 동작 중 settings를 재조회하지 않는다.
* Logging Rules:
  - watcher failure는 Product Log 또는 Field Debug Log 정책에 따라 분류한다.
  - debounce detail은 Field Debug Log다.
  - test watcher fixture trace는 Development Log다.
* State Management:
  - watcher는 상태머신이 아니라 event source다.
  - refresh flow가 복잡해지면 `RefreshStateMachine`을 둔다.
  - 상태: `Invalidated`, `LoadingIndex`, `ScanningSources`, `ScanningTargets`, `MergingReadModel`, `SavingIndex`, `Completed`.
  - 실패 상태: `IndexLoadFailed`, `ScanFailed`, `IndexSaveFailed`.
* Validation:
  - acceptance test는 temp directories만 사용한다.
  - manual smoke가 MVP 목표 13개를 모두 통과해야 한다.
* Done Criteria:
  - all unit tests pass.
  - all adapter tests pass.
  - extension integration smoke pass.
  - manual smoke checklist pass.
  - AGENTS.md prohibited pattern review 완료.
* Risks:
  - watcher가 실제 user home/global target을 건드릴 수 있다.
  - 테스트와 smoke는 temp path만 사용한다.

## 6. TDD Strategy

### 6.1 Test Pyramid

```text
Domain tests: many, no external I/O
Use case tests: many, fake ports
Adapter tests: focused, temp fixtures only
Presentation tests: mapper and command wiring
Extension integration tests: few, smoke-level
Manual smoke: release gate
```

### 6.2 Required Tests

반드시 포함한다.

1. Domain 계층이 외부 프레임워크에 의존하지 않는지 확인한다.
2. 유스케이스가 명시적 입력과 출력을 가지는지 확인한다.
3. 외부 환경 값이 프로그램 시작 이후 암묵적으로 재조회되지 않는지 확인한다.
4. 설정 값이 프로세스 중간에 삽입되거나 변경되지 않는지 확인한다.
5. 외부 API, DB, 파일시스템, 네트워크 접근이 경계 계층에만 존재하는지 확인한다.
6. 테스트 더블로 외부 의존성을 대체할 수 있는지 확인한다.
7. 로그가 3단계 정책에 맞게 분리되어 있는지 확인한다.
8. Development Log가 프로덕션 기본 동작에 포함되지 않는지 확인한다.
9. 복잡한 내부 흐름이 플래그 조합이 아니라 명시적 상태 전이로 표현되는지 확인한다.
10. 리팩터링과 기능 변경이 가능한 한 분리되어 있는지 확인한다.
11. Main Repository가 Global/Project Target으로 오인되지 않는지 확인한다.
12. remove가 source를 삭제하지 않는지 확인한다.
13. backup이 target을 변경하지 않는지 확인한다.
14. Critical risk가 target write 전에 apply를 차단하는지 확인한다.

### 6.3 Fixtures

테스트 fixture는 실제 사용자 환경을 건드리지 않는다.

```text
fixtures/
  skills/
    valid-minimal/
    missing-skill-md/
    missing-description/
    critical-rm-rf/
    critical-curl-sh/
    broad-description/
    missing-reference/
  targets/
    managed-symlink/
    managed-copy/
    external/
    broken-symlink/
```

Secret pattern 테스트는 실제 secret을 쓰지 않는다. `FAKE_TEST_TOKEN` 같은 fake value만 사용한다.

## 7. Configuration and Runtime Environment Policy

다음 정책은 모든 phase에 적용한다.

- 외부 설정 파일에 의존하는 설계를 기본값으로 삼지 않는다.
- 외부 환경 값은 activation/startup 시 최초 1회만 수신한다.
- 수신한 값은 validate, normalize 후 `RuntimeContext`로 만든다.
- `RuntimeContext`는 immutable하게 사용한다.
- 내부 흐름에서는 명시적 인자, 생성자 인자, 함수 인자, context 객체, dependency injection으로 전달한다.
- 유스케이스 내부에서 settings, environment, `.env`, process environment를 다시 읽지 않는다.
- 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- 설정 변경 이벤트가 필요하면 새 `RuntimeContext`를 만들어 use case factory를 다시 구성한다.

허용되는 흐름:

```text
Activation
-> SettingsReaderPort.readOnce()
-> RuntimeContextBuilder.validateAndNormalize()
-> UseCaseFactory.create(runtimeContext, ports)
-> Command invokes use case with explicit input
```

금지되는 흐름:

```text
Command Handler
-> read settings again
-> mutate process env
-> call filesystem directly
-> decide domain policy in UI
```

## 8. Logging Strategy

### 8.1 Product Log

목적:

- 사용자 영향과 핵심 상태 변화를 추적한다.
- 운영 중 장애 원인을 최소 정보로 찾는다.

허용:

- operation id
- skill name
- target scope
- client type
- result status
- diagnostic count
- masked path identifier

금지:

- `SKILL.md` 본문
- 사용자 파일 내용
- secret, token, API key
- full home path
- stack trace 전문

필수 이벤트:

```text
runtime.context.validation.failed
skill.scan.completed
skill.analysis.completed
skill.apply.completed
skill.apply.blocked
skill.remove.completed
skill.transfer.copy.completed
skill.transfer.backup.completed
skill.transfer.move.completed
skill.transfer.blocked
skill.create.completed
skill.import.completed
```

### 8.2 Field Debug Log

목적:

- 현장 재현과 상태 확인을 제한적으로 지원한다.

규칙:

- 기본 비활성화한다.
- 활성화 조건, 범위, 보존 기간을 RuntimeContext로 전달한다.
- path는 masking한다.
- 파일 내용은 기록하지 않는다.

이벤트:

```text
target.scan.step
apply.transition
remove.transition
transfer.transition
analysis.rule.completed
sync.hash.compared
config.validation.detail
watcher.event.received
```

### 8.3 Development Log

목적:

- 로컬 개발과 테스트 중 확인에만 사용한다.

규칙:

- 프로덕션 기본 동작에 포함하지 않는다.
- fixture 이름, fake port call summary, local-only diagnostic만 허용한다.

이벤트:

```text
fake.port.call
fixture.created
state.machine.trace
test.harness.step
```

## 9. State Machine Strategy

상태머신 적용 기준:

- 절차가 세 단계 이상이다.
- 실패 분기가 있다.
- 사용자 확인이 필요하다.
- 파일 변경 side effect가 있다.
- 로그 이벤트와 연결되어야 한다.

상태머신 산출물:

- 상태 목록
- 이벤트 목록
- 전이 조건
- guard condition
- 실패 상태
- 종료 상태
- side effect boundary
- transition tests
- log event mapping

MVP에서 상태머신을 반드시 적용할 절차:

- AnalyzeSkill
- ApplySkill
- RemoveAppliedSkill
- TransferSkill
- ImportSkill
- RefreshSkills

상태머신 금지 사항:

- boolean flag 조합으로 진행 상태 추론
- UI에서 상태 전이 직접 수행
- filesystem adapter 내부에서 상태머신 소유
- 실패 상태 없는 절차 흐름

## 10. Dependency and Boundary Rules

### 10.1 Ports

MVP port는 다음을 포함한다.

```text
SettingsReaderPort
SkillRepositoryPort
SkillTargetStorePort
SkillParserPort
HashPort
IndexStorePort
ClockPort
IdGeneratorPort
LoggerPort
WatcherPort
UiInputPort
```

### 10.2 Boundary Rules

- 외부 I/O는 Infrastructure adapter에만 둔다.
- UI input은 Presentation에서 수집하되 use case input으로 전달한다.
- Domain policy는 UI 문구를 반환하지 않는다.
- Application output은 Presentation이 표시할 수 있는 DTO로 변환된다.
- 테스트 더블은 모든 port에 대해 만들 수 있어야 한다.

## 11. Risk and Mitigation

| Risk                         | Impact           | Mitigation                                          | Verification                    |
| ---------------------------- | ---------------- | --------------------------------------------------- | ------------------------------- |
| Main Repository를 target으로 오인 | 의도치 않은 skill 활성화 | RepositoryPathPolicy                                | collision policy test           |
| remove가 source를 삭제           | 데이터 손실           | Remove state machine, source untouched verification | remove source hash test         |
| backup이 target을 변경           | 백업 의미 훼손         | Transfer state machine에서 cleanup 금지                 | target hash unchanged test      |
| copy/move conflict overwrite | 데이터 손실           | overwrite default ban                               | conflict test                   |
| Critical risk apply          | 보안 위험            | RiskPolicy block before write                       | write port not called test      |
| 설정 런타임 재조회                   | 예측 불가, 테스트 어려움   | RuntimeContext read-once                            | settings reader call count test |
| 로그 민감 정보 노출                  | 보안/신뢰 문제         | masking policy                                      | secret/full path log test       |
| UI에 domain policy 유입         | 유지보수 악화          | use case-only command handler                       | command handler test            |
| 상태 flag 조합 증가                | 절차 오류            | explicit state machine                              | transition test                 |
| 실제 user path 테스트 오염          | 데이터 손실           | temp fixture only                                   | test helper guard               |

## 12. Review Checklist

Architecture:

- Domain이 외부 framework에 의존하지 않는다.
- Application이 구체 adapter를 직접 생성하지 않는다.
- 외부 API, DB, 파일시스템, 네트워크 접근은 Infrastructure에만 있다.
- Presentation은 domain policy를 구현하지 않는다.
- 모든 유스케이스는 명시 input/output을 가진다.

Configuration:

- 외부 환경 값은 시작 시 1회만 수신된다.
- RuntimeContext는 immutable하다.
- 유스케이스 내부에서 settings/environment를 재조회하지 않는다.
- 프로세스 중간 환경 설정 삽입 또는 변경이 없다.

Logging:

- Product Log, Field Debug Log, Development Log가 분리되어 있다.
- Development Log는 프로덕션 기본 동작에 포함되지 않는다.
- 민감 정보와 full path가 로그에 없다.

State Machine:

- 복잡한 흐름은 명시적 상태 전이로 표현된다.
- 실패 상태와 종료 상태가 있다.
- 상태 전이 테스트가 있다.
- 상태 변경 로그가 로그 정책과 연결되어 있다.

TDD and Tidy First:

- 실패 테스트가 먼저 작성되었다.
- 리팩터링과 기능 변경이 분리되어 있다.
- 테스트 더블로 외부 의존성을 대체할 수 있다.
- adapter tests는 temp fixture만 사용한다.

Product Behavior:

- Main Repository와 Target이 분리되어 있다.
- source는 명시 apply 전까지 active로 표시되지 않는다.
- remove는 source를 삭제하지 않는다.
- backup은 target을 변경하지 않는다.
- move는 cleanup 여부를 명시 확인한다.
- Critical risk apply는 target write 전에 차단된다.

## 13. Definition of Done

MVP는 다음을 모두 만족해야 완료다.

- Main Repository와 target 개념이 코드, 테스트, UI에서 분리되어 있다.
- Main Repository source는 명시 apply 전까지 active skill로 표시되지 않는다.
- Main Repository, Global Skills, Project Skills, Diagnostics tree가 read model 기반으로 동작한다.
- create/import는 source만 생성하고 target을 변경하지 않는다.
- analyze는 `SKILL.md` 구조와 기본 위험도를 진단한다.
- symlink apply와 copy apply가 동작한다.
- remove는 source를 삭제하지 않는다.
- external skill을 감지한다.
- target skill을 Main Repository로 copy할 수 있다.
- target skill을 Main Repository에 backup snapshot으로 저장할 수 있고 target을 변경하지 않는다.
- target skill move는 target cleanup 여부를 명시 확인한다.
- Critical risk apply가 target write 전에 차단된다.
- RuntimeContext 이후 설정 재조회가 없다.
- Product Log, Field Debug Log, Development Log 경계가 구현되어 있다.
- Development Log는 production default에서 no-op이다.
- 상태머신 전이 테스트가 있다.
- unit, use case, adapter, integration smoke, manual smoke가 통과한다.
- AGENTS.md prohibited pattern review가 완료되었다.

## 14. Prohibited Implementation Patterns

다음을 구현하지 않는다.

- Domain에서 VSCode API 직접 호출
- Domain에서 파일시스템, 네트워크, 환경 변수 직접 접근
- 유스케이스 내부 settings 재조회
- process environment mutation
- 전역 mutable config singleton
- hidden service locator
- logger singleton 직접 호출
- UI command handler에 domain policy 구현
- filesystem adapter에서 overwrite/delete policy 결정
- boolean flag 조합으로 apply/remove/transfer 상태 관리
- Product Log에 민감 정보 기록
- Field Debug Log 기본 활성화
- Development Log 프로덕션 기본 포함
- 테스트 없는 기능 변경
- 테스트 없는 리팩터링
- backup 명령이 target을 변경하는 동작
- remove 명령이 source를 삭제하는 동작
- Main Repository를 Global Skill Target으로 암묵 취급

## 15. Next Actions

바로 진행할 작업 순서:

1. Phase 0의 scaffold와 import guard test를 작성한다.
2. Phase 1의 `RuntimeContext` 실패 테스트를 작성한다.
3. Main Repository와 Global Target 충돌 policy 테스트를 작성한다.
4. core value object와 entity를 최소 구현한다.
5. RiskPolicy와 TransferPolicy 테스트를 작성한다.
6. `SKILL.md` parser fixture를 만든다.
7. structure/security analyzer를 TDD로 구현한다.
8. repository initializer adapter를 temp fixture로 구현한다.
9. source/target scanner를 구현한다.
10. `RefreshSkills` read model을 만든다.

이 10개 작업이 끝나기 전에는 tree view를 구현하지 않는다. UI를 먼저 만들면 도메인 정책이 presentation layer에 들어갈 위험이 크다.
