# Sponzey Skills Manager

Sponzey Skills Manager is a VSCode extension for managing Agent Skills as explicit sources and applied targets.

## Core Concepts

- Main Repository stores source skills only.
- Main Repository is a source repository, not a Global Target.
- Global Targets and Project Targets are where agent clients read applied skills.
- Repository registration supports Codex, Claude, or all supported agent clients.
- Applied Global and Project skill rows show an agent badge icon for Codex or Claude.
- Project Skills are shown when VSCode has a folder or workspace open, and hidden for file-only windows.
- Applied skills can be managed copies, managed symlinks, external folders, external symlinks, or broken symlinks.
- Remove means removing an applied target entry.
- Delete means deleting a source skill from the Main Repository.
- Backup snapshots preserve target state without mutating the target.

## Setup

1. Run the extension in Extension Development Host.
2. If no Main Repository is configured, the extension creates and uses `~/SponzeySkills`.
3. The extension initializes `skills/`, `backups/`, and `.sponzey/`.
4. Run `Sponzey Skills: Set Main Repository` only when you want to choose a different directory.
5. Do not select an agent global target such as `~/.agents/skills` or `~/.claude/skills`.

## Import And Install

- Use `Sponzey Skills: Create Skill` to create a new source skill.
- Use `Sponzey Skills: Import Skill to Main Repository` to copy a local skill folder into the Main Repository.
- Use `Sponzey Skills: Install Skill from URL or Path` to resolve a GitHub URL or local path and install it into the Main Repository.
- Use `Sponzey Skills: Import Skill Archive` to import a Sponzey skill archive bundle.

## Apply And Remove

- Use `Sponzey Skills: Apply Skill to Global Target` to apply a source skill to a global target.
- If no global target is configured, the extension registers `~/.agents/skills` as the default Codex global target before applying.
- Use `Sponzey Skills: Apply Skill to Project Target` to apply a source skill to a workspace project target.
- Applied Global and Project skill rows show a Codex or Claude badge and avoid grouping skills under repository folder nodes.
- Use `Sponzey Skills: Remove Applied Skill` to remove the applied target entry without deleting the source.

## Backup, Copy, Move, And Promote

- Use `Sponzey Skills: Copy Applied Skill to Main Repository` to copy an applied target skill as a source candidate.
- Use `Sponzey Skills: Backup Applied Skill to Main Repository` to snapshot the target without mutating it.
- Use `Sponzey Skills: Move Applied Skill to Main Repository` when explicitly moving management back to the Main Repository.
- Use `Sponzey Skills: Promote Backup to Skill Source` to create a source from a backup snapshot.

## Sync And Analysis

- The tree read model distinguishes managed copy, managed symlink, external, and broken symlink states.
- Sync status can classify copy drift as `In Sync`, `Source Changed`, `Target Changed`, `Both Changed`, `Missing Source`, `Missing Target`, `External`, or `Broken Symlink`.
- Analyzer diagnostics are grouped by structure, quality, security, dependency, compatibility, and sync categories.
- Critical risk blocks target writes before filesystem mutation.

## Troubleshooting

- If `code` is not available, install the VSCode shell command or run scripts with `CODE_BIN=/path/to/code`.
- If the Main Repository is missing, the extension recreates `~/SponzeySkills` on the next command that needs a source repository.
- If no global target is configured, applying to a global target registers `~/.agents/skills` automatically.
- If a newly applied Codex global skill does not appear in another Codex instance, restart Codex or start a new Codex session so it rescans `$HOME/.agents/skills`.
- If a newly applied Claude global skill does not appear in another Claude session, restart Claude or start a new Claude session so it rescans `$HOME/.claude/skills`.
- If the Main Repository is invalid, run `Sponzey Skills: Set Main Repository` and choose a valid source repository path.
- If a target path overlaps the Main Repository, choose a separate source repository path.
- If a filesystem permission error appears, choose a repository or target directory that the current OS user can read and write, then run `Sponzey Skills: Refresh Skills`.
- If watcher refresh is unavailable or blocked by the host environment, use `Sponzey Skills: Refresh Skills` manually.
- If Diagnostics shows warnings or errors, open the diagnostic detail and review severity, category, recommendation, and source or target context before applying or deleting skills.
- If a copy update is blocked, inspect sync status and provide explicit confirmation only when overwriting local target changes is intended.
- Product Log contains minimal user-impacting operation results. Field Debug Log is for limited local troubleshooting and should not contain skill bodies or secrets.

## Development

Run:

```sh
npm test
npm run build
npm run check:vsix-candidate
npm run release:gate
```

`npm run check:vsix-candidate` checks for a local `node_modules/.bin/vsce` packaging tool without installing anything. `PackagingToolMissing` means local VSIX packaging is skipped until `@vscode/vsce` is available as a dev dependency.

Use:

```sh
npm run package:vsix-candidate
```

to create a local `.vsix` candidate in `.dist/` when the local packaging tool is already installed.

## GitHub Tag Release

The `Release VSIX` GitHub Actions workflow runs when a version tag is pushed. The tag base must match `package.json` version with a `v` prefix.

Use a release tag to build the VSIX and register it in GitHub Release. For version `0.1.0`, use:

```sh
git tag v0.1.0
git push origin v0.1.0
```

Use a build-only tag to build the VSIX without registering it in GitHub Release. For version `0.1.0`, use:

```sh
git tag v0.1.0a
git push origin v0.1.0a
```

The workflow installs a local `@vscode/vsce` packaging tool in the GitHub runner, runs `npm run release:gate`, runs `npm run package:vsix-candidate`, and uploads the `.vsix` as a workflow artifact. Tags like `v0.1.0` also register the `.vsix` in the matching GitHub Release. Tags like `v0.1.0a` are build-only and skip GitHub Release registration.

Use:

```sh
scripts/run-vscode-extension-host.sh
```

to open Extension Development Host.
