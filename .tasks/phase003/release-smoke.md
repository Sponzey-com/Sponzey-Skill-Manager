# Phase 003 Release Smoke Checklist

This checklist verifies that Sponzey Skills Manager is ready as a local release candidate in the VSCode Extension Development Host. Run it after automated tests pass.

## 1. Automated Verification

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run release:gate` passes.
- [ ] Command registry and `package.json` command contributions match.
- [ ] Extension manifest validation passes for commands, views, menus, configuration, and activity bar icon.
- [ ] Extension manifest validation checks package metadata including `displayName`, `categories`, `keywords`, and `extensionKind`.
- [ ] Architecture guard confirms Domain, Application, Infrastructure, and Presentation dependency direction.

## 2. Extension Development Host

- [ ] `scripts/run-vscode-extension-host.sh` opens a VSCode Extension Development Host.
- [ ] If the `code` shell command is unavailable, the script explains how to install it or set `CODE_BIN`.
- [ ] Activity Bar shows the Sponzey Skills icon.
- [ ] Main Repository, Global Skills, and Diagnostics views are visible.
- [ ] Project Skills view is visible when a workspace folder is open.
- [ ] Project Skills view is hidden in file-only VSCode windows.

## 3. Repository Setup

- [ ] With no configured repository path, the extension creates and uses the default Main Repository at `~/SponzeySkills`.
- [ ] Main Repository initialization creates `skills/`, `backups/`, and `.sponzey/`.
- [ ] Main Repository is shown as a source repository only, not as a Global Target.
- [ ] Choosing an agent target path such as `~/.agents/skills` or `~/.claude/skills` as Main Repository is blocked or warned.
- [ ] Main Repository refresh does not show a filesystem operation failed notification for a valid repository.
- [ ] Add and remove repository toolbar actions are visible where expected.

## 4. Main Repository Skill Lifecycle

- [ ] Create a source skill in the Main Repository.
- [ ] Import a local skill folder into the Main Repository.
- [ ] Git URL or local path install adds a source skill to the Main Repository.
- [ ] Import Skill Archive adds a source skill or backup bundle using the archive command.
- [ ] Open Source Folder opens the source folder.
- [ ] Open SKILL.md opens the file in a new tab in the current VSCode window.
- [ ] Delete Source Skill is clearly different from Remove Applied Skill.

## 5. Global And Project Apply

- [ ] Apply to Global Target lets the user choose Codex, Claude, or all supported clients.
- [ ] Apply to Project Target lets the user choose Codex, Claude, or all supported clients when a workspace folder is open.
- [ ] Global Skills rows show a Codex badge or Claude badge on the applied skill row instead of grouping by target folder.
- [ ] Project Skills rows show a Codex badge or Claude badge on the applied skill row instead of grouping by target folder.
- [ ] Managed copy, managed symlink, external folder, external symlink, and broken symlink states remain distinguishable.
- [ ] Remove Applied Skill removes only the target entry and does not delete the source skill.
- [ ] source delete and applied remove remain separate commands, prompts, and command paths.

## 6. Diagnostics And Analysis

- [ ] Analyze All Skills shows a summary notification with total diagnostics and highest severity.
- [ ] Analyze All Skills updates the Diagnostics view.
- [ ] Diagnostics view shows the diagnostic code, severity, category, and source or target context when available.
- [ ] Diagnostics explain external dependencies, security risks, compatibility warnings, malformed structure, and sync issues.
- [ ] Diagnostics do not expose full `SKILL.md` body, secrets, or raw matched secret-like values.
- [ ] Diagnostic detail or Open SKILL.md opens in the current VSCode window.
- [ ] A changed source skill can be identified as stale analysis after watcher refresh.

## 7. Backup Transfer And Safety

- [ ] Copy Applied Skill to Main Repository copies the target state while keeping the target unchanged.
- [ ] Backup Applied Skill to Main Repository creates a snapshot while keeping the target unchanged.
- [ ] Move Applied Skill to Main Repository requires explicit confirmation before target cleanup or managed conversion.
- [ ] Promote Backup to Skill Source does not overwrite an existing source without explicit confirmation.
- [ ] Delete Backup does not delete promoted source skills or target entries.
- [ ] High risk actions require explicit confirmation.
- [ ] Critical risk apply is blocked before target filesystem writes.
- [ ] Audit records include operation type, status, diagnostic code, and masked references only.

## 8. Watcher Refresh And Runtime Recomposition

- [ ] Manual refresh preserves source, applied, backup, and Diagnostics read models.
- [ ] watcher refresh after Main Repository file changes runs through the refresh use case and does not mutate tree arrays directly.
- [ ] watcher refresh preserves Diagnostics and stale analysis state.
- [ ] Runtime recomposition reads settings and workspace roots once, builds a new RuntimeContext, and disposes old watchers.
- [ ] Duplicate watcher registration does not occur after settings or workspace recomposition.
- [ ] Field Debug details are disabled by default and do not appear in Product Log output.

## 9. Documentation And Release Gate

- [ ] README covers setup, import/install, apply/remove, backup/copy/move/promote, sync, diagnostics, and troubleshooting.
- [ ] README explains what to do when `code` is unavailable.
- [ ] README explains how Codex or Claude sessions can rescan global skills after applying them.
- [ ] README does not describe Main Repository as an active Global Target.
- [ ] `npm run release:gate` checks tests, architecture, manifest, build, and this smoke checklist.
- [ ] Release gate failure codes remain machine-readable.
