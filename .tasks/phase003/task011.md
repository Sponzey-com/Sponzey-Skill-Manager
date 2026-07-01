# Task 011. Apply Overwrite Preservation Diagnostic

## 1. Task Purpose

- [x] Apply target write가 existing target 때문에 거부될 때 기존 target이 보존되었음을 diagnostic에 명확히 표시한다.
- [x] `target-overwrite-rejected` failure를 conflict category와 preservation policy를 가진 application diagnostic으로 정규화한다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.4의 external/overwrite preservation policy clarity 범위를 수행한다.
- [x] 완료 후 사용자는 apply 실패가 기존 target을 덮어쓰지 않고 보존했다는 것을 command result와 diagnostics에서 확인할 수 있어야 한다.

## 2. Current Context

- [x] Task 009는 shadowing diagnostic을 read model에 추가했다.
- [x] Task 010은 apply target 선택지에 compatibility label을 추가했다.
- [x] 현재 `FileSystemTargetStore`는 existing path에 대해 `target-overwrite-rejected`를 반환한다.
- [x] 현재 `applySkillToTarget`은 target store error를 그대로 diagnostics에 전달한다.
- [x] 현재 generic overwrite message는 보존 정책과 다음 행동을 충분히 설명하지 않는다.

## 3. Scope

### Included

- [x] `applySkillToTarget`이 `target-overwrite-rejected` write failure를 enriched diagnostic으로 변환한다.
- [x] enriched diagnostic은 `category: "conflict"`, `preservationPolicy: "preserve-existing-target"`, recommendation을 포함한다.
- [x] apply blocked Product Log는 기존 `skill.apply.blocked` event와 `reason`을 유지한다.
- [x] copy/symlink 양쪽 write failure path에 같은 정규화가 적용된다.

### Excluded

- [x] TargetStore filesystem behavior는 변경하지 않는다.
- [x] overwrite confirmation 또는 replace 기능은 추가하지 않는다.
- [x] existing target을 자동 backup/import/move하지 않는다.
- [x] 새 설정을 추가하지 않는다.
- [x] Webview 또는 별도 confirmation UI를 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] Apply write failure diagnostic 정규화를 구현한다.
- [x] 입력: target store error `{ code: "target-overwrite-rejected" }`.
- [x] 출력: conflict category와 preservation policy를 포함한 diagnostic.
- [x] 성공 조건: apply result diagnostics가 기존 target preservation을 명시한다.
- [x] 실패 조건: 사용자가 apply 실패가 target을 보존했는지 알 수 없다.

### Functional Unit 2

- [x] Product Log event contract를 유지한다.
- [x] 입력: overwrite blocked result.
- [x] 출력: `skill.apply.blocked` event with same reason `target-overwrite-rejected`.
- [x] 성공 조건: log policy는 완료/차단 요약만 남기고 내부 path/body를 노출하지 않는다.
- [x] 실패 조건: Product Log에 full path나 내부 상태가 추가된다.

### Functional Unit 3

- [x] Symlink apply write failure에도 같은 diagnostic 정규화를 적용한다.
- [x] 입력: symlink mode target store overwrite failure.
- [x] 출력: 동일한 enriched diagnostic.
- [x] 성공 조건: copy와 symlink 모드가 같은 user-facing preservation policy를 사용한다.
- [x] 실패 조건: copy만 설명되고 symlink는 generic failure로 남는다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Application`, `Tests`, `Task documentation`.
- [x] Domain policy는 변경하지 않는다. 기존 apply conflict policy와 target store failure code를 application result로 정규화한다.
- [x] Infrastructure adapter behavior는 변경하지 않는다.
- [x] Presentation renderer는 기존 diagnostic message rendering을 그대로 사용한다.
- [x] 외부 I/O를 추가하지 않는다.
- [x] settings/env/process global을 읽지 않는다.

Changed layers:

- [x] Application
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] None.

RuntimeContext fields used:

- [x] `context.defaultApplyMode`

New settings:

- [x] None.

## 6. Configuration Rules

- [x] overwrite behavior를 설정 파일로 제어하지 않는다.
- [x] external preservation policy는 이번 태스크에서 fixed application behavior로 둔다.
- [x] 환경 값은 읽지 않는다.
- [x] 런타임 중간 설정 변경을 추가하지 않는다.
- [x] Diagnostic enrichment는 function input인 target store result만 사용한다.

## 7. Logging Requirements

### Product Log

- [x] Existing `skill.apply.blocked` event만 사용한다.
- [x] Product Log에는 `skillName`, `targetId`, `reason`만 남긴다.
- [x] Product Log에는 `targetPath`, `sourcePath`, skill body, stack trace를 포함하지 않는다.

### Field Debug Log

- [x] Field Debug Log를 추가하지 않는다.
- [x] Write failure internal detail을 로그로 남기지 않는다.

### Development Log

- [x] 테스트 실행 output만 Development Log 성격으로 취급한다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 추가하지 않는다.

Product Log events:

- [x] Existing `skill.apply.blocked` only.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] 별도 runtime state machine class를 추가하지 않는다.
- [x] Existing apply steps `WritingTarget -> WriteFailed`를 유지한다.
- [x] Diagnostic enrichment는 pure helper로 둔다.
- [x] 상태 플래그 조합을 만들지 않는다.

State machine required:

- [x] Existing explicit steps only.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: copy apply overwrite failure diagnostic enrichment.
- [x] 테스트 대상: symlink apply overwrite failure diagnostic enrichment.
- [x] 테스트 대상: Product Log event가 기존 blocked summary만 유지하는지 검증한다.
- [x] 외부 의존성은 fake analyzer와 fake target store로 대체한다.
- [x] 설정 값 전달 방식 테스트는 새 설정이 없음을 build/architecture validation으로 검증한다.
- [x] 로그 정책 검증은 event payload assertion으로 검증한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 helper 이름과 branch 중복을 정리한다.

First failing tests:

- [x] `test/application/apply-use-cases.test.mjs` should fail because overwrite diagnostics are not enriched.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 existing target apply failure message를 확인한다.

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
- [x] 최소 구현으로 write failure diagnostic helper를 추가한다.
- [x] copy mode overwrite failure를 정규화한다.
- [x] symlink mode overwrite failure를 정규화한다.
- [x] Product Log event payload가 늘어나지 않았는지 확인한다.
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
- [x] 복잡한 흐름이 플래그 조합이 아니라 pure helper로 표현되었다.
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

- Added apply write failure diagnostic normalization for `target-overwrite-rejected`.
- Copy and symlink apply failures now report `category: "conflict"` and `preservationPolicy: "preserve-existing-target"`.
- Diagnostic message now states that the existing target was preserved.
- Existing `skill.apply.blocked` Product Log event shape is unchanged.
- TargetStore filesystem behavior is unchanged.

Commands run:

- `node --test test/application/apply-use-cases.test.mjs` failed before implementation and passed after implementation.
- `npm test` passed with 240 tests.
- `npm run build` passed.

Files changed:

- `.tasks/task011.md`
- `src/application/apply/apply-use-cases.js`
- `test/application/apply-use-cases.test.mjs`

Residual risks:

- [x] Replace/overwrite confirmation remains intentionally unsupported.
- [x] Source/main repository name conflict remains for a later task.
- [x] Manual Extension Host smoke for overwrite failure messaging is still pending for release readiness.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 012 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.
