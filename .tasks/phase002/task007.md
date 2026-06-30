# Task 007. Open Commands And Opener Port

## 1. Summary

- [x] 목적: source folder, target folder, `SKILL.md`를 tree item과 command palette에서 열 수 있는 open command와 opener port를 구현한다.
- [x] 해결 문제: 사용자가 skill 파일과 적용 위치를 직접 확인하려면 Presentation이 path를 직접 다루기 쉬운데, 이를 port 기반 use case로 분리한다.
- [x] 완료 상태: open commands는 explicit payload와 RuntimeContext만 사용하고, Infrastructure opener adapter가 실제 VSCode open 동작을 수행한다.

## 2. Scope

### Included

- [x] `OpenSkillSourceFolder`, `OpenSkillTargetFolder`, `OpenSkillMd` command
- [x] opener port와 VSCode opener adapter
- [x] tree context menu와 command descriptor wiring

### Excluded

- [x] custom detail webview
- [x] file edit/save 기능
- [x] analyzer rule 확장

## 3. Related Plan Items

- [x] `.tasks/plan.md` Phase 004 open source folder, open target folder, open `SKILL.md`
- [x] `.tasks/plan.md` 12.1 Boundary Matrix open/detail row
- [x] `AGENTS.md` 2. Architecture Rules, 3. Dependency Direction

## 4. Dependencies

### Previous Tasks

- [x] Task 006. Sync Read Model And Tree Mapping

### Next Tasks

- [x] Task 008. Skill Detail And Diagnostics Grouping
- [x] Task 009. Copy Update With Sync Guard

## 5. Architecture Notes

- [x] 변경 계층: Application open use case, Infrastructure opener adapter, Presentation command registry/input collection/tree context
- [x] 의존 방향: Presentation -> Application opener use case -> opener port, Infrastructure implements port.
- [x] 도메인 책임: source/applied identity와 path value validation만 담당한다.
- [x] 유스케이스 책임: source/applied payload를 validated open target DTO로 변환한다.
- [x] 인프라 책임: VSCode env/openExternal 또는 workspace open API wrapper를 구현한다.
- [x] 외부 시스템 접근 위치: 실제 파일/folder open은 Infrastructure opener adapter에서만 수행한다.

## 6. Functional Requirements

- [x] source tree item에서 `Open SKILL.md`는 source skill md path를 opener port에 전달한다.
- [x] source tree item에서 `Open Source Folder`는 source folder path를 opener port에 전달한다.
- [x] applied tree item에서 `Open Target Folder`는 target path를 opener port에 전달한다.

## 7. Non-Functional Requirements

- [x] 설정 관리: open command는 settings를 재조회하지 않고 RuntimeContext와 explicit item payload만 사용한다.
- [x] 로그 요구사항: open 성공은 Product Log를 남기지 않고 open 실패만 Product Log failure 후보로 반환한다.
- [x] 오류 처리: missing source, missing target, missing `SKILL.md`, opener failure를 구분한다.
- [x] 테스트 가능성: opener port는 fake로 대체하고 Presentation command wiring은 fake command API로 검증한다.
- [x] 유지보수성: path open logic을 UI handler에 넣지 않는다.

## 8. Implementation Steps

- [x] source tree item open `SKILL.md` command가 opener port를 호출하는 실패 테스트를 작성한다.
- [x] applied tree item open target folder command 실패 테스트를 작성한다.
- [x] missing path diagnostic 테스트를 작성한다.
- [x] opener port와 use case output DTO를 구현한다.
- [x] VSCode opener adapter를 Infrastructure에 추가한다.
- [x] command descriptor, package manifest menu contribution, tree contextValue를 연결한다.
- [x] `npm test`, `npm run build`, manifest check를 실행한다.

## 9. TDD Checklist

- [x] 실패하는 command handler test를 먼저 작성한다.
- [x] open use case test를 작성한다.
- [x] opener adapter는 fake VSCode API 또는 wrapper로 테스트한다.
- [x] RuntimeContext와 item payload 전달 방식을 테스트한다.
- [x] open failure Product Log 후보가 full path를 노출하지 않는지 검증한다.
- [x] missing source/target/skill md 오류 케이스를 테스트한다.
- [x] command descriptor 정리는 Tidy First로 분리한다.

## 10. Validation Checklist

- [x] source folder, target folder, SKILL.md open command가 동작한다.
- [x] Presentation이 filesystem adapter나 VSCode opener를 직접 호출하지 않는다.
- [x] Domain 계층은 VSCode API에 의존하지 않는다.
- [x] settings/env가 command 중간에 재조회되지 않는다.
- [x] path는 RuntimeContext와 explicit tree item payload에서 전달된다.
- [x] open failure 로그는 Product Log 기준을 따른다.
- [x] opener port를 fake로 대체할 수 있다.
- [x] 상태머신은 필요하지 않고 missing/failure result code로 충분하다.
- [x] 기능 변경과 manifest contribution 정리가 리뷰 가능하게 분리된다.

## 11. Logging Requirements

### Product Log

- [x] open 성공은 Product Log를 기록하지 않는다.
- [x] open 실패는 `skill.open.failed` 또는 existing failure event 후보로 error code와 masked item id만 기록한다.

### Field Debug Log

- [x] opener adapter failure detail은 Field Debug Log 후보로 masked path classification만 기록한다.
- [x] Field Debug Log는 기본 비활성이다.

### Development Log

- [x] fake opener call arguments는 테스트에서만 Development Log로 확인한다.
- [x] Development Log는 production default에 포함하지 않는다.

## 12. State Machine Requirements

- [x] 상태머신 필요: 불필요하다. validation 후 open port 호출 1단계 흐름이다.
- [x] 상태 목록: `ValidatingPayload`, `OpeningTarget`, `Completed`
- [x] 이벤트 목록: `OpenRequested`, `PayloadValidated`, `OpenSucceeded`, `OpenFailed`
- [x] 전이 조건: payload validation 성공 시에만 opener port를 호출한다.
- [x] 실패 상태: `InvalidPayload`, `PathMissing`, `OpenFailed`
- [x] 종료 상태: `Completed`
- [x] 간단 step result를 테스트한다.

## 13. Done Criteria

- [x] 모든 구현 체크박스가 완료되었다.
- [x] `npm test`와 `npm run build`가 통과한다.
- [x] package manifest와 command descriptor가 일치한다.
- [x] `AGENTS.md` 원칙과 충돌하지 않는다.
- [x] Task 008이 opener command와 별개로 detail DTO를 확장할 수 있다.
