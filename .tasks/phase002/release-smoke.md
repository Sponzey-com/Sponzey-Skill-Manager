# Release Smoke Checklist

## Extension Host

- [ ] `npm test`가 통과한다.
- [ ] `npm run build`가 통과한다.
- [ ] `scripts/run-vscode-extension-host.sh`가 VSCode Extension Development Host를 실행한다.
- [ ] `code` command가 없을 때 script가 `CODE_BIN` 안내를 출력한다.

## Repository Setup

- [ ] Main Repository를 새 temp directory로 설정한다.
- [ ] `skills/`, `backups/`, `.sponzey/` directory가 생성된다.
- [ ] `~/.agents/skills` 또는 `~/.claude/skills`를 Main Repository로 선택하면 차단된다.
- [ ] settings 변경 후 reload 없이 tree refresh가 새 RuntimeContext를 사용한다.

## Skill Source Lifecycle

- [ ] Main Repository에 skill을 생성한다.
- [ ] local folder 또는 URL/path에서 skill을 install/import한다.
- [ ] source folder와 `SKILL.md`를 context menu에서 연다.
- [ ] source detail과 diagnostics를 확인한다.
- [ ] source rename/export/delete command가 confirmation guard를 요구한다.

## Apply, Sync, And Transfer

- [ ] source skill을 global target에 copy apply한다.
- [ ] source skill을 project target에 symlink apply한다.
- [ ] applied skill remove가 source를 삭제하지 않는다.
- [ ] copy/symlink/external skill 상태가 tree에 구분되어 표시된다.
- [ ] copy update 또는 conversion은 target 변경 상태에서 confirmation 없이 차단된다.
- [ ] applied skill copy/backup/move to Main Repository가 target/source 의미를 구분한다.

## Analyzer

- [ ] missing `SKILL.md`는 critical diagnostic을 표시한다.
- [ ] malformed frontmatter는 structure diagnostic을 표시한다.
- [ ] broad description은 quality diagnostic을 표시한다.
- [ ] destructive command, curl-to-shell, policy override phrase는 critical security diagnostic을 표시한다.
- [ ] MCP/network/environment dependency와 Codex/Claude compatibility warning이 표시된다.

## Backup And Audit

- [ ] backup snapshot 목록을 확인한다.
- [ ] backup promote는 source conflict를 overwrite하지 않는다.
- [ ] backup delete는 promoted source와 target을 삭제하지 않는다.
- [ ] transfer audit trail에는 operation type, status, diagnostic code가 기록된다.
- [ ] audit/log output에는 full path, secret, skill body가 포함되지 않는다.

## Watcher And Refresh

- [ ] Main Repository file change 후 debounced refresh가 한 번만 실행된다.
- [ ] source `SKILL.md` 변경 후 analysis stale 상태가 표시된다.
- [ ] Runtime recomposition 후 old watcher가 중복 등록되지 않는다.

## Documentation

- [ ] README는 setup, import/install, apply/remove, backup/move/promote, sync, troubleshooting을 포함한다.
- [ ] manifest command list와 README command list가 일치한다.
- [ ] release gate failure code가 `TestsFailed`, `ArchitectureFailed`, `ManifestFailed`, `PackageFailed`, `DocsFailed` 중 하나로 표시된다.
