# Task 033. Extension Manifest Smoke Gate

## 1. Task Purpose

- [x] 이 태스크의 목적은 VSCode extension manifest가 MVP command/view/context menu 구조와 일치하는지 빌드 단계에서 검증하는 것이다.
- [x] 이 태스크 완료 후 manifest 누락, 잘못된 command 참조, 잘못된 view/menu 참조, entrypoint 누락을 local build에서 즉시 감지해야 한다.

## 2. Scope

### Included

- [x] manifest validation rule을 순수 함수로 구현한다.
- [x] `package.json`의 `main` entrypoint 파일 존재를 검증한다.
- [x] `package.json`의 `engines.vscode` 존재를 검증한다.
- [x] command contribution의 command/title 무결성과 중복을 검증한다.
- [x] view container와 tree view contribution의 참조 무결성과 중복을 검증한다.
- [x] `view/item/context` menu가 존재하는 command와 view만 참조하는지 검증한다.
- [x] `viewItem` context value가 허용 목록만 사용하는지 검증한다.
- [x] manifest check script를 추가하고 build gate에 연결한다.

### Excluded

- [x] VSCode extension host 실행은 구현하지 않는다.
- [x] VSIX packaging은 구현하지 않는다.
- [x] marketplace metadata completeness 검증은 구현하지 않는다.
- [x] activation performance 측정은 구현하지 않는다.

## 3. Architecture Notes

- [x] manifest validation은 scripts 계층의 개발 도구로 유지한다.
- [x] runtime source code는 manifest validation에 의존하지 않는다.
- [x] validation rule은 외부 API, 네트워크, VSCode runtime을 사용하지 않는다.
- [x] command/view 정의의 runtime 동작은 기존 presentation 테스트가 검증한다.

## 4. Configuration Rules

- [x] manifest validation은 `package.json` 파일만 읽는다.
- [x] 환경 변수 또는 외부 설정 파일을 읽지 않는다.
- [x] validation 결과는 command output으로만 노출한다.

## 5. Logging Policy

- [x] validation 실패는 stderr에 machine-readable code와 message를 출력한다.
- [x] skill body, file content, 사용자 경로 목록을 출력하지 않는다.
- [x] 성공 시 최소 Product-level build 메시지만 출력한다.

## 6. TDD Plan

- [x] 실패하는 manifest rule 테스트를 먼저 작성한다.
- [x] 현재 `package.json` manifest가 validator를 통과하는지 검증한다.
- [x] missing `engines.vscode`가 diagnostic으로 보고되는지 검증한다.
- [x] missing main entrypoint가 diagnostic으로 보고되는지 검증한다.
- [x] unknown menu command/view/context value가 diagnostic으로 보고되는지 검증한다.
- [x] `npm run build`가 manifest check를 포함하는지 검증한다.

## 7. Completion Report

### Summary

- extension manifest validation rule을 순수 함수로 추가했다.
- `package.json`의 `main` entrypoint, `engines.vscode`, command/view/menu reference integrity를 검증한다.
- CLI script `check-extension-manifest.mjs`를 추가하고 `npm run build` gate에 연결했다.
- `package.json`에 `check:manifest` script와 `engines.vscode`를 추가했다.

### Changed Files

- `scripts/extension-manifest-rules.mjs`
- `scripts/check-extension-manifest.mjs`
- `test/scripts/extension-manifest-rules.test.mjs`
- `package.json`
- `.tasks/task033.md`

### Test Results

- `npm test -- test/scripts/extension-manifest-rules.test.mjs`: 5 tests passed.
- `npm run check:manifest`: extension manifest ok.
- `npm test`: 121 tests passed.
- `npm run check:architecture`: architecture ok, 23 source files checked.
- `npm run build`: architecture ok, extension manifest ok, build smoke ok.

### Verified Items

- missing `engines.vscode`는 `manifest-missing-vscode-engine` diagnostic으로 보고된다.
- missing `main` entrypoint는 `manifest-main-entrypoint-missing` diagnostic으로 보고된다.
- unknown context menu command/view/viewItem 참조는 각각 typed diagnostic으로 보고된다.
- manifest validation은 네트워크, VSCode runtime, 환경 변수를 사용하지 않는다.
- build gate가 architecture check, manifest check, import smoke를 순서대로 실행한다.

### Remaining Risks

- 실제 VSCode extension host 실행은 아직 검증하지 않았다.
- VSIX packaging 산출물 검증은 아직 없다.
- marketplace metadata completeness는 MVP build gate에서 제외했다.

### Follow-up Tasks

- extension host를 사용할 수 있는 환경에서 activation/context menu smoke를 추가한다.
- VSIX packaging이 필요해지면 packaging manifest completeness gate를 별도로 추가한다.

- [x] 수행한 변경 사항을 요약한다.
- [x] 생성하거나 수정한 파일을 기록한다.
- [x] 실행한 테스트 명령과 결과를 기록한다.
- [x] 검증한 항목을 기록한다.
- [x] 남은 위험 요소를 기록한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
