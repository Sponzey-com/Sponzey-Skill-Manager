# Task 018. VSCode Settings Reader And Activation Composition

## 1. Task Purpose

- [x] 이 태스크의 목적은 VSCode workspace configuration을 읽는 settings reader adapter를 만들고, extension `activate`에서 composition root를 실제 command registration과 연결하는 것이다.
- [x] 이 태스크 완료 후 settings는 activation 중 최초 1회만 읽히고, command handler 실행 중 재조회되지 않아야 한다.

## 2. Scope

### Included

- [x] `createVsCodeSettingsReader({ workspace })` infrastructure adapter를 구현한다.
- [x] VSCode workspace folders를 RuntimeContext `workspaceRoots` input으로 변환한다.
- [x] `activate(context, runtime)`에서 VSCode API 또는 injected API를 사용해 composition을 생성한다.
- [x] composed command handlers를 command registry에 등록한다.
- [x] VSCode runtime 없이 fake API로 activation composition을 테스트한다.

### Excluded

- [x] VSCode input prompt를 구현하지 않는다.
- [x] command result rendering을 구현하지 않는다.
- [x] TreeDataProvider runtime class를 구현하지 않는다.
- [x] packaging/publishing을 구현하지 않는다.

## 3. Architecture Notes

- [x] VSCode workspace API 접근은 infrastructure/extension boundary에만 둔다.
- [x] Domain/Application에는 VSCode API import를 추가하지 않는다.
- [x] settings reader는 외부 설정을 activation에서 한 번만 읽는 adapter다.
- [x] command handler는 RuntimeContext를 재조회하지 않고 composition에서 받은 context를 사용한다.

## 4. Configuration Rules

- [x] `workspace.getConfiguration("sponzeySkills")`는 settings reader `readSettings()` 중 한 번만 호출한다.
- [x] command 실행 중 configuration을 다시 읽지 않는다.
- [x] default 설정값은 adapter 안에서 명시적으로 제공한다.

## 5. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] settings reader가 expected configuration keys를 읽고 defaults를 반환하는지 검증한다.
- [x] workspace roots가 workspace folders에서 추출되는지 검증한다.
- [x] activation이 settings를 한 번만 읽고 command handler를 등록하는지 검증한다.
- [x] refresh command 실행이 settings를 재조회하지 않는지 검증한다.

## 6. Completion Report

- [x] 수행한 변경 사항을 요약한다.
  - `createVsCodeSettingsReader` adapter를 추가했다.
  - VSCode workspace configuration namespace `sponzeySkills`를 RuntimeContext settings shape로 변환하도록 했다.
  - `readVsCodeWorkspaceRoots`를 추가해 workspace folders의 `uri.fsPath`를 workspace roots로 변환하도록 했다.
  - `activate`가 injected `vscodeApi` 또는 실제 VSCode module을 사용해 settings reader와 composition root를 생성하도록 했다.
  - composed command handlers를 command registry에 등록하도록 했다.
  - command 실행 중 settings를 다시 읽지 않는 것을 테스트로 검증했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 생성: `src/infrastructure/vscode/vscode-settings-reader.js`
  - 수정: `src/infrastructure/index.js`
  - 수정: `src/extension.js`
  - 생성: `test/infrastructure/vscode-settings-reader.test.mjs`
  - 생성: `test/extension-activation.test.mjs`
  - 수정: `.tasks/task018.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 72 tests / 72 pass
  - `npm run check:architecture`: 통과, 19 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - settings reader가 `mainRepositoryPath`, `enabledClients`, `globalTargets`, `projectTargetPatterns`, `defaultApplyMode`, 정책 객체들을 읽는지 확인했다.
  - workspace roots가 VSCode workspace folders에서 추출되는지 확인했다.
  - activation 중 configuration이 한 번만 조회되는지 확인했다.
  - refresh command 실행 후 configuration 조회 횟수가 증가하지 않는지 확인했다.
  - composed command handlers가 registered command로 연결되는지 확인했다.
  - Domain/Application이 VSCode API를 import하지 않는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - VSCode prompt/input collection은 아직 없다.
  - command result rendering은 아직 없다.
  - 실제 TreeDataProvider runtime class는 아직 없다.
  - analyzer dependency는 activation runtime에서 주입되지 않으면 import/apply command가 not-wired 상태로 남는다.
  - VSCode extension host integration smoke는 아직 없다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 command result rendering과 minimal UI notifier adapter를 구현해야 한다.
  - prompt/input collection은 rendering 후 별도 태스크로 분리한다.
  - result renderer는 Product/Field Debug event 후보를 실제 output으로 과하게 노출하지 않도록 제한해야 한다.
