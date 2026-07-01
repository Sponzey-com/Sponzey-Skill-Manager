# Task 021. GitHub Tag VSIX Release Automation

## 1. Summary

- [x] GitHub tag push를 기준으로 VSIX binary를 빌드한다.
- [x] Release tag는 `package.json` version과 `v` prefix 기준으로 일치할 때 GitHub Release asset으로 등록한다.
- [x] Build-only tag는 release tag 뒤에 `a` suffix가 붙은 형식으로 빌드만 수행하고 GitHub Release 등록을 건너뛴다.
- [x] Product runtime을 변경하지 않고 GitHub Actions, packaging ignore, release documentation, static workflow tests만 추가한다.

## 2. Scope

### Included

- [x] `.github/workflows/release-vsix.yml` workflow를 추가한다.
- [x] Workflow는 `v*` tag push에서 실행된다.
- [x] Workflow는 `GITHUB_REF_NAME`과 `package.json` version을 비교한다.
- [x] Workflow는 GitHub runner에서 local `@vscode/vsce`를 설치하고 `npm run package:vsix-candidate`를 실행한다.
- [x] Workflow는 모든 유효 tag에서 `.vsix`를 workflow artifact로 업로드한다.
- [x] Workflow는 release tag에서만 GitHub Release asset을 생성하거나 갱신한다.
- [x] `.vscodeignore`를 추가해 VSIX에 release/dev/test 문서와 scripts가 들어가지 않게 한다.
- [x] README와 release smoke checklist에 tag release 흐름을 문서화한다.
- [x] Static workflow test를 추가한다.

### Excluded

- [x] VSCode Marketplace publish를 추가하지 않는다.
- [x] Product runtime, Domain, Application, Infrastructure, Presentation 코드를 변경하지 않는다.
- [x] Local release gate가 network install을 수행하도록 변경하지 않는다.
- [x] Package dependency나 lockfile을 변경하지 않는다.

## 3. Related Plan Items

- [x] `.tasks/plan.md` section 7.004.8 Release Candidate Packaging And Smoke Evidence.
- [x] `.tasks/plan.md` section 7.0.2 Phase Exit Gates.
- [x] `.tasks/plan.md` section 13 Definition Of Done.
- [x] `AGENTS.md` section 4 Configuration Policy.
- [x] `AGENTS.md` section 8 TDD Policy.
- [x] `AGENTS.md` section 9 Tidy First Policy.

## 4. Dependencies

### Previous Tasks

- [x] Task 020. Local VSIX Candidate Packaging Check.

### Next Tasks

- [x] Extension Development Host manual smoke evidence capture.

## 5. Architecture Notes

- [x] Release automation is isolated in `.github/workflows`.
- [x] `.vscodeignore` changes package content only and does not alter extension runtime behavior.
- [x] GitHub workflow uses repository-scoped `GITHUB_TOKEN` with `contents: write` to create or update release assets.
- [x] Workflow uses local runner-installed `node_modules/.bin/vsce` through existing `npm run package:vsix-candidate`.

## 6. Functional Requirements

- [x] Pushing tag `v<package.json version>` starts `Release VSIX` and enables GitHub Release registration.
- [x] Pushing tag `v<package.json version>a` starts `Release VSIX` in build-only mode.
- [x] A mismatched tag fails before dependency install and packaging.
- [x] Workflow runs `npm run release:gate` before packaging.
- [x] Workflow creates a `.vsix` under `.dist/`.
- [x] Workflow uploads `.vsix` as GitHub Actions artifact.
- [x] Workflow creates a GitHub Release when one does not exist for release tags.
- [x] Workflow uploads or replaces the `.vsix` asset when the release exists for release tags.
- [x] Workflow skips GitHub Release creation and upload for build-only tags.

## 7. Non-Functional Requirements

- [x] No new product settings are added.
- [x] Product runtime does not read GitHub Actions environment values.
- [x] Local release gate remains deterministic and network-free for VSIX tool absence.
- [x] Release registration uses GitHub-provided token and does not require hardcoded secrets.
- [x] VSIX package excludes tests, tasks, GitHub workflows, local dist output, and repository process docs.

## 8. Implementation Steps

- [x] Write failing static test for GitHub release workflow.
- [x] Write failing README release signal test.
- [x] Add `.github/workflows/release-vsix.yml`.
- [x] Add `.vscodeignore`.
- [x] Update README with tag release and build-only tag instructions.
- [x] Update Korean release smoke checklist with GitHub tag release verification.
- [x] Run focused tests and release gate.

## 9. TDD Checklist

- [x] Workflow test failed before workflow file existed.
- [x] README test failed before tag release instructions existed.
- [x] Release smoke checklist test failed before tag release signal existed.
- [x] Tests verify tag trigger, version validation, VSIX packaging, artifact upload, release registration, and build-only registration skip markers.

## 10. Validation Checklist

- [x] Workflow exists at `.github/workflows/release-vsix.yml`.
- [x] Workflow requires `v*` tag.
- [x] Workflow validates release tag and build-only tag against `package.json` version.
- [x] Workflow installs `@vscode/vsce` only inside GitHub runner.
- [x] Workflow runs `npm run release:gate`.
- [x] Workflow runs `npm run package:vsix-candidate`.
- [x] Workflow uses `gh release create` and `gh release upload --clobber`.
- [x] Workflow guards GitHub Release registration with `steps.tag_policy.outputs.register_release == 'true'`.
- [x] `.vscodeignore` excludes non-runtime files.

## 11. Logging Requirements

### Product Log

- [x] Do not add Product Log events.

### Field Debug Log

- [x] Do not add Field Debug Log.

### Development Log

- [x] GitHub Actions stdout is the release automation log.
- [x] Do not print secrets or token values.

## 12. State Machine Requirements

- [x] Product state machine is not needed.
- [x] Workflow state is explicit through ordered steps:
  - [x] Checkout tag source
  - [x] Set up Node
  - [x] Classify release tag
  - [x] Install project dependencies
  - [x] Install local VSIX packaging tool
  - [x] Run release gate
  - [x] Package VSIX candidate
  - [x] Resolve VSIX artifact path
  - [x] Upload workflow artifact
  - [x] Register VSIX in GitHub Release only when tag policy enables registration

## 13. Done Criteria

- [x] All implementation checklist items are complete.
- [x] Focused workflow/documentation tests pass.
- [x] `npm run release:gate` passes.
- [x] Remaining release condition is an actual GitHub tag push in the repository.

## 14. Completion Report

- [x] Added tag-driven `Release VSIX` GitHub Actions workflow.
- [x] Added `.vscodeignore` to keep VSIX artifacts focused on runtime files.
- [x] Added `test/scripts/github-release-workflow.test.mjs`.
- [x] Updated README with release tag and build-only tag `git tag` and `git push origin` instructions.
- [x] Updated Korean release smoke checklist with GitHub Release registration and build-only criteria.
- [x] Focused verification passed: 7 tests.
- [x] Release verification passed: `npm run release:gate` with 344 passing tests and packaging skip locally as `PackagingToolMissing`.
- [x] To trigger GitHub Release registration, push a tag matching the manifest version, for example `v0.1.0` for current `package.json`.
- [x] To trigger build-only artifact creation, push the same version with `a` suffix, for example `v0.1.0a` for current `package.json`.
