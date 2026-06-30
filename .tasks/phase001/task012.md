# Task 012. Copy And Backup Target Skill To Main Repository

## 1. Task Purpose

- [x] 이 태스크의 목적은 Global/Project Target에 존재하는 skill을 Main Repository로 copy하거나 backup snapshot으로 저장하는 유스케이스를 구현하는 것이다.
- [x] 이 태스크는 `.tasks/plan.md`의 Phase 8 목표 중 `CopyAppliedSkillToMainRepository`와 `BackupAppliedSkillToMainRepository`를 다룬다.
- [x] 이 태스크 완료 후 backup은 target을 변경하지 않는 snapshot이어야 하며, copy는 Main Repository source conflict를 overwrite하지 않아야 한다.

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
- [x] 이번 태스크를 시작해야 하는 이유는 사용자가 target에만 존재하는 skill을 Main Repository로 보존하거나 백업할 수 있어야 하기 때문이다.

## 3. Scope

### Included

- [x] `copyAppliedSkillToMainRepository({ context, input, skillRepository })` application 유스케이스를 만든다.
- [x] `backupAppliedSkillToMainRepository({ context, input, skillRepository })` application 유스케이스를 만든다.
- [x] repository adapter에 `copyTargetSkillToMainRepository` primitive를 추가한다.
- [x] repository adapter에 `backupTargetSkillToMainRepository` primitive를 추가한다.
- [x] copy는 `skills/<name>` conflict를 overwrite하지 않는다.
- [x] backup은 `backups/<name>/<snapshotId>`에 snapshot과 metadata를 기록한다.

### Excluded

- [x] move to main repository는 구현하지 않는다.
- [x] target cleanup은 구현하지 않는다.
- [x] backup restore/promote는 구현하지 않는다.
- [x] directory hash verification은 구현하지 않는다.
- [x] VSCode command와 UI는 구현하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] target skill copy to main 유스케이스를 구현한다.
- [x] 입력은 applied skill DTO, target DTO, desired source name이다.
- [x] 출력은 copied source DTO, diagnostics, events, steps다.
- [x] 성공 조건은 target skill이 Main Repository `skills/<name>`으로 copy되는 것이다.
- [x] 실패 조건은 existing source를 overwrite하는 것이다.

### Functional Unit 2

- [x] target skill backup snapshot 유스케이스를 구현한다.
- [x] 입력은 applied skill DTO, target DTO, snapshot id다.
- [x] 출력은 backup DTO, diagnostics, events, steps다.
- [x] 성공 조건은 `backups/<name>/<snapshotId>`에 snapshot과 `.sponzey-backup.json` metadata가 기록되고 target이 변경되지 않는 것이다.
- [x] 실패 조건은 backup이 target cleanup 또는 mutation을 수행하는 것이다.

### Functional Unit 3

- [x] repository filesystem primitive를 구현한다.
- [x] copy/backup failure는 typed result로 반환한다.
- [x] path traversal과 conflict는 typed error로 거부한다.
- [x] 성공 조건은 adapter test가 temp directory에서만 동작하는 것이다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `application/transfer`와 `infrastructure/filesystem`이다.
- [x] Application은 concrete infrastructure class를 import하지 않는다.
- [x] Filesystem copy는 repository port 뒤에 둔다.
- [x] Domain/Application에는 filesystem import를 추가하지 않는다.
- [x] backup은 target을 변경하지 않는 operation이며, TransferPolicy와 일치해야 한다.

## 6. Configuration Rules

- [x] copy/backup은 `RuntimeContext`로 전달된 `mainRepositoryPath`만 사용한다.
- [x] target path와 snapshot id는 input DTO에서만 받는다.
- [x] settings reader, environment, config file을 재조회하지 않는다.
- [x] snapshot timestamp를 유스케이스 내부에서 암묵 생성하지 않고 input으로 받는다.

## 7. Logging Requirements

### Product Log

- [x] 실제 Product Log 출력은 하지 않는다.
- [x] output `events`에 `skill.transfer.copy.completed`, `skill.transfer.backup.completed`, `skill.transfer.failed` 후보를 포함한다.
- [x] Product Log 후보는 skill name, target id, snapshot id, result code 수준으로 제한한다.

### Field Debug Log

- [x] 실제 Field Debug Log 출력은 하지 않는다.
- [x] conflict/path traversal/filesystem failure는 diagnostic code로 반환한다.
- [x] skill file content는 event/message에 포함하지 않는다.

### Development Log

- [x] 개발 및 테스트 중 확인 정보는 Node.js test output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 debug print를 남기지 않는다.

## 8. State Machine Requirements

- [x] copy 상태는 `ValidatingInput`, `LoadingTargetSkill`, `CheckingNameConflict`, `WritingMainRepository`, `WritingTransferMetadata`, `Completed`로 정의한다.
- [x] backup 상태는 `ValidatingInput`, `LoadingTargetSkill`, `WritingBackupSnapshot`, `WritingTransferMetadata`, `Completed`로 정의한다.
- [x] 실패 상태는 `InvalidInput`, `NameConflictBlocked`, `WriteFailed`로 표현한다.
- [x] 상태 전이는 테스트 가능해야 한다.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] application copy 테스트는 repository copy port가 정확한 input으로 호출되는지 검증한다.
- [x] application backup 테스트는 repository backup port가 정확한 input으로 호출되고 target cleanup port가 없음을 검증한다.
- [x] adapter copy 테스트는 temp target skill이 `skills/<name>`으로 copy되는지 검증한다.
- [x] adapter copy conflict 테스트는 existing source overwrite를 거부하는지 검증한다.
- [x] adapter backup 테스트는 target이 남아 있고 backup snapshot metadata가 기록되는지 검증한다.
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
  - `copyAppliedSkillToMainRepository` application 유스케이스를 추가했다.
  - `backupAppliedSkillToMainRepository` application 유스케이스를 추가했다.
  - target skill copy가 repository port `copyTargetSkillToMainRepository`를 호출하고 target cleanup을 수행하지 않는 계약을 테스트로 고정했다.
  - backup이 repository port `backupTargetSkillToMainRepository`를 호출하고 target cleanup을 수행하지 않는 계약을 테스트로 고정했다.
  - `FileSystemSkillRepository.copyTargetSkillToMainRepository` primitive를 추가했다.
  - `FileSystemSkillRepository.backupTargetSkillToMainRepository` primitive를 추가했다.
  - copied source에는 `.sponzey-source.json` origin metadata를 기록하도록 했다.
  - backup snapshot에는 `.sponzey-backup.json` metadata를 기록하도록 했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 생성: `src/application/transfer/transfer-use-cases.js`
  - 수정: `src/application/index.js`
  - 수정: `src/infrastructure/filesystem/file-system-skill-repository.js`
  - 생성: `test/application/transfer-use-cases.test.mjs`
  - 수정: `test/infrastructure/file-system-skill-repository.test.mjs`
  - 수정: `.tasks/task012.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 57 tests / 57 pass
  - `npm run check:architecture`: 통과, 15 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - target skill copy가 `skills/<name>`으로 복사되고 source conflict를 overwrite하지 않는지 확인했다.
  - copied source origin metadata가 `.sponzey-source.json`에 기록되는지 확인했다.
  - backup snapshot이 `backups/<name>/<snapshotId>`에 생성되는지 확인했다.
  - backup metadata가 `.sponzey-backup.json`에 기록되는지 확인했다.
  - backup 이후 target skill의 `SKILL.md`가 변경되지 않고 남아 있는지 확인했다.
  - Application이 concrete infrastructure adapter를 import하지 않는지 확인했다.
  - filesystem import가 infrastructure 계층에만 존재하는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - move to main repository와 optional target cleanup은 아직 없다.
  - backup snapshot conflict에 대한 application-level 테스트는 아직 없다.
  - directory hash verification은 아직 없다.
  - symlink target을 backup/copy할 때 dereference 정책은 명시 테스트가 부족하다.
  - Presentation command와 tree view는 아직 없다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 move applied skill to main repository를 구현해야 한다.
  - move는 먼저 copy to main을 수행하고, target cleanup confirmation이 true일 때만 target remove를 수행해야 한다.
  - confirmation이 없으면 copy만 완료하거나 blocked result를 반환하는 정책을 명확히 해야 한다.
  - target cleanup은 existing `removeTargetEntry` primitive를 사용해야 하며 source 삭제를 요청하면 안 된다.

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
  - 다음 태스크 파일명은 `.tasks/task013.md`로 결정한다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
  - 다음 태스크는 move applied skill to main repository와 explicit target cleanup confirmation만 다룬다.
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
