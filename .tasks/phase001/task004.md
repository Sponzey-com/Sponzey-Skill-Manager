# Task 004. Skill Parser And Static Analyzer

## 1. Task Purpose

- [x] 이 태스크의 목적은 `SKILL.md` 구조 분석과 기본 위험도 분석을 구현하는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 3 목표인 manifest parse, structure rules, description rules, security rules, risk aggregation에 기여한다.
- [x] 이 태스크 완료 후 analyzer는 파일시스템 adapter 없이 in-memory skill directory input으로 diagnostics와 risk level을 산출해야 한다.

## 2. Current Context

- [x] Task 001에서 scaffold와 architecture guard를 완료했다.
- [x] Task 002에서 RuntimeContext와 설정 경계를 완료했다.
- [x] Task 003에서 core domain model과 policies를 완료했다.
- [x] 이번 태스크를 시작해야 하는 이유는 apply/transfer 정책이 사용할 skill risk diagnostic이 필요하기 때문이다.

## 3. Scope

### Included

- [x] `SKILL.md` frontmatter parser를 만든다.
- [x] structure/description/reference rule을 만든다.
- [x] destructive command와 secret exfiltration 기본 security rule 및 risk aggregation을 만든다.

### Excluded

- [x] 실제 filesystem adapter를 구현하지 않는다.
- [x] VSCode UI와 command를 구현하지 않는다.
- [x] rule enable/disable 설정을 구현하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] in-memory skill directory에서 `SKILL.md`를 parse한다.
- [x] 입력은 `{ directoryName, files }` 객체다.
- [x] 출력은 manifest, body, diagnostics다.
- [x] 성공 조건은 valid frontmatter의 `name`, `description`을 읽는 것이다.
- [x] 실패 조건은 missing `SKILL.md` 또는 parse 실패가 diagnostic 없이 통과하는 것이다.

### Functional Unit 2

- [x] structure/description/reference rules를 실행한다.
- [x] 입력은 parsed manifest, body, file map이다.
- [x] 출력은 warning/high diagnostics다.
- [x] 성공 조건은 missing description, broad description, missing referenced file을 진단하는 것이다.
- [x] 실패 조건은 invalid skill이 Low risk로 통과하는 것이다.

### Functional Unit 3

- [x] security rules와 risk aggregation을 실행한다.
- [x] 입력은 `SKILL.md` body와 manifest다.
- [x] 출력은 `riskLevel`과 critical/high diagnostics다.
- [x] 성공 조건은 `rm -rf`, `curl | sh`, secret exfiltration pattern을 Critical로 분류하는 것이다.
- [x] 실패 조건은 Critical pattern이 target write 전에 block 가능한 risk로 산출되지 않는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `application/analysis`다.
- [x] Analyzer는 filesystem을 직접 읽지 않는다.
- [x] Parser는 in-memory text를 parse하며, 실제 파일 읽기는 후속 filesystem adapter가 담당한다.
- [x] Domain policy와 연결 가능한 `riskLevel` 값을 반환한다.
- [x] 필요한 포트는 이번 태스크에서 interface 형태로 문서화하지 않고, input DTO로 경계를 둔다.
- [x] 전역 상태, 숨겨진 I/O, 암묵적 설정 접근을 피한다.

## 6. Configuration Rules

- [x] rule enable/disable 설정을 추가하지 않는다.
- [x] 환경 값은 이번 태스크에서 사용하지 않는다.
- [x] 최초 수신 이후 환경 값을 전역 상수처럼 사용하는 구조를 만들지 않는다.
- [x] analyzer는 명시 input만 받는다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지한다.

## 7. Logging Requirements

### Product Log

- [x] Product Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] analyzer result는 `skill.analysis.completed` event로 변환 가능한 `riskLevel`과 diagnostic count를 포함한다.
- [x] 민감 정보와 과도한 내부 상태를 기록하지 않는다.

### Field Debug Log

- [x] Field Debug Log는 이번 태스크에서 직접 출력하지 않는다.
- [x] rule result는 `analysis.rule.completed` event로 변환 가능한 rule code를 포함한다.
- [x] skill body 전문을 diagnostic에 기록하지 않는다.
- [x] 보존 범위와 사용 범위는 이번 태스크 범위가 아니다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 만들지 않는다.
- [x] 테스트 완료 후 임시 debug 코드를 남기지 않는다.

## 8. State Machine Requirements

- [x] AnalyzeSkill 흐름은 이번 태스크에서 명시적인 단계 배열로 표현한다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록은 `LoadingSkillDirectory`, `ParsingSkillMd`, `RunningStructureRules`, `RunningSecurityRules`, `CalculatingRisk`, `Completed`로 정의한다.
- [x] 이벤트 목록은 이번 태스크에서 구현하지 않고 result trace로 남긴다.
- [x] 전이 조건은 missing skill file과 parse result 기준으로 표현한다.
- [x] 실패 상태는 `MissingSkillMd`, `ParseFailed`, `AnalysisFailed` diagnostic code로 표현한다.
- [x] 상태 전이는 result `steps` 배열로 테스트 가능하게 만든다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상 유스케이스는 `analyzeSkillDirectory`다.
- [x] 정상 케이스 테스트는 valid minimal skill이 Low risk를 반환하는지 검증한다.
- [x] 실패 케이스 테스트는 missing `SKILL.md`, missing description, critical pattern을 검증한다.
- [x] 경계값 테스트는 missing referenced file을 warning으로 검증한다.
- [x] 외부 의존성은 in-memory file map으로 대체한다.
- [x] 설정 값 전달 방식 테스트는 analyzer가 설정을 읽지 않는 것으로 검증한다.
- [x] 로그 정책 검증은 diagnostic이 body 전문을 포함하지 않는 것으로 검증한다.
- [x] 상태 전이가 있다면 `steps` 배열을 검증한다.
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

- [x] 수행한 변경 사항을 요약한다.
  - `analyzeSkillDirectory` 유스케이스를 추가하여 in-memory skill directory 입력에서 `SKILL.md`를 parse하고 manifest, body, diagnostics, riskLevel, steps를 반환하도록 했다.
  - missing `SKILL.md`, missing name/description, directory mismatch, broad description, missing reference, destructive command, curl pipe shell, secret exfiltration pattern을 diagnostic으로 분류했다.
  - 분석 흐름을 `LoadingSkillDirectory`, `ParsingSkillMd`, `RunningStructureRules`, `RunningDescriptionRules`, `RunningSecurityRules`, `CalculatingRisk`, `Completed` steps로 노출해 상태 전이를 테스트 가능하게 했다.
  - diagnostic message에 skill body 원문을 포함하지 않도록 구현해 Field Debug Log와 Product Log로 변환될 때 민감 정보 노출 위험을 낮췄다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 생성: `src/application/analysis/analyze-skill-directory.js`
  - 수정: `src/application/index.js`
  - 생성: `test/application/analyze-skill-directory.test.mjs`
  - 수정: `.tasks/task004.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 22 tests / 22 pass
  - `npm run check:architecture`: 통과, 9 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - analyzer가 filesystem, VSCode API, 환경 변수, 전역 설정에 접근하지 않는지 확인했다.
  - 유스케이스 입력과 출력이 명시적인지 확인했다.
  - missing `SKILL.md`가 Critical risk로 target write 전에 차단 가능한 형태인지 확인했다.
  - High/Critical diagnostic이 domain risk policy와 연결 가능한 `riskLevel` 값을 가지는지 확인했다.
  - 상태 전이가 `steps` 배열로 테스트 가능하게 노출되는지 확인했다.
  - diagnostic message가 destructive command 본문을 그대로 포함하지 않는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - frontmatter parser는 MVP용 단순 `key: value` parser이며 YAML 전체 문법을 지원하지 않는다.
  - security rule은 기본 패턴만 다루며 allowlist, suppression, rule versioning은 아직 없다.
  - reference detection은 `references/...` 경로만 탐지하며 `./references/...` 같은 변형은 후속 태스크에서 확장해야 한다.
  - 실제 파일 읽기, symlink 판별, copy/write 작업은 아직 구현되지 않았다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 filesystem adapter와 main repository storage 경계를 구현한다.
  - 후속 adapter는 `analyzeSkillDirectory`에 파일 내용을 직접 주입해야 하며 analyzer 내부에 filesystem 접근을 추가하면 안 된다.
  - repository scanner는 `SKILL.md`가 있는 디렉토리만 skill source 후보로 반환해야 한다.
  - repository metadata는 외부 설정이 아니라 repository 내부 상태 파일로 취급하고, domain/application 규칙을 침범하지 않도록 infrastructure adapter 뒤에 숨겨야 한다.

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
  - 다음 태스크 파일명은 `.tasks/task005.md`로 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - 다음 태스크는 main repository filesystem adapter와 storage read/write를 2~3개 기능 단위로 제한한다.
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
