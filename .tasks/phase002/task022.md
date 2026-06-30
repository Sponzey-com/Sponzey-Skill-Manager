# Task 022. Release Gate Packaging And Documentation

## 1. Summary

- [x] 목적: Post-MVP 기능을 반복 검증하고 배포 준비 상태를 확인하는 release gate, packaging readiness, README/troubleshooting/manual smoke 문서를 완성한다.
- [x] 해결 문제: 기능이 구현되어도 tests/build/manifest/docs/smoke 기준이 묶이지 않으면 Extension Host와 VSIX 배포 전 회귀를 놓칠 수 있다.
- [x] 완료 상태: release gate script가 필수 검증을 실행하고, README와 smoke checklist가 실제 command/manifest와 drift되지 않는다.

## 2. Scope

### Included

- [x] release gate script and tests
- [x] manifest/package completeness checks
- [x] README, troubleshooting, Extension Host manual smoke checklist

### Excluded

- [x] product feature implementation
- [x] marketplace publishing automation
- [x] external telemetry or remote crash reporting

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 012 Release Hardening, Packaging, And Documentation
- [x] `.tasks/plan.md` 7.1 Release gate
- [x] `.tasks/plan.md` 15. Definition Of Done
- [x] `AGENTS.md` 10. Code Review Checklist, 12. Required Agent Behavior

## 4. Dependencies

### Previous Tasks

- [x] Task 001 through Task 021

### Next Tasks

- [x] None

## 5. Architecture Notes

- [x] 변경 계층: Scripts, documentation, manifest validation tests
- [x] 의존 방향: scripts/docs는 product runtime source에 policy를 주입하지 않는다.
- [x] 도메인 책임: 없음. release gate는 개발 절차 검증이다.
- [x] 유스케이스 책임: 없음. product behavior drift는 tests와 manifest/docs checks로 검증한다.
- [x] 인프라 책임: script execution, packaging command, manifest check
- [x] 외부 시스템 접근 위치: VSCode `code` command 또는 packaging tool은 script boundary에서만 사용하고 product runtime에서 호출하지 않는다.

## 6. Functional Requirements

- [x] release gate는 `npm test`, `npm run build`, architecture guard, manifest check, smoke checklist presence를 실행한다.
- [x] manifest completeness check는 icon, commands, views, menus, engines, activation/main entry를 검증한다.
- [x] README와 manual smoke checklist는 setup, import/install, apply/remove, backup/move/promote, sync, watcher, troubleshooting을 포함한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: release scripts는 user settings를 읽지 않고 explicit command arguments와 project files만 사용한다.
- [x] 로그 요구사항: release script output은 Development Log로 분류하고 failure code를 machine-readable하게 출력한다.
- [x] 오류 처리: tests, architecture, manifest, package, docs failure를 구분한다.
- [x] 테스트 가능성: release gate script는 fake command runner 또는 dry-run mode로 검증한다.
- [x] 유지보수성: README command list와 package command contribution drift를 테스트로 막는다.

## 8. Implementation Steps

- [x] release gate가 required commands를 순서대로 실행한다는 실패 테스트를 작성한다.
- [x] manifest completeness rule 실패 테스트를 작성한다.
- [x] README command list가 package command contribution과 일치하는 실패 테스트를 작성한다.
- [x] release gate script를 구현하고 failure codes를 정의한다.
- [x] README usage guide와 troubleshooting guide를 작성한다.
- [x] `.tasks/release-smoke.md` 또는 `docs/`에 Extension Host manual smoke checklist를 작성한다.
- [x] `npm test`, `npm run build`, release gate를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 release gate script test를 먼저 작성한다.
- [x] manifest completeness test를 작성한다.
- [x] README/package drift test를 작성한다.
- [x] external command runner는 fake로 대체한다.
- [x] script는 user settings/env mutation을 하지 않는지 테스트 또는 리뷰로 확인한다.
- [x] tests/build/architecture/manifest/docs/package failure code 케이스를 테스트한다.
- [x] documentation wording 정리는 feature behavior 변경과 분리한다.

## 10. Validation Checklist

- [x] release gate가 필수 검증을 순서대로 실행한다.
- [x] packaging metadata와 manifest contribution이 일치한다.
- [x] Domain/Application/Infrastructure/Presentation runtime code에 release script dependency가 없다.
- [x] release scripts는 런타임 중 환경 설정을 삽입하거나 변경하지 않는다.
- [x] explicit arguments와 project files만 사용한다.
- [x] script output은 Development Log로 분류된다.
- [x] fake command runner로 외부 의존성을 대체할 수 있다.
- [x] release gate state와 failure state가 명시적으로 테스트된다.
- [x] 기능 변경과 문서/스크립트 변경이 분리된다.

## 11. Logging Requirements

### Product Log

- [x] release gate output은 Product Log가 아니다.
- [x] product runtime logger에 release script 결과를 연결하지 않는다.

### Field Debug Log

- [x] release gate output은 Field Debug Log가 아니다.
- [x] packaging troubleshooting detail은 문서와 Development Log로만 다룬다.

### Development Log

- [x] release script output, smoke checklist result, packaging failure code는 Development Log로 분류한다.
- [x] Development Log는 production extension default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: release gate script에는 명시 state contract가 필요하다.
- [x] 상태 목록: `CheckingTests`, `CheckingArchitecture`, `CheckingManifest`, `CheckingPackage`, `CheckingDocs`, `Completed`
- [x] 이벤트 목록: `TestsPassed`, `ArchitecturePassed`, `ManifestPassed`, `PackagePassed`, `DocsPassed`, `FailureDetected`
- [x] 전이 조건: 각 check가 성공해야 다음 check로 이동한다.
- [x] 실패 상태: `TestsFailed`, `ArchitectureFailed`, `ManifestFailed`, `PackageFailed`, `DocsFailed`
- [x] 종료 상태: `Completed`
- [x] release gate state는 script test 또는 dry-run test로 검증한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`, `npm run build`, release gate가 통과한다.
- [x] README, troubleshooting, manual smoke checklist가 현재 product behavior와 일치한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Post-MVP Definition of Done 전체를 검증할 수 있는 문서와 script가 준비되었다.