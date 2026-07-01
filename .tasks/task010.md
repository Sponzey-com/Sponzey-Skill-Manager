# Task 010. Diagnostics Action Presentation Mapping

## 1. Task Purpose

- [x] Analyzer가 제공하는 `allowedActions`와 `blockedActions`를 Diagnostics tree item의 presentation payload로 노출한다.
- [x] 기존 Diagnostics context menu가 깨지지 않도록 legacy `contextValue`를 유지한다.
- [x] 후속 command routing이 action code를 기준으로 안전하게 동작할 수 있는 read-only 기반을 만든다.

## 2. Current Context

- [x] Task 009에서 Domain/Application diagnostic remediation action contract가 구현되었다.
- [x] 현재 tree model은 diagnostic DTO를 보존하지만, action availability를 별도 presentation summary로 제공하지 않는다.
- [x] 이번 태스크는 UI command 실행이 아니라 Presentation read model mapping까지만 다룬다.

## 3. Scope

### Included

- [x] Diagnostic tree item에 action summary payload를 추가한다.
- [x] `allowedActionCodes`, `blockedActionCodes`, confirmation-required action 여부를 deterministic하게 계산한다.
- [x] Tree provider가 기존 `contextValue`를 유지하는지 테스트한다.

### Excluded

- [x] 새 VSCode command를 추가하지 않는다.
- [x] `package.json` context menu contribution을 변경하지 않는다.
- [x] remediation action execution state machine은 구현하지 않는다.
- [x] target write/delete mutation은 실행하지 않는다.

## 4. Functional Units

### Functional Unit 1

- [x] `tree-view-model`이 diagnostic action summary를 생성한다.
- [x] 입력: diagnostic DTO with `allowedActions`, `blockedActions`.
- [x] 출력: tree item `diagnosticActions` object.
- [x] 성공 조건: action code 목록, blocked 여부, confirmation-required 여부가 표시된다.
- [x] 실패 조건: Presentation이 risk policy를 재계산하지 않는다.

### Functional Unit 2

- [x] Tree item context compatibility를 유지한다.
- [x] 입력: diagnostic with source, diagnostic without source.
- [x] 출력: 기존 `sponzeyDiagnosticWithSource`, `sponzeyDiagnostic` contextValue.
- [x] 성공 조건: 기존 Show Detail/Open SKILL.md menu 조건이 깨지지 않는다.
- [x] 실패 조건: `contextValue`에 action code를 섞어 기존 `when` clause를 깨지 않는다.

### Functional Unit 3

- [x] Tree provider가 action summary를 VSCode TreeItem 변환 과정에서 숨겨진 설정이나 외부 I/O 없이 유지한다.
- [x] 입력: cached read model.
- [x] 출력: `getChildren` element payload contains `diagnosticActions`; `getTreeItem` output keeps legacy context.
- [x] 성공 조건: command handler가 element payload로 action summary를 받을 수 있다.
- [x] 실패 조건: VSCode API wrapper가 action policy를 재계산하지 않는다.

## 5. Architecture Notes

- [x] 변경 계층은 Presentation이다.
- [x] Domain/Application action policy는 재계산하지 않고 DTO를 read-only로 매핑한다.
- [x] Tree provider는 외부 I/O를 수행하지 않는다.
- [x] VSCode command id mapping은 후속 태스크에서 Presentation command routing으로 구현한다.

## 6. Configuration Rules

- [x] 새 설정을 추가하지 않는다.
- [x] action visibility를 설정 파일 또는 runtime 중간 환경 변경으로 제어하지 않는다.
- [x] tree model은 read model input만 사용한다.

## 7. Logging Requirements

### Product Log

- [x] 이번 태스크에서 새 Product Log event를 추가하지 않는다.

### Field Debug Log

- [x] 이번 태스크에서 Field Debug Log 출력 구현을 추가하지 않는다.

### Development Log

- [x] test assertion 외 개발용 로그를 추가하지 않는다.

## 8. State Machine Requirements

- [x] 이번 태스크는 read-only mapping만 수행하므로 새 상태머신을 추가하지 않는다.
- [x] 후속 execution task에서 remediation action state machine을 구현해야 한다.

## 9. TDD Plan

- [x] 실패하는 tree model action summary 테스트를 먼저 작성한다.
- [x] 실패하는 tree provider compatibility 테스트를 먼저 작성한다.
- [x] 최소 presentation mapping을 구현한다.
- [x] 기존 diagnostics context menu manifest 테스트가 계속 통과하는지 확인한다.
- [x] 전체 테스트와 release gate를 실행한다.

## 10. Implementation Checklist

- [x] 실패 테스트를 작성한다.
- [x] `diagnosticActions` summary helper를 구현한다.
- [x] `item` payload에 `diagnosticActions`를 보존한다.
- [x] 기존 `contextValue`를 변경하지 않는다.
- [x] 외부 설정, 로그, I/O를 추가하지 않는다.
- [x] 모든 관련 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] Presentation이 Domain policy를 재구현하지 않는다.
- [x] VSCode command id가 Domain 또는 Application action contract에 섞이지 않는다.
- [x] 설정 값이 런타임 중간에 재조회되지 않는다.
- [x] 로그 정책을 침범하지 않는다.
- [x] mutation workflow를 새로 추가하지 않았다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항을 요약한다.
  - Diagnostics tree item에 `diagnosticActions` presentation payload를 추가했다.
  - `allowedActionCodes`, `blockedActionCodes`, `confirmationRequiredActionCodes`, `hasBlockedActions`, `hasMutatingAllowedActions`를 read-only로 계산한다.
  - 기존 `sponzeyDiagnosticWithSource`, `sponzeyDiagnostic` contextValue는 변경하지 않았다.
  - Tree provider는 VSCode TreeItem 변환 시 legacy context를 유지하고, command handler가 받을 element payload에는 action summary를 보존한다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - `.tasks/task010.md`
  - `src/presentation/tree-view-model.js`
  - `test/presentation/tree-view-model.test.mjs`
  - `test/presentation/tree-data-provider.test.mjs`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `node --test test/presentation/tree-view-model.test.mjs test/presentation/tree-data-provider.test.mjs` 통과: 19 tests, 19 pass
  - `npm test` 통과: 300 tests, 300 pass
  - `npm run build` 통과: architecture ok, manifest ok, build smoke ok
  - `npm run release:gate` 통과: tests, architecture, manifest, build, docs, smoke
- [x] 검증한 항목을 기록한다.
  - Presentation은 Domain risk policy를 재계산하지 않는다.
  - `contextValue`를 action code와 섞지 않아 기존 manifest `when` clause가 유지된다.
  - 새 설정, 새 로그, 새 외부 I/O를 추가하지 않았다.
  - mutation action execution workflow를 추가하지 않았다.
- [x] 남은 위험 요소를 기록한다.
  - Diagnostics context menu에서 action별 command visibility를 동적으로 제어하는 기능은 아직 없다.
  - `diagnosticActions`는 payload로만 존재하며 실제 command routing은 후속 태스크가 필요하다.
  - `.gitignore`의 `.tasks/` ignore 변경 때문에 새 task 문서는 현재 git status에 표시되지 않는다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 작업은 action code를 실제 Presentation command routing에 연결하는 것이다.
  - mutating action은 confirmation state machine을 통과하도록 설계해야 한다.
  - package menu 변경이 필요하면 기존 manifest validation test를 먼저 실패 테스트로 갱신해야 한다.

## 13. Next Task Decision Hook

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다. Phase 004 전체 목표에는 아직 도달하지 않았다.
- [x] 도달하지 못했다면 남은 목표를 정리한다. 남은 목표는 remediation command routing, action execution state machine, target profile governance, release candidate readiness다.
- [x] 다음 우선순위 태스크를 결정한다. 다음 우선순위는 Diagnostics remediation command routing contract다.
- [x] 다음 태스크 파일명을 결정한다. 다음 파일은 `.tasks/task011.md`다.

## 14. Stop Conditions

- [x] 해당 없음: `plan.md`의 최종 목표에는 아직 도달하지 않았다.
- [x] 해당 없음: 필수 요구사항이 명확하여 진행을 계속할 수 있었다.
- [x] 해당 없음: 추가 외부 정보, 권한, 비밀값, 접근 권한 없이 검증 가능한 범위에서 진행했다.
