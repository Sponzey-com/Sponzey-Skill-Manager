# AGENTS.md

## 1. Project Development Principles

이 문서는 Sponzey Skills Manager를 개발하는 코드 생성 에이전트, 개발자, 리뷰어가 반드시 따를 운영 지침이다. 모든 작업은 이 문서의 규칙을 기준으로 설계, 구현, 테스트, 리뷰한다.

다음 원칙을 프로젝트 전체에 적용하라.

1. Layered Architecture를 적용하라.
2. Clean Architecture를 적용하라.
3. Tidy First를 적용하라.
4. TDD를 적용하라.

프로젝트의 핵심 도메인을 다음처럼 정의하라.

- Main Skill Repository는 원본 스킬 저장소다.
- Main Skill Repository를 전역 스킬 적용 위치로 취급하지 마라.
- Global Skill Target과 Project Skill Target은 적용 대상이다.
- Skill Source와 Applied Skill을 분리하라.
- 스킬 적용, 해제, 복사, 이동, 백업, 분석은 유스케이스로 모델링하라.
- 파일시스템, VSCode API, 외부 agent client, 환경 변수, 로그 출력은 도메인 외부의 어댑터로 취급하라.

모든 변경은 다음 기준을 만족해야 한다.

- 도메인 규칙을 외부 프레임워크에 묶지 마라.
- 유스케이스 입력과 출력을 명확히 정의하라.
- 외부 입출력은 경계 계층에서만 수행하라.
- 테스트 가능한 구조를 먼저 만들라.
- 정리 작업과 기능 변경을 분리하라.
- 실패하는 테스트를 먼저 작성하고 최소 구현으로 통과시켜라.

## 2. Architecture Rules

계층을 다음처럼 분리하라.

```text
Presentation / Extension UI
Application / Use Cases
Domain
Infrastructure / Adapters
```

각 계층의 책임을 지켜라.

| Layer          | Responsibility                     | Must Not Do                 |
| -------------- | ---------------------------------- | --------------------------- |
| Presentation   | 명령, 트리 뷰, 사용자 입력, 화면 표시            | 도메인 규칙 구현, 파일시스템 직접 조작      |
| Application    | 유스케이스 조합, 트랜잭션 흐름, 포트 호출           | VSCode API 직접 의존, 숨겨진 환경 조회 |
| Domain         | 스킬, target, 분석 결과, 상태 전이, 정책       | 외부 API, 파일시스템, 로그 구현체 의존    |
| Infrastructure | 파일시스템, VSCode API, 설정 로딩, 외부 도구 연동 | 도메인 정책 결정                   |

도메인 모델을 외부 기술 이름으로 오염시키지 마라. 예를 들어 `SkillSource`, `SkillTarget`, `AppliedSkill`, `SkillBackup`, `SkillTransferOperation`, `SkillDiagnostic`은 도메인 개념으로 유지하라. VSCode, Node, filesystem, OS path, shell command는 포트 또는 어댑터 뒤에 숨겨라.

유스케이스를 중심으로 기능을 설계하라.

```text
CreateSkill
AnalyzeSkill
ApplySkillToGlobalTarget
ApplySkillToProjectTarget
RemoveAppliedSkill
CopyAppliedSkillToMainRepository
MoveAppliedSkillToMainRepository
BackupAppliedSkillToMainRepository
PromoteBackupToSkill
```

각 유스케이스는 다음 구조를 가져야 한다.

```text
Input
UseCase
Output
Ports
Domain Policies
```

유스케이스는 사용자 인터페이스와 인프라 세부사항을 알지 못하게 하라. 유스케이스는 포트 인터페이스를 호출하고, 어댑터가 실제 파일시스템, 설정, 로그, 외부 API를 처리하게 하라.

## 3. Dependency Direction

의존 방향을 반드시 안쪽으로 유지하라.

```text
Presentation -> Application -> Domain
Infrastructure -> Application / Domain Ports
Domain -> no outer layer
```

다음 의존을 허용하라.

- Presentation은 Application 유스케이스를 호출할 수 있다.
- Application은 Domain 모델과 Domain 서비스에 의존할 수 있다.
- Application은 포트 인터페이스에 의존할 수 있다.
- Infrastructure는 포트 인터페이스를 구현할 수 있다.
- Tests는 모든 계층을 검증할 수 있다.

다음 의존을 금지하라.

- Domain에서 VSCode API를 호출하지 마라.
- Domain에서 파일시스템, 네트워크, 환경 변수, 프로세스 정보를 직접 읽지 마라.
- Domain에서 logger 구현체를 직접 호출하지 마라.
- Application에서 구체 인프라 구현체를 직접 생성하지 마라.
- Presentation에서 도메인 정책을 조건문으로 재구현하지 마라.
- Infrastructure에서 유스케이스 정책을 결정하지 마라.

인터페이스와 구현체를 분리하라.

```text
Port: SkillRepository
Implementation: FileSystemSkillRepository

Port: SkillTargetStore
Implementation: LocalSkillTargetStore

Port: ProductLogger
Implementation: ExtensionProductLogger
```

포트는 Application 또는 Domain 경계에 두라. 구현체는 Infrastructure에 두라.

## 4. Configuration Policy

설정은 최소화하라. 외부 파일, 환경 파일, 외부 구성 파일에 의존하는 설계를 기본값으로 삼지 마라.

설정 원칙을 반드시 지켜라.

1. 외부 파일에 설정되는 내용은 최소화하라.
2. 설정 파일, 환경 파일, 외부 구성 파일에 의존하는 설계를 기본값으로 삼지 마라.
3. 실행 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 마라.
4. 외부 환경 상수는 프로그램 시작 시 최초 1회만 받아들여라.
5. 최초 수신 이후에는 외부 환경 상수를 전역 상수나 프로그램 상수처럼 사용하지 마라.
6. 내부 흐름에서는 명시적 인자, 생성자 인자, 함수 인자, 컨텍스트 객체, 의존성 주입 형태로 전달하라.
7. 암묵적 전역 접근, 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지하라.

허용되는 방식:

```text
Startup
  -> ReadExternalSettingsOnce
  -> ValidateSettings
  -> BuildRuntimeConfig
  -> Inject RuntimeConfig into UseCases
```

```pseudocode
settings = settingsReader.readOnceAtStartup()
runtimeConfig = RuntimeConfig.from(settings)
useCase = ApplySkillUseCase(runtimeConfig, skillRepository, targetStore)
```

거부해야 하는 방식:

```pseudocode
function applySkill(skill) {
  path = readEnvironment("GLOBAL_SKILLS_PATH")
  mode = readConfigFile(".env")
  mutateProcessEnv("APPLY_MODE", "copy")
  copySkill(skill, path, mode)
}
```

설정 값을 도메인 규칙으로 위장하지 마라. 설정은 외부 입력이고, 도메인 정책은 코드로 명시하라. 예를 들어 Critical 위험 스킬의 기본 차단 정책은 도메인 정책으로 구현하고, 설정은 차단 정책을 완화할 수 있는 명시적 입력으로만 전달하라.

설정 변경은 런타임 중간에 유스케이스 내부로 침투시키지 마라. 설정 변경 이벤트가 발생하면 새 RuntimeConfig를 만들고, 새 유스케이스 인스턴스 또는 컨텍스트로 명시적으로 전달하라.

## 5. Runtime Environment Handling

프로그램 시작 시 외부 환경을 한 번만 수신하라.

외부 환경에 포함되는 항목:

- workspace root
- main skill repository path
- global skill target paths
- project target relative paths
- enabled clients
- default apply mode
- risk policy settings
- logging mode

수신 절차를 고정하라.

```text
Read -> Validate -> Normalize -> Freeze RuntimeContext -> Inject
```

RuntimeContext는 읽기 전용 값 객체로 취급하라. 내부 함수에서 환경 값을 다시 조회하지 마라.

허용되는 전달 방식:

- 생성자 인자
- 함수 인자
- 유스케이스 input
- 요청 단위 context 객체
- 의존성 주입 container의 명시적 wiring

거부해야 하는 방식:

- 전역 변수로 설정 저장
- singleton에서 설정 조회
- 함수 내부에서 환경 변수 직접 조회
- 테스트 중 process 환경을 중간 변경
- 유스케이스 중간에 설정 파일 재로딩
- 숨겨진 helper가 외부 설정을 읽는 구조

외부 경로는 시작 시 normalize하고 validate하라. 유스케이스 내부에서는 검증된 path value object를 사용하라. Main Skill Repository가 Global Skill Target과 같거나 그 하위에 있으면 경고 또는 차단 정책을 적용하라.

## 6. Logging Policy

로그를 반드시 세 단계로 구분하라.

```text
Product Log
Field Debug Log
Development Log
```

로그 호출은 도메인 규칙을 오염시키지 않게 하라. Domain은 로그 구현체에 의존하지 않는다. Application은 로그 포트에 이벤트를 전달할 수 있다. Infrastructure가 실제 출력, 저장, 전송을 담당한다.

### 6.1 Product Log

목적:

- 프로덕트 운영용 최소 로그를 기록하라.
- 사용자 영향, 핵심 상태 변화, 장애 원인 추적에 필요한 최소 정보만 기록하라.

허용되는 정보:

- 유스케이스 시작과 종료
- 스킬 적용, 해제, 백업, 이동, 분석의 결과
- 실패한 작업의 오류 코드
- 사용자 영향이 있는 상태 변화
- target 경로의 안전하게 마스킹된 식별자

금지되는 정보:

- 민감 정보
- 사용자 파일 내용
- `SKILL.md` 전문
- secret, token, API key
- 과도한 내부 상태
- 테스트용 세부 정보
- stack trace 전체 기본 출력

사용 위치:

- Application 유스케이스 경계
- Infrastructure 작업 실패 경계
- 상태머신 종료 또는 실패 상태 진입 시점

예시:

```pseudocode
productLog.info("skill.apply.completed", {
  skillName,
  targetScope,
  clientType,
  applyMode,
  result
})
```

리뷰 기준:

- 로그가 사용자 문제 추적에 필요한가?
- 민감 정보가 포함되지 않았는가?
- 내부 구현 세부사항을 과도하게 드러내지 않는가?
- 동일 이벤트가 중복 기록되지 않는가?

### 6.2 Field Debug Log

목적:

- 운영 또는 고객 환경에서 문제 재현과 상태 확인을 위해 제한적으로 사용하라.
- Product Log보다 자세하지만, 민감 정보 보호 기준을 유지하라.

활성화 조건:

- 명시적 사용자 동의 또는 지원 절차에 따라 활성화하라.
- 범위와 기간을 지정하라.
- 기본값은 비활성화하라.

허용되는 정보:

- path 마스킹 후의 파일시스템 작업 단계
- target scan 결과 요약
- 상태머신 전이 이벤트
- 설정 validation 결과
- sync status 계산 결과
- 오류 원인 분류

금지되는 정보:

- secret, token, credential
- 스킬 본문 전문
- 사용자 소스 파일 내용
- 외부로 전송 가능한 개인정보
- 장기 보존되는 상세 실행 trace

사용 위치:

- 문제 재현이 어려운 파일시스템 경계
- symlink, copy, backup, move 처리 단계
- target scan과 sync 검사 단계
- 상태머신 transition 기록

예시:

```pseudocode
fieldDebugLog.debug("skill.backup.transition", {
  operationId,
  fromState,
  toState,
  event,
  maskedTargetPath
})
```

보존 기간:

- 기본 보존 기간을 짧게 유지하라.
- 보존 기간을 설정으로 받을 경우 시작 시 1회만 읽고 RuntimeContext로 전달하라.
- 지원 세션 종료 후 비활성화하라.

마스킹 기준:

- home directory, workspace path, repository path는 축약하거나 hash로 대체하라.
- 파일명은 필요한 경우만 기록하라.
- 값보다 분류와 상태를 우선 기록하라.

리뷰 기준:

- 활성화 조건이 명시되어 있는가?
- 로그 범위가 제한되어 있는가?
- 민감 정보 마스킹이 테스트되는가?
- Product Log로 충분한 정보를 중복 기록하지 않는가?

### 6.3 Development Log

목적:

- 로컬 개발, 테스트, 검증 과정에서만 사용하라.
- 구현 중 상태 확인과 테스트 진단을 돕기 위해 사용하라.

허용되는 정보:

- 테스트 fixture 이름
- mock call summary
- local-only diagnostic
- 개발 중 임시 trace
- 실패 테스트의 재현 정보

금지되는 정보:

- 프로덕션 빌드 또는 배포 결과물에 기본 포함
- 사용자 실제 데이터
- secret, token, credential
- 운영 환경에서 자동 활성화되는 상세 로그

사용 위치:

- 로컬 테스트
- 개발 전용 command
- test harness
- temporary diagnostic block

예시:

```pseudocode
developmentLog.trace("fakeTargetStore.write", {
  fixtureName,
  operationCount
})
```

리뷰 기준:

- 프로덕션 빌드에 기본 포함되지 않는가?
- 테스트 전용 코드가 제품 코드 흐름을 오염시키지 않는가?
- 임시 로그가 작업 완료 후 제거되었는가?
- Development Log가 Product Log 역할을 대신하지 않는가?

## 7. State Machine Policy

복잡한 내부 절차는 상태머신으로 관리하라. 암묵적 플래그 조합으로 흐름을 관리하지 마라.

상태머신을 적용할 대상:

- skill apply
- skill remove
- skill backup
- skill move
- skill import
- copy mode sync
- risk analysis
- target scan
- backup promotion

상태머신은 다음 요소를 명시해야 한다.

- State
- Event
- Transition
- Guard condition
- Failure state
- Terminal state
- Side effect boundary

예시:

```text
Idle
  -> ValidatingInput
  -> CheckingConflict
  -> AnalyzingRisk
  -> WritingTarget
  -> VerifyingResult
  -> Completed

Failure states:
  InvalidInput
  ConflictDetected
  RiskBlocked
  WriteFailed
  VerificationFailed
```

상태 전이는 테스트 가능해야 한다.

```pseudocode
machine = ApplySkillStateMachine()
next = machine.transition(CheckingConflict, ConflictFound)
assert(next.state == ConflictDetected)
assert(next.productLogEvent == "skill.apply.conflict")
```

상태 변경은 로그 정책과 연결하라.

- Product Log는 terminal state와 사용자 영향이 있는 failure state를 기록한다.
- Field Debug Log는 제한적으로 transition trace를 기록한다.
- Development Log는 테스트와 로컬 검증에서만 상세 상태를 기록한다.

상태머신은 Domain 또는 Application 유스케이스 규칙 안에 둔다. UI, VSCode API, 파일시스템 어댑터, 외부 client adapter에 상태머신을 종속시키지 마라.

## 8. TDD Policy

모든 의미 있는 변경은 TDD 사이클로 수행하라.

반드시 다음 순서를 지켜라.

1. 실패하는 테스트를 먼저 작성하라.
2. 테스트를 통과하는 최소 구현을 작성하라.
3. 중복과 구조 문제를 정리하라.
4. 외부 의존성은 테스트 더블, 포트, 인터페이스로 대체 가능하게 하라.
5. 설정, 로그, 상태 전이, 오류 처리도 테스트 대상에 포함하라.

테스트 대상을 계층별로 분리하라.

| Test Type        | Target                                   | External Dependency |
| ---------------- | ---------------------------------------- | ------------------- |
| Domain test      | 정책, 값 객체, 상태 전이                          | 없음                  |
| Use case test    | 입력, 출력, 포트 호출, 오류 처리                     | fake port           |
| Adapter test     | 파일시스템, VSCode API wrapper, path handling | test fixture        |
| Integration test | 실제 계층 조합                                 | 제한된 sandbox         |

테스트 더블을 명시적으로 사용하라.

```pseudocode
fakeSkillRepository = FakeSkillRepository()
fakeTargetStore = FakeTargetStore()
useCase = BackupAppliedSkillToMainRepository(fakeSkillRepository, fakeTargetStore)
```

다음 테스트를 반드시 포함하라.

- Main Skill Repository가 Global Skill Target으로 오인되지 않는지 검증
- symlink apply와 copy apply의 차이 검증
- remove가 source를 삭제하지 않는지 검증
- backup이 target을 변경하지 않는지 검증
- move가 target 제거 여부를 명시적으로 요구하는지 검증
- Critical risk skill 적용 차단 검증
- 설정값이 시작 시 1회만 수신되는지 검증
- 상태머신 실패 상태 전이 검증
- 로그에 민감 정보가 포함되지 않는지 검증

테스트 없이 구현하지 마라. 테스트가 어려운 구조는 구조가 잘못된 것이다.

## 9. Tidy First Policy

기능 변경 전에 작은 정리 작업을 먼저 수행하라. 단, 정리 작업과 기능 변경을 섞지 마라.

Tidy First 작업의 예:

- 이름 정리
- 함수 추출
- 중복 제거
- 타입 또는 값 객체 도입
- 테스트 fixture 정리
- 포트 인터페이스 분리
- dead code 제거
- 작은 파일 이동

Tidy First 규칙:

- 정리 작업은 behavior를 변경하지 마라.
- 정리 작업은 테스트로 보호하라.
- 리팩터링과 기능 변경은 별도 커밋으로 분리하라.
- 같은 PR 안에 포함하더라도 커밋과 설명을 분리하라.
- 정리 작업이 커지면 별도 작업으로 분리하라.

기능 변경 규칙:

- 정리 후 실패 테스트를 추가하라.
- 최소 구현으로 테스트를 통과시켜라.
- 통과 후 중복과 구조 문제를 정리하라.
- 정리 중 behavior를 바꾸지 마라.

거부해야 하는 방식:

```text
Refactor parser, change apply behavior, add settings, and fix logs in one untested commit.
```

허용되는 방식:

```text
Commit 1: Extract SkillTargetPath value object with no behavior change.
Commit 2: Add failing tests for project target backup.
Commit 3: Implement project target backup.
Commit 4: Tidy duplicated backup metadata creation.
```

## 10. Code Review Checklist

리뷰어는 다음 항목을 반드시 확인하라.

Architecture:

- 계층 간 의존 방향이 유지되는가?
- Domain이 외부 프레임워크에 의존하지 않는가?
- Application이 구체 인프라 구현체를 직접 생성하지 않는가?
- 외부 I/O가 경계 계층에만 있는가?
- 인터페이스와 구현체가 분리되었는가?

Domain and Use Cases:

- 유스케이스 입력과 출력이 명확한가?
- Main Skill Repository와 Global/Project Target이 분리되어 있는가?
- 삭제와 적용 해제가 분리되어 있는가?
- backup, copy, move의 의미가 혼동되지 않는가?
- 위험도 정책이 UI가 아닌 도메인 또는 유스케이스 규칙에 있는가?

Configuration:

- 설정을 시작 시 1회만 읽는가?
- 내부 흐름에서 설정을 명시적으로 전달하는가?
- 환경 변수 또는 설정 파일을 숨겨진 helper가 읽지 않는가?
- 런타임 중간에 설정을 mutate하지 않는가?

Logging:

- Product Log, Field Debug Log, Development Log가 분리되어 있는가?
- 민감 정보가 로그에 포함되지 않는가?
- Field Debug Log 활성화 조건과 보존 기간이 명시되어 있는가?
- Development Log가 배포 결과물에 기본 포함되지 않는가?

State Machine:

- 복잡한 절차가 상태, 이벤트, 전이로 표현되어 있는가?
- 실패 상태와 종료 상태가 명시되어 있는가?
- 상태 전이가 테스트되는가?
- 상태 변경 로그가 로그 정책을 따르는가?

Testing:

- 실패 테스트가 먼저 작성되었는가?
- 도메인 테스트가 외부 I/O 없이 실행되는가?
- 유스케이스 테스트가 fake port로 외부 의존성을 대체하는가?
- 설정, 로그, 상태 전이, 오류 처리가 테스트되는가?
- 테스트가 구현 세부사항보다 행동을 검증하는가?

Tidy First:

- 정리 작업과 기능 변경이 분리되어 있는가?
- 리팩터링이 behavior를 변경하지 않는가?
- 큰 정리 작업이 독립 작업으로 분리되었는가?

## 11. Prohibited Patterns

다음 패턴을 금지한다.

- Domain에서 VSCode API 직접 호출
- Domain에서 파일시스템 직접 접근
- Domain에서 환경 변수 직접 조회
- 유스케이스 내부에서 설정 파일 재로딩
- 전역 mutable 설정 객체
- hidden singleton service locator
- 런타임 중간 process environment 변경
- 암묵적 전역 logger 호출
- 테스트를 위해 제품 코드에 분기 추가
- 외부 I/O와 도메인 정책이 섞인 함수
- UI command handler 안에 도메인 규칙 구현
- 복잡한 절차를 boolean flag 조합으로 관리
- 실패 상태 없는 절차 흐름
- Product Log에 민감 정보 기록
- Field Debug Log를 기본 활성화
- Development Log를 프로덕션 빌드에 기본 포함
- 테스트 없는 리팩터링
- 테스트 없는 기능 변경
- 리팩터링과 기능 변경을 하나의 변경으로 섞기
- Critical risk skill을 명시적 정책 없이 적용
- backup 명령이 target을 변경하는 동작
- remove 명령이 source를 삭제하는 동작
- Main Skill Repository를 Global Skill Target으로 암묵 취급

## 12. Required Agent Behavior

코드 생성 에이전트는 다음 절차를 반드시 따른다.

1. 작업 전에 `PROJECT.md`와 이 문서를 읽고 요구사항을 확인하라.
2. 변경 범위를 파악하고 관련 계층을 식별하라.
3. 기능 변경 전에 필요한 Tidy First 작업을 분리하라.
4. 실패하는 테스트를 먼저 작성하라.
5. 도메인 규칙을 Domain 또는 Application에 배치하라.
6. 외부 I/O를 포트와 어댑터 뒤에 숨겨라.
7. 설정값은 RuntimeContext 또는 명시적 인자로 전달하라.
8. 로그는 Product, Field Debug, Development 중 하나로 분류하라.
9. 복잡한 내부 절차는 상태머신으로 모델링하라.
10. 구현 후 테스트를 실행하고 결과를 보고하라.
11. 테스트를 실행하지 못하면 그 이유를 명확히 기록하라.
12. 사용자 변경사항을 되돌리지 마라.
13. 관련 없는 리팩터링을 수행하지 마라.
14. 문서와 코드가 충돌하면 문서를 먼저 갱신하거나 사용자에게 확인하라.

에이전트는 다음 질문에 답할 수 있어야 한다.

- 이 변경은 어느 유스케이스에 속하는가?
- 도메인 규칙은 어디에 있는가?
- 외부 I/O는 어떤 포트 뒤에 있는가?
- 설정값은 어디에서 최초 수신되고 어떻게 전달되는가?
- 어떤 테스트가 먼저 실패했는가?
- 어떤 로그가 Product Log이고 어떤 로그가 Field Debug Log인가?
- 상태머신이 필요한 흐름인가?
- 이 변경에 Tidy First 작업이 포함되어 있는가?

## 13. Example Decision Rules

다음 결정 규칙을 적용하라.

### 13.1 Main Repository vs Global Target

요구사항이 "스킬을 저장한다"이면 Main Skill Repository에 저장하라.

요구사항이 "agent가 사용할 수 있게 한다"이면 Global 또는 Project Target에 명시적으로 적용하라.

Main Skill Repository에 존재한다는 이유만으로 스킬을 활성 상태로 표시하지 마라.

### 13.2 Remove vs Delete

요구사항이 "프로젝트에서 제거한다"이면 target의 Applied Skill만 제거하라.

요구사항이 "원본을 삭제한다"이면 Main Skill Repository의 Skill Source 삭제로 처리하라.

명령명, 로그, 테스트에서 remove와 delete를 구분하라.

### 13.3 Backup vs Copy vs Move

요구사항이 "현재 상태를 보존한다"이면 Backup to Main Repository를 사용하라. target을 변경하지 마라.

요구사항이 "원본 후보로 가져온다"이면 Copy to Main Repository를 사용하라. target을 유지하라.

요구사항이 "메인 리포지토리 중심 관리로 옮긴다"이면 Move to Main Repository를 사용하라. target 제거 또는 managed link 전환을 명시적으로 확인하라.

### 13.4 Symlink vs Copy Apply

사용자가 원본 변경을 즉시 반영하려면 symlink를 사용하라.

사용자가 프로젝트 독립성과 이식성을 원하면 copy를 사용하라.

적용 방식은 AppliedSkill의 상태로 저장하고 목록에 표시하라.

### 13.5 Risk Policy

Risk가 Critical이면 기본 적용을 차단하라.

Risk가 High이면 명시 확인을 요구하라.

Risk가 Medium 또는 Low이면 정책에 따라 적용하되 진단 정보를 유지하라.

위험도 판단을 UI handler에 두지 마라.

### 13.6 Configuration Handling

새 설정이 필요하면 먼저 기본값 없이도 동작 가능한 설계를 검토하라.

설정이 반드시 필요하면 시작 시 1회 수신하고 RuntimeContext로 전달하라.

함수 내부에서 설정 파일이나 환경 변수를 읽지 마라.

### 13.7 Logging Choice

사용자 영향이 있는 완료 또는 실패 이벤트는 Product Log로 기록하라.

현장 재현에 필요한 제한적 상세 상태는 Field Debug Log로 기록하라.

로컬 개발 중 임시 확인 정보는 Development Log로 기록하라.

어떤 로그에도 민감 정보를 기록하지 마라.

### 13.8 State Machine Choice

절차가 세 단계 이상이고 실패 분기가 있으면 상태머신을 사용하라.

상태 전이가 사용자 영향이나 파일 변경을 일으키면 transition test와 로그 이벤트를 추가하라.

boolean flag 조합으로 진행 상태를 추론하지 마라.
