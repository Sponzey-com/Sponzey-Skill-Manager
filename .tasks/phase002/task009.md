# Task 009. Analyze Commands And Copy Update With Sync Guard

## 1. Summary

- [x] 목적: 단일/전체 skill 분석 command UX를 정리하고, copy 적용본을 source에서 업데이트하는 안전한 use case를 구현한다.
- [x] 해결 문제: 분석 결과와 sync status가 있어도 사용자가 재분석하거나 copy drift를 안전하게 복구할 command가 없으면 관리 도구 흐름이 끊긴다.
- [x] 완료 상태: Analyze Skill, Analyze All Skills, Update Applied Copy From Source가 command palette/tree context에서 동작하고 target modification guard가 적용된다.

## 2. Scope

### Included

- [x] single skill and analyze-all command UX
- [x] `UpdateAppliedCopyFromSource` use case
- [x] target changed confirmation guard

### Excluded

- [x] analyzer rule set 확장
- [x] symlink/copy mode conversion
- [x] external-to-managed conversion

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 004 analysis command UX
- [x] `.tasks/plan.md` Phase 006 update copy from source
- [x] `.tasks/plan.md` 7.1 Analyzer policy gate and sync status gate
- [x] `AGENTS.md` 13.4 Symlink vs Copy Apply, 13.5 Risk Policy

## 4. Dependencies

### Previous Tasks

- [x] Task 005. HashPort And Sync Status Policy
- [x] Task 006. Sync Read Model And Tree Mapping
- [x] Task 008. Skill Detail And Diagnostics Grouping

### Next Tasks

- [x] Task 010. Analyzer Taxonomy Structure And Quality Rules
- [x] Task 012. Apply Mode Conversion And External-To-Managed Flow

## 5. Architecture Notes

- [x] 변경 계층: Application analyze/update use cases, Domain update policy, Infrastructure target/source ports, Presentation commands
- [x] 의존 방향: command handler는 use case를 호출하고 overwrite/update policy는 Domain/Application에 둔다.
- [x] 도메인 책임: copy update guard, target modified block rule, risk block/confirmation rule 제공
- [x] 유스케이스 책임: source read, target status check, analysis update, copy replacement plan/output 조합
- [x] 인프라 책임: source content read/copy and target write/remove adapter 구현
- [x] 외부 시스템 접근 위치: filesystem copy/write는 Infrastructure target store에서만 수행한다.

## 6. Functional Requirements

- [x] Analyze Skill은 source item과 applied item에서 실행 가능하고 diagnostics summary를 갱신한다.
- [x] Analyze All Skills는 모든 Main Repository source를 분석하고 summary diagnostic을 반환한다.
- [x] Update Applied Copy는 `Target Changed` 또는 `Both Changed` 상태에서 explicit confirmation 없이 block된다.

## 7. Non-Functional Requirements

- [x] 설정 관리: default update behavior를 settings로 숨기지 않고 confirmation은 explicit input으로 받는다.
- [x] 로그 요구사항: analysis/update completed/failed/blocked는 Product Log, rule/hash detail은 Field Debug Log로 분리한다.
- [x] 오류 처리: source missing, target missing, non-copy target, local modification, critical risk block을 구분한다.
- [x] 테스트 가능성: analyzer, source repository, target store, sync calculator는 fake로 대체한다.
- [x] 유지보수성: analyze command와 update command를 하나의 UI handler에 섞지 않는다.

## 8. Implementation Steps

- [x] Analyze All이 모든 source analyzer를 호출하는 실패 테스트를 작성한다.
- [x] target changed copy update가 confirmation 없이 block되는 실패 테스트를 작성한다.
- [x] in-sync copy update가 target copy를 교체하는 실패 테스트를 작성한다.
- [x] Analyze Skill/Analyze All command descriptors와 context menu를 구현한다.
- [x] `UpdateAppliedCopyFromSource` input/output, state steps, target write port 호출을 구현한다.
- [x] update result가 tree refresh를 유발하도록 command wrapper를 연결한다.
- [x] `npm test`, `npm run build`, manifest check를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 analyze-all use case test를 먼저 작성한다.
- [x] copy update use case test를 fake ports로 작성한다.
- [x] source repository, target store, sync calculator, analyzer는 테스트 더블로 대체한다.
- [x] confirmation input이 explicit DTO로 전달되는지 테스트한다.
- [x] `skill.analysis.completed`, `skill.analysis.failed`, `skill.apply.blocked`, `sync.hash.compared` event 후보를 검증한다.
- [x] non-copy target, missing source, target changed 오류 케이스를 테스트한다.
- [x] analyzer command wiring 정리와 copy update 기능 구현을 분리한다.

## 10. Validation Checklist

- [x] single/all analysis command가 tree와 command palette에서 동작한다.
- [x] copy update는 local modification을 overwrite하지 않는다.
- [x] Domain/Application에 update policy가 있고 Infrastructure는 정책을 결정하지 않는다.
- [x] update 중 settings/env를 재조회하지 않는다.
- [x] RuntimeContext, item payload, explicit confirmation으로 input을 구성한다.
- [x] 로그 event는 3단계 정책에 맞게 분리된다.
- [x] fake ports로 외부 의존성을 대체할 수 있다.
- [x] copy update 상태 전이가 명시적으로 테스트된다.
- [x] 기능 변경과 command descriptor 정리가 리뷰 가능하게 분리된다.

## 11. Logging Requirements

### Product Log

- [x] `skill.analysis.completed`와 `skill.analysis.failed`는 count, severity summary, masked skill id만 기록한다.
- [x] `skill.apply.blocked` 또는 update blocked event 후보는 block reason만 기록하고 full path를 제외한다.

### Field Debug Log

- [x] `analysis.rule.completed`는 rule id, category, severity summary를 기록하되 skill body를 제외한다.
- [x] copy update hash comparison은 `sync.hash.compared`로 masked id만 기록한다.

### Development Log

- [x] analyzer fixture와 fake target write count는 테스트에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: copy update에는 필요하고 analyze-all에는 명시 step contract가 필요하다.
- [x] 상태 목록: `ValidatingInput`, `LoadingAppliedSkill`, `CalculatingSync`, `WaitingForConfirmation`, `WritingTarget`, `WritingMetadata`, `VerifyingResult`, `Completed`
- [x] 이벤트 목록: `UpdateRequested`, `SyncCalculated`, `ConfirmationProvided`, `TargetWritten`, `MetadataWritten`, `Verified`
- [x] 전이 조건: `Target Changed` 또는 `Both Changed`는 confirmation 없이는 `LocalModificationBlocked`로 이동한다.
- [x] 실패 상태: `InvalidInput`, `TargetMissing`, `SourceMissing`, `LocalModificationBlocked`, `WriteFailed`, `VerificationFailed`
- [x] 종료 상태: `Completed`
- [x] 상태 전이는 fake ports로 테스트한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] Sync status gate와 Analyzer policy gate의 command UX 선행 조건이 충족된다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 010/011 analyzer 확장과 Task 012 conversion이 이 use case contract를 이어받을 수 있다.
