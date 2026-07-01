# Phase 004 Release Smoke Checklist

This checklist verifies that Sponzey Skills Manager is ready as a local Phase 004 release candidate in the VSCode Extension Development Host. Run it after automated tests pass.

## 1. Automated Verification

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run release:gate` passes.
- [ ] Command registry and `package.json` command contributions match.
- [ ] Extension manifest validation passes for commands, views, menus, configuration, and activity bar icon.
- [ ] Extension manifest validation checks package metadata including `displayName`, `categories`, `keywords`, and `extensionKind`.
- [ ] Architecture guard confirms Domain, Application, Infrastructure, Presentation, and Scripts dependency direction.

## 2. Extension Development Host

- [ ] `scripts/run-vscode-extension-host.sh` opens a VSCode Extension Development Host.
- [ ] If the `code` shell command is unavailable, the script explains how to install it or set `CODE_BIN`.
- [ ] Activity Bar shows the Sponzey Skills icon.
- [ ] Main Repository, Global Skills, and Diagnostics views are visible.
- [ ] Project Skills view is visible when a workspace folder is open.
- [ ] Project Skills view is hidden in file-only VSCode windows.
- [ ] Open SKILL.md opens the file in a new tab in the current VSCode window.

## 3. Repository Setup

- [ ] With no configured repository path, the extension creates and uses the default Main Repository at `~/SponzeySkills`.
- [ ] Main Repository initialization creates `skills/`, `backups/`, and `.sponzey/`.
- [ ] Main Repository is shown as a source repository only, not as a Global Target.
- [ ] Choosing an agent target path such as `~/.agents/skills` or `~/.claude/skills` as Main Repository is blocked or warned.
- [ ] Main Repository refresh does not show a filesystem operation failed notification for a valid repository.
- [ ] Add and remove repository toolbar actions are visible where expected.

## 4. Repository Index And Versioning

- [ ] Repository Index V2 assigns or preserves a stable `sourceId` for source skills.
- [ ] Repository index metadata stores source hash, origin, schema version, and index status.
- [ ] Unsupported index metadata schema appears as a diagnostic instead of breaking refresh.
- [ ] Local Git versioning shows unavailable or non-Git status without blocking Main Repository flows.
- [ ] Local Git snapshot creation requires explicit confirmation before any commit operation.

## 5. Main Repository Skill Lifecycle

- [ ] Create a source skill in the Main Repository.
- [ ] Import a local skill folder into the Main Repository.
- [ ] Git URL or local path install adds a source skill to the Main Repository.
- [ ] Import Skill Archive adds a source skill or backup bundle using the archive command.
- [ ] Open Source Folder opens the source folder.
- [ ] Delete Source Skill is clearly different from Remove Applied Skill.

## 6. Global And Project Apply

- [ ] Apply to Global Target lets the user choose Codex, Claude, or all supported clients.
- [ ] Apply to Project Target lets the user choose Codex, Claude, or all supported clients when a workspace folder is open.
- [ ] Global Skills rows show a Codex badge or Claude badge on the applied skill row instead of grouping by target folder.
- [ ] Project Skills rows show a Codex badge or Claude badge on the applied skill row instead of grouping by target folder.
- [ ] Target Profile logic drives apply, scan, diagnostics, badge, and compatibility decisions consistently.
- [ ] Managed copy, managed symlink, external folder, external symlink, and broken symlink states remain distinguishable.
- [ ] Remove Applied Skill removes only the target entry and does not delete the source skill.
- [ ] source delete and applied remove remain separate commands, prompts, and command paths.

## 7. Diagnostics And Analysis

- [ ] Analyze All Skills shows a summary notification with total diagnostics and highest severity.
- [ ] Analyze All Skills updates the Diagnostics view.
- [ ] Diagnostics view shows the diagnostic code, severity, category, and source or target context when available.
- [ ] Built-In Analyzer Policy Pack reports policy code, recommendation, dependency category, and analyzer version.
- [ ] Diagnostics explain external dependencies, security risks, compatibility warnings, malformed structure, and sync issues.
- [ ] Diagnostics do not expose full `SKILL.md` body, secrets, or raw matched secret-like values.
- [ ] Diagnostic detail or Open SKILL.md opens in the current VSCode window.
- [ ] A changed source skill can be identified as stale analysis after watcher refresh.

## 8. Backup Transfer And Safety

- [ ] Copy Applied Skill to Main Repository copies the target state while keeping the target unchanged.
- [ ] Backup Applied Skill to Main Repository creates a snapshot while keeping the target unchanged.
- [ ] Backup Compare shows source/target differences without mutating source or target.
- [ ] Restore Backup to Target requires explicit confirmation before overwriting an existing target entry.
- [ ] Move Applied Skill to Main Repository requires explicit confirmation before target cleanup or managed conversion.
- [ ] Promote Backup to Skill Source does not overwrite an existing source without explicit confirmation.
- [ ] Delete Backup does not delete promoted source skills or target entries.
- [ ] High risk actions require explicit confirmation.
- [ ] Critical risk apply is blocked before target filesystem writes.
- [ ] Audit records include operation type, status, diagnostic code, and masked references only.

## 9. Diagnostics Remediation Workflow

- [ ] Diagnostic items expose only allowed remediation actions for their code, severity, and scope.
- [ ] Critical risk diagnostics do not expose an apply remediation action.
- [ ] Missing repository diagnostics can route to Set Main Repository.
- [ ] Backup diagnostics can route to Compare Backup or Restore Backup only through the backup lifecycle use cases.
- [ ] Remediation actions cannot bypass delete, restore, move, promote, or overwrite confirmation.
- [ ] Remediation action completion refreshes Diagnostics without discarding persisted analysis unexpectedly.

## 10. Watcher Refresh And Runtime Recomposition

- [ ] Manual refresh preserves source, applied, backup, repository index, and Diagnostics read models.
- [ ] watcher refresh after Main Repository file changes runs through the refresh use case and does not mutate tree arrays directly.
- [ ] watcher refresh preserves Diagnostics and stale analysis state.
- [ ] Runtime recomposition reads settings and workspace roots once, builds a new RuntimeContext, and disposes old watchers.
- [ ] Duplicate watcher registration does not occur after settings or workspace recomposition.
- [ ] Field Debug details are disabled by default and do not appear in Product Log output.

## 11. Documentation And Release Gate

- [ ] README covers setup, import/install, apply/remove, backup/copy/move/promote, sync, diagnostics, and troubleshooting.
- [ ] README explains what to do when `code` is unavailable.
- [ ] README explains how Codex or Claude sessions can rescan global skills after applying them.
- [ ] README does not describe Main Repository as an active Global Target.
- [ ] `npm run release:gate` checks tests, architecture, manifest, build, and this smoke checklist.
- [ ] Release gate failure codes remain machine-readable.
- [ ] VSIX publishing is not required for Phase 004 local release candidate readiness.