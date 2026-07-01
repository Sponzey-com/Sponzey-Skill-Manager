# Task 006. Backup Comparison Summary Use Case

## 1. Task Purpose

- [x] Backup snapshot과 source 또는 target directory의 차이를 읽기 전용으로 계산하는 Application use case를 추가한다.
- [x] 이 태스크가 `.tasks/plan.md`의 Phase 004.4 "Backup Compare, Restore, And Lifecycle Governance" 중 compare 선행 조건을 충족함을 기록한다.
- [x] 이 태스크 완료 후 restore, promote, delete 같은 mutation 없이 backup comparison summary를 테스트와 포트 계약으로 검증할 수 있어야 한다.

## 2. Current Context

- [x] Task 003에서 repository index와 stable source identity 기반이 구현되었다.
- [x] Task 004에서 local Git status read model이 구현되었다.
- [x] Task 005에서 repository snapshot commit use case와 `VersionControlPort`가 구현되었다.
- [x] 현재 backup create, list, promote, delete 흐름은 존재하지만 backup과 source/target의 file-level 차이를 판단하는 use case와 port가 없다.
- [x] 이번 태스크를 시작해야 하는 이유: Phase 004.4의 restore 작업은 compare summary와 conflict policy가 테스트되기 전에는 구현하면 안 된다.

## 3. Scope

### Included

- [x] Application use case `compareSkillBackup`을 추가한다.
- [x] `BackupComparisonPort` 계약을 use case 입력으로 정의하고 fake port test로 검증한다.
- [x] filesystem 기반 `FileSystemBackupComparisonPort`를 추가해 두 directory의 상대 경로와 content hash 차이를 계산한다.

### Excluded

- [x] VSCode command, tree title button, context menu 노출은 이번 태스크에서 다루지 않는다.
- [x] backup restore, target overwrite, restore audit record는 이번 태스크에서 다루지 않는다.
- [x] backup retention, cleanup policy, remote repository diff는 이번 태스크에서 다루지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] `compareSkillBackup` use case를 구현한다.
- [x] 입력: `input.backupPath` 또는 `input.backup.backupPath`, `input.referencePath` 또는 source/target path, `backupComparisonPort`.
- [x] 출력: comparison summary, diagnostics, Product Log events, explicit steps.
- [x] 성공 조건: 유효한 입력과 port가 있으면 comparison port가 호출되고 deterministic summary가 반환된다.
- [x] 실패 조건: missing backup path, missing reference path, missing port, port failure는 typed diagnostic으로 반환하고 filesystem side effect를 수행하지 않는다.

### Functional Unit 2

- [x] `FileSystemBackupComparisonPort`를 구현한다.
- [x] 입력: backup directory path, reference directory path.
- [x] 출력: `status`, `backupOnlyFiles`, `referenceOnlyFiles`, `modifiedFiles`, `unchangedFileCount`, count fields.
- [x] 성공 조건: 같은 파일은 unchanged로, backup에만 있는 파일은 backup-only로, reference에만 있는 파일은 reference-only로, 양쪽에 있으나 content hash가 다른 파일은 modified로 분류한다.
- [x] 실패 조건: backup 또는 reference path를 읽을 수 없으면 typed diagnostic을 반환한다.

### Functional Unit 3

- [x] Application export, Infrastructure export, composition wiring을 추가한다.
- [x] 입력: existing use case bundle과 optional adapter override.
- [x] 출력: tests에서 직접 호출 가능한 use case와 adapter.
- [x] 성공 조건: Presentation command는 추가하지 않는다.
- [x] 실패 조건: compare 기능이 restore 또는 delete side effect를 암묵적으로 실행하지 않는다.

## 5. Architecture Notes

- [x] 변경되는 계층은 Application, Infrastructure, composition wiring이다.
- [x] Domain에는 filesystem path traversal, Node crypto, fs, VSCode 개념을 추가하지 않는다.
- [x] Application은 validation, port orchestration, Product Log event 생성만 담당한다.
- [x] Infrastructure는 directory traversal, symlink skip, content hash calculation만 담당한다.
- [x] backup metadata와 source metadata 파일은 비교 noise를 만들지 않도록 filesystem adapter에서 제외한다.
- [x] 외부 filesystem 접근은 `FileSystemBackupComparisonPort` adapter에만 위치한다.
- [x] 새 설정, global state, hidden environment lookup을 추가하지 않는다.

## 6. Configuration Rules

- [x] 새 설정을 추가하지 않는다.
- [x] backup retention 또는 ignore pattern 설정 파일을 추가하지 않는다.
- [x] backup path와 reference path는 use case input으로 명시적으로 받는다.
- [x] `mainRepositoryPath`를 내부에서 다시 읽지 않는다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지한다.

## 7. Logging Requirements

### Product Log

- [x] 성공 시 `skill.backup.compare.completed`를 기록한다.
- [x] 실패 시 `skill.backup.compare.failed`를 기록한다.
- [x] Product Log payload는 status와 count fields만 포함하고 absolute path, file body, file hash, full file list를 포함하지 않는다.

### Field Debug Log

- [x] file-level diff detail은 Field Debug Log 후보로만 둔다.
- [x] Field Debug Log에 포함 가능한 값은 relative path와 sanitized count summary로 제한한다.
- [x] file content, full hash, secret, raw stack trace는 기록하지 않는다.

### Development Log

- [x] fake comparison port call summary는 test-only detail로만 둔다.
- [x] 프로덕션 기본 동작에 개발용 로그를 추가하지 않는다.
- [x] 임시 console log를 만들지 않는다.

## 8. State Machine Requirements

- [x] backup comparison은 explicit steps contract로 관리한다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록: `ValidatingInput`, `CheckingComparisonPort`, `ComparingBackup`, `MappingSummary`, `Completed`, `Failed`.
- [x] 이벤트 목록: `InputValid`, `InputInvalid`, `ComparisonPortAvailable`, `ComparisonSucceeded`, `ComparisonFailed`.
- [x] 전이 조건: validation failure와 missing port는 filesystem read 이전에 종료한다.
- [x] 실패 상태: `Failed`.
- [x] 종료 상태: `Completed`, `Failed`.
- [x] 상태 전이는 use case tests에서 steps와 fake port call order로 검증한다.

## 9. TDD Plan

- [x] 실패하는 Application use case 테스트를 먼저 작성한다.
- [x] 실패하는 filesystem adapter 테스트를 먼저 작성한다.
- [x] 정상 케이스 테스트: backup과 reference가 다른 경우 summary count와 Product Log event를 반환한다.
- [x] 정상 케이스 테스트: backup과 reference가 같은 경우 `identical` status를 반환한다.
- [x] 실패 케이스 테스트: missing input과 missing port는 comparison port 호출 없이 failed result를 반환한다.
- [x] 실패 케이스 테스트: filesystem adapter가 missing directory를 typed diagnostic으로 반환한다.
- [x] 외부 의존성은 fake comparison port와 temp directory fixture로 대체한다.
- [x] 설정 값 전달 방식 테스트: use case는 explicit input만 사용한다.
- [x] 로그 정책 검증 테스트: Product Log에 absolute path, file body, hash, full file list가 포함되지 않는다.
- [x] 상태 전이는 steps와 port call order로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] 실패하는 Application use case 테스트를 먼저 작성한다.
- [x] 실패하는 filesystem comparison adapter 테스트를 먼저 작성한다.
- [x] 최소 Application use case를 작성한다.
- [x] Application export를 추가한다.
- [x] 최소 Infrastructure adapter를 작성한다.
- [x] Infrastructure export를 추가한다.
- [x] composition bundle에 optional `backupComparisonPort`를 주입한다.
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
- [x] 도메인 계층이 filesystem, crypto, VSCode에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 환경 값이 전역 상수처럼 사용되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 플래그 조합이 아니라 명시적 상태로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.
- [x] backup snapshot content는 compare 과정에서 수정되지 않는다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.
  - `compareSkillBackup` Application use case를 추가했다.
  - backup path와 reference path를 explicit input으로 받고, missing input과 missing port를 side effect 전에 차단한다.
  - `FileSystemBackupComparisonPort`를 추가해 상대 경로 기준의 backup-only, reference-only, modified, unchanged summary를 계산한다.
  - `.sponzey-applied.json`, `.sponzey-source.json`, `.sponzey-backup.json` metadata file은 comparison noise를 막기 위해 adapter에서 제외한다.
  - use case export, infrastructure export, composition optional adapter wiring을 추가했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - `src/application/skill/skill-operation-use-cases.js`
  - `src/application/index.js`
  - `src/infrastructure/filesystem/file-system-backup-comparison-port.js`
  - `src/infrastructure/index.js`
  - `src/extension-composition.js`
  - `test/application/skill-operation-use-cases.test.mjs`
  - `test/infrastructure/file-system-backup-comparison-port.test.mjs`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `node --test test/application/skill-operation-use-cases.test.mjs test/infrastructure/file-system-backup-comparison-port.test.mjs` 통과
  - `node --test test/extension-composition.test.mjs test/extension-activation.test.mjs` 통과
  - `npm test` 통과: 284 tests, 284 pass
  - `npm run build` 통과: architecture ok, manifest ok, build smoke ok
  - `npm run release:gate` 통과: tests, architecture, manifest, build, docs, smoke
- [x] 검증한 항목을 기록한다.
  - missing backup/reference path와 missing port는 comparison port 호출 전에 실패한다.
  - Product Log에는 status와 count fields만 포함하고 absolute path, file body, hash, full file list를 포함하지 않는다.
  - filesystem comparison adapter는 temp directory fixture로 검증되며 source/backup file을 수정하지 않는다.
  - directory traversal, hash 계산, symlink skip, filesystem read는 Infrastructure adapter에만 존재한다.
  - Domain 계층은 새 filesystem, crypto, VSCode 의존성을 갖지 않는다.
- [x] 남은 위험 요소를 기록한다.
  - compare use case는 아직 VSCode command로 노출되지 않았다.
  - malformed backup metadata validation은 restore task에서 구체화해야 한다.
  - restore conflict policy와 audit record는 아직 구현되지 않았다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 작업은 Phase 004.4의 restore lifecycle이다.
  - restore는 compare summary와 conflict policy를 기반으로 existing target overwrite를 confirmation 없이 수행하면 안 된다.
  - restore는 Main Repository source를 변경하지 않아야 하며 backup snapshot을 immutable로 유지해야 한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다. Phase 004.4 compare 선행 조건은 완료했지만 Phase 004 전체 목표에는 도달하지 않았다.
- [ ] 도달했다면 추가 태스크를 생성하지 않는다.
- [x] 도달하지 못했다면 남은 목표를 정리한다. 남은 목표는 backup restore lifecycle, analyzer policy pack, target profile governance, diagnostics remediation, release candidate readiness다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다. 다음 우선순위는 Phase 004.4 Backup Restore lifecycle이다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다. 다음 태스크는 restore use case, target restore adapter, restore audit contract까지만 포함해야 한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 결정한다. 다음 파일은 `.tasks/task007.md`다.
- [x] 다음 태스크를 `taskXXX.md`로 생성한다. `.tasks/task007.md`를 생성했다.
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
