# Task 017. Extension Runtime Composition

## 1. Task Purpose

- [x] 이 태스크의 목적은 settings reader, RuntimeContext, infrastructure adapters, application use cases, presentation command handlers를 연결하는 composition root를 구현하는 것이다.
- [x] 이 태스크 완료 후 settings는 startup에서 한 번만 읽히고, command handlers는 frozen RuntimeContext를 명시적으로 주입받아야 한다.

## 2. Scope

### Included

- [x] `createExtensionComposition({ settingsReader, workspaceRoots, adapters, analyzer })`를 구현한다.
- [x] settings reader는 최초 1회만 호출한다.
- [x] valid RuntimeContext이면 use case bundle과 command handlers를 생성한다.
- [x] invalid RuntimeContext이면 diagnostics와 unwired command handlers를 반환한다.

### Excluded

- [x] VSCode prompt와 result rendering은 구현하지 않는다.
- [x] 실제 VSCode settings reader는 구현하지 않는다.
- [x] TreeDataProvider state wiring은 구현하지 않는다.

## 3. Architecture Notes

- [x] composition root는 extension boundary에 둔다.
- [x] Domain/Application에는 VSCode API import를 추가하지 않는다.
- [x] adapters는 dependency로 주입하거나 composition root에서만 생성한다.

## 4. TDD Plan

- [x] 실패하는 테스트를 먼저 작성한다.
- [x] settings reader가 한 번만 호출되는지 검증한다.
- [x] refresh command handler가 composed RuntimeContext와 adapters를 사용해 read model을 반환하는지 검증한다.
- [x] invalid context가 diagnostics와 command-handler-not-wired result를 반환하는지 검증한다.

## 5. Completion Report

- [x] 수행한 변경 사항을 요약한다.
  - `createExtensionComposition` composition root를 추가했다.
  - settings reader를 `buildRuntimeContext`로 연결해 startup 시 1회만 읽도록 했다.
  - valid RuntimeContext이면 adapters, application use cases, command handlers를 연결하도록 했다.
  - invalid RuntimeContext이면 diagnostics와 unwired command handlers를 반환하도록 했다.
  - default adapters로 `FileSystemSkillRepository`, `FileSystemTargetStore`를 composition root에서만 생성하도록 했다.
- [x] 생성하거나 수정한 파일을 기록한다.
  - 생성: `src/extension-composition.js`
  - 생성: `test/extension-composition.test.mjs`
  - 수정: `.tasks/task017.md`
- [x] 실행한 테스트 명령과 결과를 기록한다.
  - `npm test`: 통과, 69 tests / 69 pass
  - `npm run check:architecture`: 통과, 18 source files checked
  - `npm run build`: 통과, architecture check와 build smoke 모두 통과
- [x] 검증한 항목을 기록한다.
  - settings reader가 한 번만 호출되는지 확인했다.
  - composed refresh command가 frozen RuntimeContext와 adapters를 사용해 read model을 반환하는지 확인했다.
  - invalid RuntimeContext가 diagnostics와 `command-handler-not-wired` result를 반환하는지 확인했다.
  - Domain/Application이 VSCode API를 import하지 않는지 확인했다.
  - filesystem adapter 생성이 composition root에만 위치하는지 확인했다.
- [x] 남은 위험 요소를 기록한다.
  - 실제 VSCode settings reader는 아직 없다.
  - 실제 prompt/input collection과 result rendering은 아직 없다.
  - `activate`에서 `createExtensionComposition`을 실제 settings reader와 연결하는 작업은 아직 없다.
  - apply/import analyzer composition은 명시 analyzer dependency가 주입될 때만 동작한다.
  - VSCode integration smoke는 아직 없다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
  - 다음 태스크는 VSCode settings reader adapter와 activation composition을 구현해야 한다.
  - settings reader는 VSCode configuration을 activation에서 한 번만 읽고 RuntimeContext로 고정해야 한다.
  - command prompts/result rendering은 그 다음 태스크로 분리해야 한다.
