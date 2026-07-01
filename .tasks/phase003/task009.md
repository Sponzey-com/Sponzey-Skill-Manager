# Task 009. Project Global Shadowing Diagnostic Policy

## 1. Task Purpose

- [x] 같은 client의 Global Skill과 Project Skill에 같은 이름의 skill이 있을 때 potential shadowing diagnostic을 생성한다.
- [x] 서로 다른 client의 같은 이름 skill은 conflict/shadowing으로 보지 않는 정책을 명시한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.4의 project-over-global shadowing과 cross-client non-conflict 범위를 수행한다.
- [x] 완료 후 사용자는 Diagnostics에서 project skill이 같은 client의 global skill을 가릴 수 있음을 확인할 수 있어야 한다.

## 2. Current Context

- [x] 현재 apply conflict policy는 external target overwrite block만 다룬다.
- [x] 현재 refresh read model은 같은 이름의 global/project skill 관계를 diagnostic으로 계산하지 않는다.
- [x] 현재 Diagnostics tree는 read model diagnostics를 grouping해 표시할 수 있다.
- [x] 현재 Codex/Claude target은 clientType으로 구분된다.
- [x] Phase 003.4는 client priority를 단정하지 말고 모르면 conservative warning으로 표시하도록 요구한다.

## 3. Scope

### Included

- [x] Domain policy에 project-over-global potential shadowing decision model을 추가한다.
- [x] Domain policy가 same-name different-client global skills를 conflict로 보지 않음을 테스트로 고정한다.
- [x] `refreshSkills`가 global/project applied skill groups를 정책에 전달하고 diagnostics에 병합한다.
- [x] Product Log가 아닌 read model diagnostics로 shadowing을 표현한다.

### Excluded

- [x] Apply preflight warning UI는 이번 태스크에서 추가하지 않는다.
- [x] compatibility warning을 apply target 선택지에 표시하는 작업은 후속 태스크로 남긴다.
- [x] source/main repository name conflict는 이번 태스크에서 추가하지 않는다.
- [x] client priority 설정을 추가하지 않는다.
- [x] external skill preservation policy 문구 변경은 후속 태스크로 남긴다.

## 4. Functional Units

### Functional Unit 1

- [x] Domain shadowing policy를 구현한다.
- [x] 입력: global applied skill groups, project applied skill groups.
- [x] 출력: diagnostic DTO array.
- [x] 성공 조건: 같은 `clientType`과 같은 skill name이 global/project에 동시에 있으면 `potential-skill-shadowing` warning이 반환된다.
- [x] 실패 조건: shadowing 계산이 Presentation mapper 또는 string label 조합에 묻힌다.

### Functional Unit 2

- [x] Cross-client non-conflict policy를 테스트한다.
- [x] 입력: Codex global skill과 Claude global skill이 같은 name을 가진 groups.
- [x] 출력: diagnostics 없음.
- [x] 성공 조건: same-name different-client skills are treated as separate targets.
- [x] 실패 조건: Codex/Claude 같은 이름이 잘못 conflict로 표시된다.

### Functional Unit 3

- [x] Refresh read model에 shadowing diagnostics를 병합한다.
- [x] 입력: scan된 global/project target read model.
- [x] 출력: `readModel.diagnostics`에 shadowing diagnostic 추가.
- [x] 성공 조건: `skills.refresh.completed.diagnosticCount`가 shadowing diagnostic을 포함한다.
- [x] 실패 조건: tree view에는 아무 warning이 없어 사용자가 shadowing 가능성을 모른다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Domain`, `Application`, `Tests`, `Task documentation`.
- [x] Domain은 VSCode, filesystem, settings에 의존하지 않는다.
- [x] Application은 scan 결과를 Domain policy 입력 DTO로 전달하고 diagnostic 결과만 병합한다.
- [x] Presentation은 변경하지 않는다. 기존 Diagnostics tree grouping이 read model diagnostics를 표시한다.
- [x] Infrastructure는 변경하지 않는다.
- [x] settings/env/process global을 읽지 않는다.

Changed layers:

- [x] Domain
- [x] Application
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] None.

RuntimeContext fields used:

- [x] `context.globalTargets`
- [x] `context.projectTargets`

New settings:

- [x] None.

## 6. Configuration Rules

- [x] client priority 설정을 추가하지 않는다.
- [x] shadowing policy는 코드 정책으로 고정하고 unknown priority는 warning으로만 표현한다.
- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 환경 값은 읽지 않는다.
- [x] 런타임 중간 설정 변경을 추가하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] Shadowing 발견 자체는 Product Log로 남기지 않는다.
- [x] 기존 `skills.refresh.completed` event의 `diagnosticCount`는 shadowing diagnostic 수를 포함한다.
- [x] notification에는 full path를 추가하지 않는다.

### Field Debug Log

- [x] 별도 Field Debug Log를 추가하지 않는다.
- [x] target scan completed event는 기존 정책을 유지한다.

### Development Log

- [x] 테스트 실행 output만 Development Log 성격으로 취급한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 추가하지 않는다.

Product Log events:

- [x] Existing `skills.refresh.completed` only.

Field Debug Log events:

- [x] Existing `target.scan.completed` only.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] 별도 runtime state machine class를 추가하지 않는다.
- [x] Refresh explicit steps에 shadowing 계산 단계가 필요한 경우 `DetectingShadowing`을 추가한다.
- [x] 실패 상태는 추가하지 않는다. Policy 계산은 pure function이며 scan 실패는 기존 `SourceScanFailed`, `TargetScanFailed`를 유지한다.
- [x] 상태 플래그 조합을 만들지 않는다.

State machine required:

- [x] Explicit refresh step only.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: Domain policy same-client project-over-global shadowing diagnostic.
- [x] 테스트 대상: Domain policy same-name different-client non-conflict.
- [x] 테스트 대상: `refreshSkills` read model diagnostic 병합과 event diagnosticCount.
- [x] 외부 의존성은 fake repository와 fake target store로 대체한다.
- [x] 설정 값 전달 방식 테스트는 새 설정이 없음을 build/architecture validation으로 검증한다.
- [x] 로그 정책 검증은 shadowing diagnostic이 Product Log event가 아니라 read model diagnostic으로만 나오는지 assertion한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 helper 이름과 DTO shape를 정리한다.

First failing tests:

- [x] `test/domain/domain-policy.test.mjs` should fail because shadowing policy is not exported.
- [x] `test/application/refresh-skills.test.mjs` should fail because refresh does not create shadowing diagnostics.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 same-name global/project diagnostic 표시를 확인한다.

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
- [x] 최소 구현으로 Domain shadowing policy를 추가한다.
- [x] 최소 구현으로 Domain export를 추가한다.
- [x] 최소 구현으로 `refreshSkills` diagnostics 병합을 추가한다.
- [x] Product Log event가 늘어나지 않았는지 확인한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 추가되지 않았는지 확인한다.
- [x] 설정 값 전달 방식이 변경되지 않았는지 확인한다.
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
- [x] 복잡한 흐름이 플래그 조합이 아니라 pure domain function으로 표현되었다.
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

- Added `evaluateSkillShadowingPolicy` as a pure Domain policy.
- The policy emits `potential-skill-shadowing` warning diagnostics when same-client project and global targets contain the same skill name.
- The policy treats same-name different-client skills as separate targets and emits no conflict diagnostic.
- `refreshSkills` now runs shadowing detection after target scans when both global and project groups exist.
- Shadowing diagnostics are merged into `readModel.diagnostics` and counted by the existing `skills.refresh.completed` Product Log event.

Commands run:

- `node --test test/domain/domain-policy.test.mjs` failed before implementation and passed after implementation.
- `node --test test/application/refresh-skills.test.mjs` failed before implementation and passed after implementation.
- `npm test` passed with 236 tests.
- `npm run build` passed.

Files changed:

- `.tasks/task009.md`
- `src/domain/policy/core-policies.js`
- `src/domain/index.js`
- `src/application/refresh/refresh-skills.js`
- `test/domain/domain-policy.test.mjs`
- `test/application/refresh-skills.test.mjs`

Residual risks:

- [x] Compatibility warning in apply target choices remains for a later task.
- [x] Source/main repository name conflict remains for a later task.
- [x] Manual Extension Host smoke for shadowing diagnostics is still pending for release readiness.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 010 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.