# Task 011. Symlink Apply Primitive And Mode Branch

## 1. Task Purpose

- [x] 이 태스크의 목적은 source skill을 target에 symlink mode로 적용하는 filesystem primitive와 application apply mode branch를 구현하는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 7 목표 중 symlink apply와 apply mode selection을 다룬다.
- [x] 이 태스크 완료 후 `applySkillToTarget`은 `copy`와 `symlink` apply mode를 모두 지원해야 한다.

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
- [x] 이번 태스크를 시작해야 하는 이유는 MVP 요구사항이 symlink 또는 copy apply mode 선택을 포함하기 때문이다.

## 3. Scope

### Included

- [x] `FileSystemTargetStore.linkSkillToTarget({ sourcePath, targetRootPath, skillName })` primitive를 구현한다.
- [x] symlink destination overwrite를 기본 거부한다.
- [x] symlink target path traversal을 거부한다.
- [x] `applySkillToTarget`에서 `applyMode: "symlink"` branch를 지원한다.
- [x] risk blocking은 copy mode와 동일하게 target write 전에 수행한다.

### Excluded

- [x] switch apply mode는 구현하지 않는다.
- [x] symlink metadata sidecar는 구현하지 않는다.
- [x] Windows-specific privilege escalation 안내는 구현하지 않는다.
- [x] VSCode command와 UI는 구현하지 않는다.
- [x] transfer/copy/backup/move to main repository는 구현하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] safe symlink creation primitive를 구현한다.
- [x] 입력은 source path, target root path, skill name이다.
- [x] 출력은 `{ ok, targetPath, linkTargetPath, error }` 형태의 result다.
- [x] 성공 조건은 target root 아래 skill name 경로가 source path를 가리키는 symlink가 되는 것이다.
- [x] 실패 조건은 existing destination overwrite 또는 path traversal이 허용되는 것이다.

### Functional Unit 2

- [x] application apply mode branch를 구현한다.
- [x] `copy` mode는 기존 copy primitive를 사용한다.
- [x] `symlink` mode는 link primitive를 사용한다.
- [x] unsupported mode는 typed blocked result를 반환한다.

### Functional Unit 3

- [x] symlink apply 결과가 target scan에서 managed symlink로 인식되는지 검증한다.
- [x] known source path와 resolved symlink target이 일치해야 한다.
- [x] 성공 조건은 scan output kind가 `managed-symlink`인 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `application/apply`와 `infrastructure/filesystem`이다.
- [x] Application은 concrete infrastructure class를 import하지 않는다.
- [x] Filesystem symlink creation은 target store port 뒤에 둔다.
- [x] Domain/Application에는 filesystem import를 추가하지 않는다.
- [x] risk policy는 adapter가 아니라 application/domain에서 target write 전에 평가한다.

## 6. Configuration Rules

- [x] apply mode는 input 또는 `context.defaultApplyMode`에서만 온다.
- [x] symlink capability나 target path를 settings reader에서 재조회하지 않는다.
- [x] source path와 target root path는 input DTO에서만 받는다.
- [x] runtime 중간에 환경 값을 조회하거나 변경하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] 실제 Product Log 출력은 하지 않는다.
- [x] output `events`에 `skill.apply.completed` 또는 `skill.apply.blocked` 후보를 포함한다.
- [x] Product Log 후보는 skill name, target id, apply mode, result code 수준으로 제한한다.

### Field Debug Log

- [x] 실제 Field Debug Log 출력은 하지 않는다.
- [x] risk accepted event는 기존 copy mode와 동일하게 반환한다.
- [x] symlink target full debug는 필요한 경우 Field Debug 후보로만 표현하고 파일 내용은 포함하지 않는다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 debug print를 남기지 않는다.

## 8. State Machine Requirements

- [x] apply 상태 전이는 기존 `applySkillToTarget` steps를 유지한다.
- [x] symlink mode도 `ValidatingInput`, `AnalyzingRisk`, `CheckingRiskPolicy`, `WritingTarget`, `VerifyingResult`, `Completed` 순서를 따른다.
- [x] 실패 상태는 `RiskBlocked`, `UnsupportedApplyMode`, `WriteFailed`로 표현한다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] infrastructure symlink 테스트는 temp source와 temp target root를 사용한다.
- [x] symlink scan 테스트는 created symlink가 `managed-symlink`로 분류되는지 검증한다.
- [x] overwrite/path traversal rejection 테스트는 typed error를 검증한다.
- [x] application symlink mode 테스트는 target store link primitive가 호출되는지 검증한다.
- [x] Critical risk symlink apply 테스트는 target store가 호출되지 않는지 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 작성한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현을 작성한다.
- [x] 계층 간 의존성을 확인한다.
- [x] Application이 concrete infrastructure를 import하지 않는지 확인한다.
- [x] 외부 파일시스템 접근이 infrastructure 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] 실제 logger 출력 없이 event 후보만 반환하는지 확인한다.
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
- [x] 복잡한 흐름이 플래그 조합이 아니라 명시적 상태로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

- [x] 수행한 변경 사항을 요약한다.
  - `FileSystemTargetStore.linkSkillToTarget` symlink primitive를 추가했다.
  - symlink destination overwrite와 path traversal을 typed error로 거부하도록 했다.
  - 생성된 symlink가 `scanAppliedSkills`에서 known source path 기준 `managed-symlink`로 분류되는지 검증했다.
  - `applySkillToTarget`이 `applyMode: "symlink"`를 지원하도록 mode branch를 추가했다.
  - symlink mode에서도 copy mode와 동일하게 risk analysis와 domain risk policy를 target write 전에 적용하도록 유지했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 수정: `src/infrastructure/filesystem/file-system-target-store.js`
  - 수정: `src/application/apply/apply-use-cases.js`
  - 수정: `test/infrastructure/file-system-target-store.test.mjs`
  - 수정: `test/application/apply-use-cases.test.mjs`
  - 수정: `.tasks/task011.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 52 tests / 52 pass
  - `npm run check:architecture`: 통과, 14 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - symlink creation이 target root 아래 `skillName` 경로에만 생성되는지 확인했다.
  - symlink overwrite가 `target-overwrite-rejected`로 차단되는지 확인했다.
  - symlink path traversal이 `target-path-traversal-rejected`로 차단되는지 확인했다.
  - symlink apply mode가 target store `linkSkillToTarget` port를 호출하는지 확인했다.
  - symlink apply mode도 기존 apply state steps를 유지하는지 확인했다.
  - Application이 concrete infrastructure adapter를 import하지 않는지 확인했다.
  - filesystem import가 infrastructure 계층에만 존재하는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - switch apply mode는 아직 없다.
  - symlink creation failure에 대한 platform-specific diagnostic은 공통 filesystem failure로만 반환된다.
  - symlink apply에는 copy mode처럼 `.sponzey-applied.json` metadata가 없고, managed 판별은 known source path matching에 의존한다.
  - UI에서 symlink capability 안내는 아직 없다.
  - transfer/copy/backup/move to main repository는 아직 없다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 Phase 8의 target skill to main repository transfer 중 copy/backup을 우선 구현해야 한다.
  - backup은 target을 변경하지 않는 snapshot이어야 한다.
  - copy to main은 source conflict를 overwrite하지 않아야 한다.
  - move to main은 target cleanup confirmation이 필요하므로 copy/backup 후 별도 태스크로 분리한다.

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
  - 다음 태스크 파일명은 `.tasks/task012.md`로 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - 다음 태스크는 target skill을 Main Repository로 copy/backup하는 유스케이스와 repository primitive만 다룬다.
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
