# Phase 004 확장 호스트 수동 검증 기록

이 템플릿은 현재 Phase 004 로컬 릴리스 후보에 대해 VSCode Extension Development Host 수동 검증 결과를 기록하기 위한 문서다. secret, token, 사용자 파일 전문, 전체 stack trace, 마스킹되지 않은 private path를 기록하지 않는다.

## 1. 검증 세션

- 날짜:
- 검증자:
- 상태: pending
- 결과: pending
- 범위: Phase 004 local release candidate

허용 상태 값:

- completed
- blocked
- skipped

## 2. 환경

- 운영체제:
- VSCode version:
- Extension Development Host 실행 명령:
- 사용한 Main Repository path:
- Workspace mode: folder, multi-root, file-only 중 하나
- 확인한 agent client: Codex, Claude, custom, none 중 하나

Path 기록 규칙:

- 가능하면 path category 또는 masked path만 기록한다.
- secret, token, private repository content, full skill body text를 기록하지 않는다.

## 3. 실행 명령

수동 smoke 전에 실행한 자동 검증 명령:

```text
npm test
npm run build
npm run check:vsix-candidate
npm run release:gate
```

`node_modules/.bin/vsce`가 이미 있을 때만 실행하는 선택적 local package 명령:

```text
npm run package:vsix-candidate
```

Extension Host 실행 명령:

```text
scripts/run-vscode-extension-host.sh
```

`code`를 사용할 수 없으면 사용자에게 표시된 실패 문구와 `CODE_BIN` 사용 여부를 기록한다.

## 4. 체크리스트 결과 요약

- 자동 검증:
- 확장 개발 호스트:
- 리포지토리 설정:
- 리포지토리 인덱스와 버전 관리:
- Main Repository 스킬 생명주기:
- Global 및 Project 적용:
- Diagnostics와 Analysis:
- 백업 전송과 안전성:
- Diagnostics Remediation Workflow:
- Watcher Refresh와 Runtime Recomposition:
- 문서와 Release Gate:

사용할 결과 값:

- pass
- fail
- blocked
- not run

## 5. 실패 또는 차단 항목

실패하거나 차단된 체크리스트 항목마다 다음을 기록한다.

- 체크리스트 섹션:
- 항목:
- 관찰 결과:
- 기대 결과:
- Diagnostic code 또는 command id:
- 증거 메모:
- 후속 task:

`SKILL.md` 전문, raw secret, raw token, 전체 stack trace, 마스킹되지 않은 customer path를 붙여넣지 않는다.

## 6. 검증 증거 메모

완료한 확인 항목의 간단한 증거를 기록한다.

- Activity Bar와 view visibility:
- Main Repository setup:
- Apply/remove behavior:
- Diagnostics and remediation behavior:
- Backup compare/restore/delete behavior:
- Runtime refresh behavior:
- Release gate output:

Screenshot은 private path, secret, token, user file content를 노출하지 않을 때만 파일명으로 참조한다.

## 7. 릴리스 판단

- 판단: pending
- release candidate 전 필수 후속 작업:
- 연기 항목:
- 검증자 메모:

허용 판단 값:

- ready
- blocked
- defer