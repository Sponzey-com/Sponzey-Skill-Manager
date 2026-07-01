# Task 007. Backup Detail DTO And Context Action

## 1. Task Purpose

- [x] Backup snapshot item도 `Show Skill Detail` 흐름에서 detail DTO를 반환하도록 만든다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.3의 backup detail 범위를 수행한다.
- [x] 완료 후 사용자는 Backup Snapshots item에서 snapshot id, source skill, backup path, metadata, createdAt, promoted status를 확인할 수 있어야 한다.

## 2. Current Context

- [x] Task 006은 source/applied/diagnostic detail DTO를 보강했다.
- [x] 현재 backup item은 tree payload를 갖지만 `Show Skill Detail` context menu가 없다.
- [x] 현재 `getSkillDetail`은 `input.backup`을 처리하지 않는다.
- [x] 현재 `skillDetailChoices`는 source/applied choices만 제공하고 backup choices를 제공하지 않는다.
- [x] 현재 tree backup payload는 backup metadata를 충분히 보존하지 않는다.

## 3. Scope

### Included

- [x] backup detail DTO branch를 `getSkillDetail`에 추가한다.
- [x] backup tree payload가 metadata, createdAt, sourceHash, original target/client fields를 보존하게 한다.
- [x] Main Repository backup item context menu에 `Show Skill Detail`을 추가한다.
- [x] `collectCommandInput`이 backup payload를 가진 detail input을 prompt 없이 통과시키고, prompt 선택지에도 backups를 포함한다.

### Excluded

- [x] backup promote/delete behavior 변경은 제외한다.
- [x] backup metadata filesystem schema 변경은 제외한다.
- [x] command result renderer next-action 문구 변경은 제외한다.
- [x] Webview detail panel은 추가하지 않는다.
- [x] 새 설정을 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] Backup detail DTO를 구현한다.
- [x] 입력: backup tree item payload.
- [x] 출력: `type: "backup"` detail DTO.
- [x] 성공 조건: detail에 skillName, snapshotId, backupPath, createdAt, metadata, sourceHash, target context, promoted status가 포함된다.
- [x] 실패 조건: backup item에서 detail command가 `skill-detail-input-required`로 실패한다.

### Functional Unit 2

- [x] Backup tree payload와 context menu를 구현한다.
- [x] 입력: refresh read model `backups`.
- [x] 출력: backup tree item with rich `backup` payload and `Show Skill Detail` menu contribution.
- [x] 성공 조건: backup item 우클릭에서 detail command를 실행할 수 있다.
- [x] 실패 조건: backup metadata가 tree mapping 중 손실된다.

### Functional Unit 3

- [x] Detail input collector backup support를 구현한다.
- [x] 입력: existing `input.backup` or read model backups.
- [x] 출력: prompt 없이 backup input 보존 또는 backup quick pick choice.
- [x] 성공 조건: backup detail command는 source/applied prompt와 같은 흐름으로 동작한다.
- [x] 실패 조건: backup detail을 보려면 folder picker나 unrelated prompt가 뜬다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Application`, `Presentation`, `Manifest`, `Tests`, `Task documentation`.
- [x] Domain 계층은 변경하지 않는다.
- [x] Infrastructure 계층은 변경하지 않는다.
- [x] Detail composition은 Application use case 책임으로 둔다.
- [x] Presentation은 read model과 command input을 DTO로 매핑한다.
- [x] 외부 파일 읽기 또는 filesystem metadata read를 추가하지 않는다.
- [x] settings/env/process global을 읽지 않는다.

Changed layers:

- [x] Application
- [x] Presentation
- [x] Manifest
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] None.

RuntimeContext fields used:

- [x] None.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 새 configuration contribution을 추가하지 않는다.
- [x] 환경 값은 읽지 않는다.
- [x] 런타임 중간 설정 변경을 추가하지 않는다.
- [x] Backup detail은 함수 입력으로 받은 backup payload만 사용한다.

## 7. Logging Requirements

### Product Log

- [x] Detail 조회 성공은 Product Log를 추가하지 않는다.
- [x] Backup detail 조회 실패는 기존 `skill.detail.failed` failure result만 사용한다.

### Field Debug Log

- [x] Field Debug Log를 추가하지 않는다.
- [x] Backup detail mapping 결과를 로그로 남기지 않는다.

### Development Log

- [x] 테스트 실행 output만 Development Log 성격으로 취급한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 추가하지 않는다.

Product Log events:

- [x] None.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] Runtime state machine은 explicit steps contract로 표현한다.
- [x] 상태 목록: `ResolvingItem`, `MappingDetail`, `Completed`.
- [x] 실패 상태: `UnsupportedItem`.
- [x] 종료 상태: `Completed`.
- [x] 상태 전이는 result `steps`와 tests로 검증한다.

State machine required:

- [x] Explicit steps contract only; no separate state machine class.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: backup detail DTO.
- [x] 테스트 대상: backup tree metadata payload preservation.
- [x] 테스트 대상: backup detail context menu contribution.
- [x] 테스트 대상: command input collector backup pass-through and backup choices.
- [x] 외부 의존성은 사용하지 않는다.
- [x] 설정 값 전달 방식 테스트는 새 설정이 없음을 build/manifest validation으로 검증한다.
- [x] 로그 정책 검증은 runtime event 추가가 없음을 result로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

First failing tests:

- [x] `test/application/skill-operation-use-cases.test.mjs` should fail because backup detail is not supported.
- [x] `test/presentation/tree-view-model.test.mjs` should fail because backup metadata is not preserved and detail menu is missing.
- [x] `test/presentation/command-input-collector.test.mjs` should fail because backup detail inputs are not preserved or offered.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 Backup Snapshots item의 detail command를 확인한다.

AGENTS.md rules checked:

- [x] Layered Architecture
- [x] Clean Architecture
- [x] Tidy First
- [x] TDD
- [x] Configuration Policy
- [x] Logging Policy
- [x] State Machine Policy

## 10. Implementation Checklist

- [x] 테스트 파일을 먼저 수정한다.
- [x] 실패하는 테스트를 확인한다.
- [x] 최소 구현으로 backup detail branch를 추가한다.
- [x] 최소 구현으로 backup tree payload preservation을 추가한다.
- [x] 최소 구현으로 backup detail context menu를 추가한다.
- [x] 최소 구현으로 command input collector backup support를 추가한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 추가되지 않았는지 확인한다.
- [x] 설정 값 전달 방식이 변경되지 않았는지 확인한다.
- [x] 로그가 추가되지 않았는지 확인한다.
- [x] 중복과 구조 문제를 정리한다.
- [x] 모든 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 실패 테스트가 먼저 작성되었다.
- [x] 도메인 계층이 외부 프레임워크에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 I/O가 추가되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 유지되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 플래그 조합이 아니라 명시적 steps로 표현되었다.
- [x] 리팩터링과 기능 변경이 가능한 한 분리되었다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.
- [x] 생성하거나 수정한 파일을 기록한다.
- [x] 실행한 테스트 명령과 결과를 기록한다.
- [x] 검증한 항목을 기록한다.
- [x] 남은 위험 요소를 기록한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.

Completion notes:

- Added backup detail support to `getSkillDetail`.
- Backup detail DTO now includes `skillName`, `snapshotId`, `backupPath`, `createdAt`, `sourceHash`, `promotedStatus`, metadata, target context, and related commands.
- Preserved rich backup metadata in tree item payloads.
- Added `Show Skill Detail` context menu contribution for `sponzeySkillBackup`.
- Updated command input collection to pass through existing backup payloads and include backups in detail quick pick choices.
- Created or updated:
  - `src/application/skill/skill-operation-use-cases.js`
  - `src/presentation/tree-view-model.js`
  - `src/presentation/command-input-collector.js`
  - `package.json`
  - `test/application/skill-operation-use-cases.test.mjs`
  - `test/presentation/tree-view-model.test.mjs`
  - `test/presentation/command-input-collector.test.mjs`
- Verified first failing tests:
  - `node --test test/application/skill-operation-use-cases.test.mjs` failed before implementation and passed after implementation.
  - `node --test test/presentation/tree-view-model.test.mjs` failed before implementation and passed after implementation.
  - `node --test test/presentation/command-input-collector.test.mjs` failed before implementation and passed after implementation.
- Verified final commands:
  - `npm test` passed with 230 tests.
  - `npm run build` passed.
- Remaining risks:
  - Command result renderer next-action wording is still unchanged.
  - Unsupported context item behavior still needs explicit input collector coverage.
  - Manual Extension Host smoke for detail actions is still pending for release readiness.
- Follow-up:
  - Task 008 should cover command result next-action messages and unsupported detail context handling, or move to Phase 003.4 conflict/shadowing if detail UX is considered sufficient.

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
- [x] 다음 태스크를 `taskXXX.md`로 생성한다.
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