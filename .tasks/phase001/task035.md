# Task 035. Repository Management Commands Wiring

## 1. Task Purpose

- [x] 이 태스크의 목적은 manifest에 노출된 `setMainRepository`, `openMainRepository`, `showDiagnostics` 명령을 실제 use case와 adapter에 연결하는 것이다.
- [x] 이 태스크 완료 후 MVP command contribution 중 runtime context invalid 상황을 제외하고 의도적으로 unwired인 명령이 없어야 한다.

## 2. Scope

### Included

- [x] `setMainRepository` application use case를 추가한다.
- [x] `openMainRepository` application use case를 추가한다.
- [x] `showDiagnostics` application use case를 추가한다.
- [x] VSCode settings writer adapter를 추가한다.
- [x] VSCode repository opener adapter를 추가한다.
- [x] `setMainRepository` command input collection에서 folder 선택을 지원한다.
- [x] extension composition이 세 명령을 use case bundle에 wiring한다.
- [x] activation에서 VSCode window/workspace API를 통해 command가 동작하는지 검증한다.

### Excluded

- [x] settings 변경 후 RuntimeContext를 즉시 재구성하지 않는다.
- [x] VSCode reload command 실행은 구현하지 않는다.
- [x] diagnostics 전용 webview 또는 output channel UI는 구현하지 않는다.

## 3. Architecture Notes

- [x] settings write와 repository open은 infrastructure adapter 뒤에 둔다.
- [x] application use case는 adapter port만 호출한다.
- [x] command handler는 domain policy를 구현하지 않는다.
- [x] `setMainRepository`는 외부 설정을 변경하지만 현재 activation의 RuntimeContext를 암묵적으로 바꾸지 않는다.

## 4. Configuration Rules

- [x] RuntimeContext는 activation 시 최초 1회 읽은 값을 유지한다.
- [x] `setMainRepository`는 사용자 명령으로 외부 설정을 쓰지만, 프로세스 중간에 hidden config re-read를 수행하지 않는다.
- [x] 새 repository path는 명시적 input DTO로 전달한다.

## 5. Logging Policy

- [x] 성공 결과는 Product Log event code만 포함한다.
- [x] 설정 쓰기 실패와 opener 실패는 typed diagnostic으로 반환한다.
- [x] 사용자 path 외에 skill body, file content, stack trace를 노출하지 않는다.

## 6. TDD Plan

- [x] 실패하는 application use case 테스트를 먼저 작성한다.
- [x] 실패하는 infrastructure settings writer 테스트를 작성한다.
- [x] 실패하는 composition wiring 테스트를 작성한다.
- [x] 실패하는 activation input collection 테스트를 작성한다.
- [x] 구현 후 targeted test, 전체 test, architecture, build를 실행한다.

## 7. Completion Report

### Summary

- `setMainRepository`, `openMainRepository`, `showDiagnostics` application use case를 추가했다.
- VSCode settings writer와 repository opener adapter를 추가했다.
- extension composition이 repository management 명령을 use case bundle에 wiring하도록 했다.
- activation에서 VSCode workspace/window API를 통해 `setMainRepository`가 folder input을 받고 settings update까지 수행하는지 검증했다.
- `setMainRepository`는 설정을 쓰지만 현재 activation RuntimeContext를 암묵적으로 재구성하지 않는다.

### Changed Files

- `src/application/repository/repository-management-use-cases.js`
- `src/application/index.js`
- `src/extension-composition.js`
- `src/extension.js`
- `src/infrastructure/vscode/vscode-settings-reader.js`
- `src/infrastructure/index.js`
- `src/presentation/command-input-collector.js`
- `test/application/repository-management-use-cases.test.mjs`
- `test/infrastructure/vscode-settings-reader.test.mjs`
- `test/extension-composition.test.mjs`
- `test/extension-activation.test.mjs`
- `.tasks/task035.md`

### Test Results

- `npm test -- test/application/repository-management-use-cases.test.mjs`: 4 tests passed.
- `npm test -- test/infrastructure/vscode-settings-reader.test.mjs`: 4 tests passed.
- `npm test -- test/extension-composition.test.mjs`: 4 tests passed.
- `npm test -- test/extension-activation.test.mjs`: 12 tests passed.
- `npm test`: 132 tests passed.
- `npm run check:architecture`: architecture ok, 24 source files checked.
- `npm run build`: architecture ok, extension manifest ok, build smoke ok.

### Verified Items

- `setMainRepository`는 explicit input DTO의 `mainRepositoryPath`만 settings writer에 전달한다.
- `openMainRepository`는 current RuntimeContext의 `mainRepositoryPath`를 opener port에 전달한다.
- `showDiagnostics`는 refresh read model diagnostics를 반환하고 설정을 재조회하지 않는다.
- VSCode API 직접 접근은 infrastructure adapter와 activation composition 경계에만 있다.
- command handler는 domain/application policy를 직접 구현하지 않는다.

### Remaining Risks

- settings 변경 후 extension RuntimeContext를 즉시 갱신하지 않는다. reload 또는 재활성화 전까지 기존 context를 유지한다.
- 실제 VSCode Extension Host에서 `openExternal` 동작과 context menu 노출은 아직 수동 또는 별도 smoke가 필요하다.
- diagnostics 전용 rich UI는 없다. 현재는 typed result와 기본 notification 흐름을 사용한다.

### Follow-up Tasks

- Extension Host smoke 또는 VSIX packaging smoke를 추가한다.
- settings 변경 후 reload 안내 UX를 명시적으로 추가할지 결정한다.
- [x] 수행한 변경 사항을 요약한다.
- [x] 생성하거나 수정한 파일을 기록한다.
- [x] 실행한 테스트 명령과 결과를 기록한다.
- [x] 검증한 항목을 기록한다.
- [x] 남은 위험 요소를 기록한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.