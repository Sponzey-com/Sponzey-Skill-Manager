# Task 012. Source Target Name Conflict Diagnostics

## 1. Task Purpose

- [x] Main Repository source skill과 같은 이름의 external target skill이 있으면 conflict diagnostic을 생성한다.
- [x] Existing external target은 기본적으로 보존되어야 한다는 정책을 Diagnostics에서 확인 가능하게 한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.4의 source/target name conflict와 external preservation visibility 범위를 수행한다.
- [x] 완료 후 사용자는 apply 전에 같은 이름의 external target이 충돌할 수 있음을 Diagnostics에서 확인할 수 있어야 한다.

## 2. Current Context

- [x] Task 009는 project-over-global shadowing diagnostic을 추가했다.
- [x] Task 010은 apply target compatibility label을 추가했다.
- [x] Task 011은 apply overwrite blocked result를 preservation diagnostic으로 정규화했다.
- [x] 현재 refresh read model은 external target skill과 Main source의 same-name 관계를 diagnostic으로 표시하지 않는다.
- [x] 현재 apply 단계에서는 overwrite를 block하지만, refresh 단계에서 사전 가시성이 부족하다.

## 3. Scope

### Included

- [x] Domain policy에 source-target same-name external conflict diagnostic을 추가한다.
- [x] `refreshSkills`가 source skills와 applied target groups를 policy에 전달하고 diagnostics에 병합한다.
- [x] conflict diagnostic은 `category: "conflict"`와 `preservationPolicy: "preserve-existing-target"`을 포함한다.
- [x] Managed applied skill과 same-name source는 conflict로 표시하지 않는다.

### Excluded

- [x] Apply overwrite confirmation 또는 replace 기능은 추가하지 않는다.
- [x] TargetStore filesystem behavior는 변경하지 않는다.
- [x] Non-external managed skill conflict는 이번 태스크에서 다루지 않는다.
- [x] 새 설정을 추가하지 않는다.
- [x] Presentation tree grouping은 기존 Diagnostics grouping을 사용한다.

## 4. Functional Units

### Functional Unit 1

- [x] Source-target external conflict policy를 구현한다.
- [x] 입력: main repository source skills, global/project applied skill groups.
- [x] 출력: diagnostic DTO array.
- [x] 성공 조건: same-name external target과 source가 있으면 `source-target-name-conflict` warning이 반환된다.
- [x] 실패 조건: 사용자가 apply 전에는 external same-name target 존재를 알 수 없다.

### Functional Unit 2

- [x] Managed same-name target은 conflict로 표시하지 않는다.
- [x] 입력: source와 managed-copy/managed-symlink target이 같은 name을 가진 groups.
- [x] 출력: diagnostics 없음.
- [x] 성공 조건: 정상 적용된 managed target이 noise diagnostic을 만들지 않는다.
- [x] 실패 조건: 정상 managed target이 conflict warning으로 표시된다.

### Functional Unit 3

- [x] Refresh read model에 source-target conflict diagnostics를 병합한다.
- [x] 입력: scan된 source list와 target groups.
- [x] 출력: `readModel.diagnostics`에 source-target conflict diagnostic 추가.
- [x] 성공 조건: Product Log diagnosticCount가 conflict diagnostic을 포함한다.
- [x] 실패 조건: conflict policy가 Domain에 있지만 read model에 나타나지 않는다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Domain`, `Application`, `Tests`, `Task documentation`.
- [x] Domain은 pure policy로 conflict diagnostic만 만든다.
- [x] Application은 scan 결과를 Domain policy 입력 DTO로 전달하고 diagnostic 결과만 병합한다.
- [x] Infrastructure와 Presentation은 변경하지 않는다.
- [x] 외부 I/O를 추가하지 않는다.
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

- [x] conflict visibility를 설정 파일로 제어하지 않는다.
- [x] external preservation policy는 fixed application/domain behavior로 둔다.
- [x] 환경 값은 읽지 않는다.
- [x] 런타임 중간 설정 변경을 추가하지 않는다.
- [x] Diagnostic 계산은 function input DTO만 사용한다.

## 7. Logging Requirements

### Product Log

- [x] Conflict 발견 자체는 별도 Product Log로 남기지 않는다.
- [x] Existing `skills.refresh.completed` event의 `diagnosticCount`만 증가한다.
- [x] Product Log에는 `targetPath` 또는 source path를 추가하지 않는다.

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
- [x] Refresh explicit steps에 conflict 계산 단계가 필요한 경우 `DetectingConflicts`를 추가한다.
- [x] Scan failure states는 기존 `SourceScanFailed`, `TargetScanFailed`를 유지한다.
- [x] 상태 플래그 조합을 만들지 않는다.

State machine required:

- [x] Explicit refresh step only.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: Domain policy same-name source/external target conflict diagnostic.
- [x] 테스트 대상: Domain policy managed same-name target non-conflict.
- [x] 테스트 대상: `refreshSkills` read model diagnostic 병합과 event diagnosticCount.
- [x] 외부 의존성은 fake repository와 fake target store로 대체한다.
- [x] 설정 값 전달 방식 테스트는 새 설정이 없음을 build/architecture validation으로 검증한다.
- [x] 로그 정책 검증은 conflict가 Product Log event로 추가되지 않고 read model diagnostic으로만 나오는지 assertion한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 helper 이름과 DTO shape를 정리한다.

First failing tests:

- [x] `test/domain/domain-policy.test.mjs` should fail because source-target conflict policy is not exported.
- [x] `test/application/refresh-skills.test.mjs` should fail because refresh does not create source-target conflict diagnostics.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 same-name external target diagnostic 표시를 확인한다.

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
- [x] 최소 구현으로 Domain source-target conflict policy를 추가한다.
- [x] 최소 구현으로 Domain export를 추가한다.
- [x] 최소 구현으로 `refreshSkills` diagnostics 병합을 추가한다.
- [x] Product Log event가 늘어나지 않았는지 확인한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 추가되지 않았는지 확인한다.
- [x] 설정 값 전달 방식이 변경되지 않았는지 확인한다.
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

- Added `evaluateSkillNameConflictPolicy` as a pure Domain policy.
- The policy emits `source-target-name-conflict` warning diagnostics for same-name Main Repository source and external target skills.
- Managed same-name targets are ignored to avoid noisy diagnostics for normal applied skills.
- `refreshSkills` now merges source-target conflict diagnostics into the read model when present.
- Conflict diagnostics include `preservationPolicy: "preserve-existing-target"` and are counted by the existing `skills.refresh.completed` Product Log event.

Commands run:

- `node --test test/domain/domain-policy.test.mjs` failed before implementation and passed after implementation.
- `node --test test/application/refresh-skills.test.mjs` failed before implementation and passed after implementation.
- `npm test` passed with 243 tests.
- `npm run build` passed.

Files changed:

- `.tasks/task012.md`
- `src/domain/policy/core-policies.js`
- `src/domain/index.js`
- `src/application/refresh/refresh-skills.js`
- `test/domain/domain-policy.test.mjs`
- `test/application/refresh-skills.test.mjs`

Residual risks:

- [x] Replace/overwrite confirmation remains intentionally unsupported.
- [x] Broader source/source duplicate policy remains outside current scope.
- [x] Manual Extension Host smoke for conflict diagnostics is still pending for release readiness.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 013 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.