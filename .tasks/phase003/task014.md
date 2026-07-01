# Task 014. Confirmation Required Result And Audit Payload Consistency

## 1. Task Purpose

- [x] destructive/update/cleanup confirmation이 없어서 차단된 결과를 일관된 diagnostic taxonomy로 표현한다.
- [x] audit record가 confirmation-required 결과를 `failed`가 아니라 `blocked` status로 기록하도록 한다.
- [x] audit record에는 operation type, event code, diagnostic codes, masked references만 남긴다.
- [x] 이 태스크는 `.tasks/plan.md` Phase 003.5의 confirmation DTO taxonomy와 audit trail payload consistency 범위를 수행한다.
- [x] 완료 후 blocked destructive operation은 Product Log, diagnostic, audit record에서 같은 원인을 추적할 수 있어야 한다.

## 2. Current Context

- [x] Task 013은 Presentation prompt text를 command별로 명확히 했다.
- [x] Application use cases는 confirmation 누락 시 command별 blocked result를 반환한다.
- [x] 현재 confirmation-required diagnostic은 code/message는 있으나 category, operation, confirmation key가 일관되게 포함되지 않는다.
- [x] 현재 audit wrapper는 `result.ok === false`를 모두 `failed`로 기록한다.
- [x] confirmation 누락은 시스템 실패가 아니라 사용자 입력 부족으로 인한 안전 차단이다.

## 3. Scope

### Included

- [x] confirmation-required diagnostic helper 또는 동일한 작은 factory를 Application 계층에 추가한다.
- [x] `updateAppliedCopyFromSource`, `convertAppliedSkillMode`, `deleteSourceSkill`, `deleteBackup`, `moveAppliedSkillToMainRepository`의 confirmation-required diagnostic shape를 정규화한다.
- [x] audit wrapper가 confirmation-required blocked result를 `status: "blocked"`로 기록하도록 한다.
- [x] audit record에 `operationType`, `eventCode`, `diagnosticCodes`, `status`를 포함한다.
- [x] audit record의 reference fields는 source/target/backup의 id 또는 name 수준으로 제한하고 full path를 직접 추가하지 않는다.

### Excluded

- [x] Presentation prompt text는 변경하지 않는다.
- [x] Application confirmation policy의 allow/block 조건은 변경하지 않는다.
- [x] 새로운 VSCode 설정 또는 환경 변수를 추가하지 않는다.
- [x] audit store filesystem schema version을 변경하지 않는다.
- [x] replace/overwrite confirmation 기능은 추가하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] confirmation-required diagnostic taxonomy를 정규화한다.
- [x] 입력: confirmation 없이 호출된 destructive/update use case input.
- [x] 출력: `category: "confirmation"`, `operation`, `confirmationKey`, `required: true`가 포함된 diagnostic.
- [x] 성공 조건: 각 use case blocked diagnostic이 같은 필드 이름을 사용한다.
- [x] 실패 조건: command별로 서로 다른 필드 이름이나 누락된 category를 사용한다.

### Functional Unit 2

- [x] audit wrapper가 blocked confirmation 결과를 blocked status로 기록한다.
- [x] 입력: confirmation-required diagnostic이 포함된 command result.
- [x] 출력: audit record `status: "blocked"`, `diagnosticCodes` 포함.
- [x] 성공 조건: 사용자가 확인하지 않은 안전 차단이 시스템 실패로 오해되지 않는다.
- [x] 실패 조건: audit record status가 `failed`로 저장된다.

### Functional Unit 3

- [x] audit payload references를 masked-safe 필드로 제한한다.
- [x] 입력: commandId, result events, diagnostics, input.
- [x] 출력: operation type, command id, event code, diagnostic codes, source/target/backup id or name only.
- [x] 성공 조건: full path, token, skill body가 audit record에 추가되지 않는다.
- [x] 실패 조건: audit wrapper가 path-like input을 그대로 audit record에 넣는다.

## 5. Architecture Notes

- [x] 변경되는 계층: `Application`, `Extension composition wrapper`, `Tests`, `Task documentation`.
- [x] Domain policy는 변경하지 않는다.
- [x] Presentation input collection은 변경하지 않는다.
- [x] Infrastructure audit store는 masking behavior만 기존대로 사용하고 schema 변경을 강제하지 않는다.
- [x] confirmation-required decision은 Application result에 명시적으로 남긴다.
- [x] 외부 I/O는 audit adapter 기존 port 호출 외에 추가하지 않는다.

Changed layers:

- [x] Application
- [x] Extension wrapper
- [x] Tests
- [x] Task documentation

External I/O boundary:

- [x] Existing `auditStore.appendRecord` only.

RuntimeContext fields used:

- [x] `context.mainRepositoryPath` only for audit store repository path.

New settings:

- [x] None.

## 6. Configuration Rules

- [x] confirmation default behavior를 설정 파일로 제어하지 않는다.
- [x] confirmation-required 결과를 환경 값으로 변경하지 않는다.
- [x] audit status policy는 runtime 중간 설정 변경을 읽지 않는다.
- [x] 외부 환경 값은 activation composition에서 받은 `RuntimeContext`만 사용한다.

## 7. Logging Requirements

### Product Log

- [x] 기존 blocked Product Log event를 유지한다.
- [x] Product Log에는 diagnostic code와 target/source 식별자만 남긴다.
- [x] Product Log에 full path, skill body, prompt text를 추가하지 않는다.

### Field Debug Log

- [x] Field Debug Log를 추가하지 않는다.
- [x] audit write failure는 기존 warning diagnostic으로 primary result에 병합한다.

### Development Log

- [x] 테스트 fixture에 audit payload expectation을 둔다.
- [x] 프로덕션 기본 동작에 개발 로그를 추가하지 않는다.

Product Log events:

- [x] Existing blocked/completed events only.

Field Debug Log events:

- [x] None.

Development Log usage:

- [x] `node --test`, `npm test`, `npm run build` local output only.

## 8. State Machine Requirements

- [x] 별도 runtime state machine class를 추가하지 않는다.
- [x] confirmation-required result는 explicit steps로 표현한다.
- [x] 상태 전이 이름은 `ConfirmationRequired`, `ImpactConfirmationRequired`, `CleanupConfirmationRequired`, `LocalModificationBlocked`를 유지한다.
- [x] audit status 결정은 `completed`, `blocked`, `failed` 중 하나로 pure helper에서 계산한다.

State machine required:

- [x] Explicit result status helper only.

## 9. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] 테스트 대상: update copy confirmation-required diagnostic taxonomy.
- [x] 테스트 대상: delete source impact/source confirmation-required diagnostic taxonomy.
- [x] 테스트 대상: move cleanup confirmation-required diagnostic taxonomy.
- [x] 테스트 대상: delete backup confirmation-required diagnostic taxonomy.
- [x] 테스트 대상: audit wrapper stores blocked status and diagnostic codes for confirmation-required result.
- [x] 외부 의존성은 fake target store, fake skill repository, fake audit store로 대체한다.
- [x] 설정 값 전달 방식 테스트는 새 설정이 없음을 build/manifest validation으로 검증한다.
- [x] 로그 정책 검증은 Product Log event code가 기존 blocked event로 유지되는지 assertion한다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 helper 이름과 payload key를 정리한다.

First failing tests:

- [x] `test/application/skill-operation-use-cases.test.mjs` should fail because confirmation diagnostics do not include normalized taxonomy.
- [x] `test/application/transfer-use-cases.test.mjs` should fail because cleanup confirmation diagnostic does not include normalized taxonomy.
- [x] `test/extension-activation.test.mjs` should fail because audit status for confirmation-required blocked result is currently `failed`.

Manual smoke steps:

- [x] Extension Host manual smoke는 이번 태스크에서 실행하지 않는다.
- [x] 후속 release smoke에서 blocked destructive commands가 Diagnostics와 audit에서 일관되게 보이는지 확인한다.

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
- [x] 최소 구현으로 Application confirmation diagnostic helper를 추가한다.
- [x] 최소 구현으로 affected use cases의 diagnostic payload를 정규화한다.
- [x] 최소 구현으로 audit status helper를 추가한다.
- [x] 최소 구현으로 audit payload key를 `diagnosticCodes`로 명확히 한다.
- [x] Product Log event shape가 불필요하게 변경되지 않았는지 확인한다.
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
- [x] 외부 I/O가 audit boundary 외에 추가되지 않는다.
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

- [x] Added an Application-level `confirmationRequiredDiagnostic` helper.
- [x] Normalized confirmation-required diagnostics for update copy, convert mode, source delete impact, source delete, backup delete, and move cleanup.
- [x] Updated audit wrapping so blocked Product Log events are stored with `status: "blocked"` instead of `failed`.
- [x] Updated audit records to use `operationType`, `eventCode`, `diagnosticCodes`, and safe id/name references without full paths.

Commands run:

- [x] `node --test test/application/skill-operation-use-cases.test.mjs` failed before implementation and passed after implementation.
- [x] `node --test test/application/transfer-use-cases.test.mjs` failed before implementation and passed after implementation.
- [x] `node --test test/extension-activation.test.mjs` failed before implementation and passed after implementation.
- [x] `npm test` passed with 247 tests.
- [x] `npm run build` passed.

Files changed:

- [x] `.tasks/task014.md`
- [x] `src/application/confirmation/confirmation-diagnostics.js`
- [x] `src/application/skill/skill-operation-use-cases.js`
- [x] `src/application/transfer/transfer-use-cases.js`
- [x] `src/extension.js`
- [x] `test/application/skill-operation-use-cases.test.mjs`
- [x] `test/application/transfer-use-cases.test.mjs`
- [x] `test/extension-activation.test.mjs`

Residual risks:

- [x] Audit explorer UI is outside this task.
- [x] Manual Extension Host smoke for blocked confirmation audit records is still pending for release readiness.

Next task decision:

- [x] Create the next task file only after this task passes focused tests, full `npm test`, and `npm run build`.
- [x] Start Task 015 if the user asks to continue.

Stop conditions:

- [ ] Stop if focused tests fail after implementation.
- [ ] Stop if `npm test` fails.
- [ ] Stop if `npm run build` fails.
- [ ] Stop if implementation needs a new setting.