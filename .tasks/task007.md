# Task 007. Backup Restore Lifecycle Use Case

## 1. Task Purpose

- [x] Backup snapshot을 selected target으로 복구하는 Application use case를 추가한다.
- [x] existing target overwrite를 confirmation 없이 실행하지 않는 restore safety policy를 구현한다.
- [x] restore 성공 시 Main Repository source와 backup snapshot을 변경하지 않고 audit record를 남긴다.

## 2. Current Context

- [x] Task 006에서 backup/source 또는 backup/target comparison summary use case와 `BackupComparisonPort`가 구현되었다.
- [x] backup create, list, promote, delete는 이미 존재한다.
- [x] restore 기능은 아직 없으며, restore와 promote가 사용자에게 같은 동작처럼 보일 위험이 있다.
- [x] 이번 태스크를 시작해야 하는 이유: Phase 004.4는 compare 후 restore까지 backup lifecycle을 닫아야 한다.

## 3. Scope

### Included

- [x] Application use case `restoreBackupToTarget`을 추가한다.
- [x] `TargetStore.restoreBackupToTarget` adapter contract를 추가한다.
- [x] `FileSystemTargetStore.restoreBackupToTarget`을 구현해 backup directory를 selected target으로 copy한다.
- [x] restore audit record를 `auditStore.appendRecord` port로 남긴다.

### Excluded

- [x] VSCode command, picker, context menu, tree title button 노출은 이번 태스크에서 다루지 않는다.
- [x] source promote flow 변경은 이번 태스크에서 다루지 않는다.
- [x] backup cleanup, retention, rollback, undo는 이번 태스크에서 다루지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] `restoreBackupToTarget` use case를 구현한다.
- [x] 입력: `context.mainRepositoryPath`, `input.backupPath` 또는 `input.backup.backupPath`, `input.skillName` 또는 `input.backup.skillName`, `input.targetRootPath` 또는 `input.target.targetPath`, `input.targetId`, `input.overwriteConfirmed`.
- [x] 출력: restored target summary, diagnostics, Product Log events, explicit steps.
- [x] 성공 조건: 유효한 입력과 port가 있으면 target write 후 audit record가 생성된다.
- [x] 실패 조건: missing input, missing target store, missing audit store, target conflict는 typed diagnostic으로 반환한다.

### Functional Unit 2

- [x] `FileSystemTargetStore.restoreBackupToTarget`을 구현한다.
- [x] 입력: backup path, target root path, skill name, overwrite flag, applied metadata.
- [x] 출력: restored target path와 metadata path.
- [x] 성공 조건: target이 없으면 copy하고 metadata를 쓴다.
- [x] 성공 조건: target이 있고 `overwrite`가 true이면 target entry를 제거한 뒤 copy하고 metadata를 쓴다.
- [x] 실패 조건: target이 있고 `overwrite`가 false이면 target을 수정하지 않고 `target-overwrite-rejected` diagnostic을 반환한다.

### Functional Unit 3

- [x] Application export와 composition wiring을 추가한다.
- [x] 입력: existing use case bundle과 optional adapter override.
- [x] 출력: tests에서 직접 호출 가능한 restore use case.
- [x] 성공 조건: Presentation command는 추가하지 않는다.
- [x] 실패 조건: restore가 source repository 또는 backup snapshot을 변경하지 않는다.

## 5. Architecture Notes

- [x] 변경되는 계층은 Application, Infrastructure, composition wiring이다.
- [x] Domain에는 VSCode, filesystem, audit store 구현체 개념을 추가하지 않는다.
- [x] Application은 validation, confirmation gating, port orchestration, Product Log event 생성만 담당한다.
- [x] Infrastructure는 filesystem copy/remove/write 작업만 담당한다.
- [x] audit store는 Application port로 호출하고 Infrastructure에서 파일로 저장한다.
- [x] 외부 filesystem 접근은 target store와 audit store adapter에만 위치한다.
- [x] 새 설정, global state, hidden environment lookup을 추가하지 않는다.

## 6. Configuration Rules

- [x] 새 설정을 추가하지 않는다.
- [x] restore overwrite 기본값을 설정 파일로 추가하지 않는다.
- [x] backup path, target root path, skill name, confirmation flag는 use case input으로 명시적으로 받는다.
- [x] `mainRepositoryPath`는 RuntimeContext에서 전달된 값을 사용한다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지한다.

## 7. Logging Requirements

### Product Log

- [x] 성공 시 `skill.backup.restore.completed`를 기록한다.
- [x] conflict block 시 `skill.backup.restore.blocked`를 기록한다.
- [x] 실패 시 `skill.backup.restore.failed`를 기록한다.
- [x] Product Log payload는 skillName, targetId, reason, overwrite 여부만 포함하고 absolute path, file body, backup file list를 포함하지 않는다.

### Field Debug Log

- [x] restored target path와 backup path는 Field Debug Log 후보로만 둔다.
- [x] file-level copy detail은 Field Debug Log에도 기본 포함하지 않는다.
- [x] file content, secret, raw stack trace는 기록하지 않는다.

### Development Log

- [x] fake target store와 fake audit store call summary는 test-only detail로만 둔다.
- [x] 프로덕션 기본 동작에 개발용 로그를 추가하지 않는다.
- [x] 임시 console log를 만들지 않는다.

## 8. State Machine Requirements

- [x] backup restore는 explicit steps contract로 관리한다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록: `ValidatingInput`, `CheckingPorts`, `CheckingConflict`, `WritingTarget`, `WritingAudit`, `Completed`, `Blocked`, `Failed`.
- [x] 이벤트 목록: `InputValid`, `InputInvalid`, `PortsAvailable`, `TargetConflict`, `OverwriteConfirmed`, `TargetWritten`, `AuditWritten`, `WriteFailed`.
- [x] 전이 조건: validation failure와 missing port는 target write 이전에 종료한다.
- [x] 전이 조건: target conflict와 missing overwrite confirmation은 target write 없이 `Blocked`로 종료한다.
- [x] 실패 상태: `Failed`.
- [x] 종료 상태: `Completed`, `Blocked`, `Failed`.
- [x] 상태 전이는 use case tests에서 steps와 fake port call order로 검증한다.

## 9. TDD Plan

- [x] 실패하는 Application use case 테스트를 먼저 작성한다.
- [x] 실패하는 filesystem target store restore 테스트를 먼저 작성한다.
- [x] 정상 케이스 테스트: restore가 target store를 호출하고 audit record를 남긴다.
- [x] 실패 케이스 테스트: existing target conflict는 overwrite confirmation 없이 blocked되고 audit record를 쓰지 않는다.
- [x] 실패 케이스 테스트: missing audit store는 target write 전에 실패한다.
- [x] filesystem 테스트: target이 없으면 backup을 copy하고 metadata를 쓴다.
- [x] filesystem 테스트: target이 있고 overwrite false면 기존 target을 보존한다.
- [x] filesystem 테스트: target이 있고 overwrite true면 target을 교체하고 backup file은 변경하지 않는다.
- [x] 외부 의존성은 fake target store, fake audit store, temp directory fixture로 대체한다.
- [x] 설정 값 전달 방식 테스트: use case는 RuntimeContext와 explicit input만 사용한다.
- [x] 로그 정책 검증 테스트: Product Log에 absolute path, file body, file list가 포함되지 않는다.
- [x] 상태 전이는 steps와 port call order로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 실패하는 Application use case 테스트를 먼저 작성한다.
- [x] 실패하는 filesystem target store restore 테스트를 먼저 작성한다.
- [x] 최소 Application use case를 작성한다.
- [x] Application export를 추가한다.
- [x] 최소 Infrastructure target store method를 작성한다.
- [x] composition bundle에 optional `auditStore`와 restore use case를 주입한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] Product Log event를 정책에 맞게 추가한다.
- [x] 상태 관리가 explicit steps로 표현되었는지 확인한다.
- [x] 중복과 구조 문제를 정리한다.
- [x] 모든 관련 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 도메인 계층이 filesystem, audit store, VSCode에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 환경 값이 전역 상수처럼 사용되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 플래그 조합이 아니라 명시적 상태로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.
- [x] backup snapshot content는 restore 과정에서 수정되지 않는다.
- [x] restore는 Main Repository source를 변경하지 않는다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.
  - `restoreBackupToTarget` Application use case를 추가했다.
  - restore input validation, target store availability, audit store availability, target overwrite conflict handling을 구현했다.
  - restore success는 target write 후 audit record를 남기며, audit store가 없으면 target write 전에 실패한다.
  - `FileSystemTargetStore.restoreBackupToTarget`을 추가해 backup directory를 target으로 copy하고 `.sponzey-applied.json` metadata를 쓴다.
  - existing target은 `overwrite: true`가 아니면 보존하고 `target-overwrite-rejected`를 반환한다.
  - backup restore copy에서 `.sponzey-backup.json`은 target에 남기지 않는다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - `src/application/skill/skill-operation-use-cases.js`
  - `src/application/index.js`
  - `src/infrastructure/filesystem/file-system-target-store.js`
  - `src/extension-composition.js`
  - `test/application/skill-operation-use-cases.test.mjs`
  - `test/infrastructure/file-system-target-store.test.mjs`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `node --test test/application/skill-operation-use-cases.test.mjs test/infrastructure/file-system-target-store.test.mjs` 통과
  - `node --test test/extension-composition.test.mjs test/extension-activation.test.mjs` 통과
  - `npm test` 통과: 291 tests, 291 pass
  - `npm run build` 통과: architecture ok, manifest ok, build smoke ok
  - `npm run release:gate` 통과: tests, architecture, manifest, build, docs, smoke
- [x] 검증한 항목을 기록한다.
  - missing audit store는 target write 전에 실패한다.
  - existing target conflict는 audit record 없이 blocked result를 반환한다.
  - Product Log에는 absolute path, file body, backup file list가 포함되지 않는다.
  - filesystem restore는 backup file을 수정하지 않는다.
  - restore는 Main Repository `skills/` source를 변경하지 않는다.
  - filesystem write는 Infrastructure target store에만 존재한다.
- [x] 남은 위험 요소를 기록한다.
  - restore use case는 아직 VSCode command로 노출되지 않았다.
  - overwrite true에서 target 삭제 후 copy 실패 시 rollback은 아직 없다.
  - malformed backup metadata의 schema validation은 아직 별도 policy로 분리되지 않았다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 작업은 Phase 004.5 Built-In Analyzer Policy Pack이다.
  - restore command를 UI에 노출하려면 별도 task에서 picker, confirmation prompt, command result rendering, Extension Host smoke를 추가해야 한다.
  - backup metadata validation은 analyzer policy 또는 backup validation use case와 함께 확장해야 한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다. Phase 004.4의 internal compare/restore 기반은 구현했지만 Phase 004 전체 목표에는 도달하지 않았다.
- [ ] 도달했다면 추가 태스크를 생성하지 않는다.
- [x] 도달하지 못했다면 남은 목표를 정리한다. 남은 목표는 analyzer policy pack, target profile governance, diagnostics remediation, release candidate readiness다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다. 다음 우선순위는 Phase 004.5 Built-In Analyzer Policy Pack이다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다. 다음 태스크는 built-in policy model, severity mapping, analyzer result contract까지만 포함해야 한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 결정한다. 다음 파일은 `.tasks/task008.md`다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다. `.tasks/task008.md`를 생성했다.
- [x] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작한다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [ ] `plan.md`의 최종 목표에 도달했다.
- [ ] 필수 요구사항이 불명확하여 더 이상 안전하게 진행할 수 없다.
- [ ] 외부 정보, 권한, 비밀값, 접근 권한이 없어 진행할 수 없다.
- [ ] `AGENTS.md` 원칙과 충돌하는 요구사항이 발견되었다.
- [ ] 테스트 또는 검증 환경이 없어 완료 여부를 판단할 수 없다.
- [ ] 코드베이스 구조가 계획과 크게 달라 태스크 재설계가 필요하다.
- [ ] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.
