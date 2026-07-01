# Task 002. Repository Source Read Model Tidy First

## 1. Task Purpose

- [x] `refreshSkills`의 source read model 조립 코드를 작고 이름이 명확한 helper로 분리한다.
- [x] 이 태스크가 `.tasks/plan.md`의 Phase 004.2 "Repository Index V2 And Stable Source Identity" 전에 필요한 Tidy First 작업에 기여함을 기록한다.
- [x] 이 태스크 완료 후 Repository Index V2 task에서 `sourceId`, `sourceHash`, `origin`, `indexStatus`, `lastIndexedAt`을 추가할 위치가 명확해야 한다.

## 2. Current Context

- [x] Task 001에서 Phase 003 archive와 Phase 004 baseline integrity가 검증되었다.
- [x] 현재 `src/application/refresh/refresh-skills.js`는 source scan, source hash, analysis metadata, read model 조립을 한 함수 안에서 처리한다.
- [x] 이번 태스크를 시작해야 하는 이유: Repository Index V2 기능을 넣기 전에 기존 source read model 조립 책임을 분리해야 다음 기능 변경이 작고 테스트 가능해진다.
- [x] 현재 확인된 제약 사항: 사용자 visible behavior와 read model output을 변경하지 않는다.

## 3. Scope

### Included

- [x] `refreshSkills` 내부의 `mainRepositorySkills` mapping을 helper 함수로 분리한다.
- [x] source hash, risk level, persisted analysis metadata merge 책임을 helper 이름으로 명확히 한다.
- [x] 기존 focused refresh/tree tests로 output regression을 검증한다.

### Excluded

- [x] 새 repository index schema 또는 metadata store는 추가하지 않는다.
- [x] `sourceId`, `origin`, `indexStatus`, `lastIndexedAt` 새 필드는 추가하지 않는다.
- [x] Presentation tree label, command, manifest, release gate는 변경하지 않는다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] source read model base object 생성을 helper로 분리한다.
- [x] 입력: source scan item, normalized source path, optional source hash.
- [x] 출력: 기존과 동일한 source read model base object.
- [x] 성공 조건: `id`, `name`, `sourcePath`, `status`, `appliedTargets`, `sourceHash` output이 기존 테스트와 동일하다.
- [x] 실패 조건: source list order, field name, field value가 바뀐다.

### Functional Unit 2

- [x] persisted analysis metadata merge를 helper로 분리한다.
- [x] 입력: source base read model, source scan item, analysis metadata result.
- [x] 출력: 기존과 동일한 risk, analysis status, diagnostics, dependencies, compatibility fields.
- [x] 성공 조건: existing analysis metadata tests가 동일하게 통과한다.
- [x] 실패 조건: stale analysis, invalid metadata diagnostic, dependency/compatibility field가 사라진다.

### Functional Unit 3

- [x] next Repository Index V2 task를 위한 naming을 명확히 한다.
- [x] 입력: current source read model construction code.
- [x] 출력: source identity와 index metadata를 추가할 수 있는 helper boundary.
- [x] 성공 조건: behavior change 없이 helper 이름이 책임을 설명한다.
- [x] 실패 조건: helper가 filesystem, settings, logger, VSCode API에 의존한다.

## 5. Architecture Notes

- [x] 변경되는 계층은 Application 계층의 refresh use case 내부 구현이다.
- [x] Domain, Infrastructure, Presentation 책임은 변경하지 않는다.
- [x] 의존성 방향은 `Application -> Domain` 기존 방향을 유지한다.
- [x] 외부 시스템 접근은 추가하지 않는다. filesystem, VSCode, network 접근을 추가하지 않는다.
- [x] 새 포트와 어댑터를 정의하지 않는다.
- [x] 전역 상태, 숨겨진 I/O, 암묵적 설정 접근을 피한다.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 환경 값은 프로그램 시작 시 최초 1회만 수신한다는 기존 정책을 변경하지 않는다.
- [x] 최초 수신 이후 환경 값을 전역 상수처럼 사용하지 않는다.
- [x] 환경 값 전달 방식은 이번 태스크에서 변경하지 않는다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 금지한다.

## 7. Logging Requirements

### Product Log

- [x] Product Log를 추가하지 않는다.
- [x] 사용자 영향, 핵심 상태 변화, 장애 원인 추적에 필요한 새 이벤트는 없다.
- [x] 민감 정보와 과도한 내부 상태를 기록하지 않는다.

### Field Debug Log

- [x] Field Debug Log를 추가하지 않는다.
- [x] 활성화 조건 변경이 필요하지 않다.
- [x] 민감 정보 마스킹 기준을 변경하지 않는다.
- [x] 보존 범위와 사용 범위를 변경하지 않는다.

### Development Log

- [x] Development Log를 추가하지 않는다.
- [x] 프로덕션 기본 동작에 포함되는 개발 로그를 추가하지 않는다.
- [x] 테스트 완료 후 제거 또는 비활성화할 임시 로그를 만들지 않는다.

## 8. State Machine Requirements

- [x] 상태머신이 필요하지 않다고 판단한다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록은 필요하지 않다.
- [x] 이벤트 목록은 필요하지 않다.
- [x] 전이 조건은 필요하지 않다.
- [x] 실패 상태와 종료 상태는 기존 `refreshSkills` step output을 변경하지 않는다.
- [x] 상태 전이를 테스트 가능하게 만드는 새 작업은 이번 태스크 범위가 아니다.

## 9. TDD Plan

- [x] Tidy First 작업이므로 기존 regression tests를 먼저 실행한다.
- [x] 테스트 대상 유스케이스는 `refreshSkills`다.
- [x] 정상 케이스 테스트는 source list와 analysis metadata tests를 사용한다.
- [x] 실패 케이스 테스트는 invalid analysis metadata and source scan failure tests를 사용한다.
- [x] 경계값 테스트는 stale analysis metadata test를 사용한다.
- [x] 외부 의존성은 existing fake repository, fake target store, fake hash port, fake analysis store로 대체한다.
- [x] 설정 값 전달 방식 테스트는 변경하지 않는다.
- [x] 로그 정책 검증 테스트는 변경하지 않는다.
- [x] 상태 전이가 없으므로 상태 전이 테스트를 작성하지 않는다.
- [x] 테스트를 통과하는 최소 구현만 작성한다.
- [x] 테스트 통과 후 구조를 정리한다.

## 10. Implementation Checklist

- [x] refresh use case focused tests를 먼저 실행한다.
- [x] 실패가 없음을 baseline으로 확인한다.
- [x] source read model helper를 최소 구현으로 추출한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] 새 로그가 필요 없음을 확인한다.
- [x] 상태 관리가 필요 없음을 확인한다.
- [x] 중복과 구조 문제를 정리한다.
- [x] 모든 관련 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] Tidy First 작업이므로 새 제품 behavior를 추가하지 않았다.
- [x] 도메인 계층이 외부 프레임워크에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다는 기존 구조를 유지한다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 환경 값이 전역 상수처럼 사용되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 없으므로 상태머신이 필요하지 않다.
- [x] 리팩터링과 기능 변경이 분리되었다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항: `refreshSkills`의 Main Repository source read model 조립을 `mapSourceToMainRepositorySkill`, `createMainRepositorySkillReadModel`, `applySourceScanSummary`, `applyAnalysisSummary` helper로 분리했다. 출력 DTO는 변경하지 않았다.
- [x] 생성하거나 수정한 파일: `.tasks/task002.md`, `src/application/refresh/refresh-skills.js`.
- [x] 실행한 테스트 명령과 결과:
  - `node --test test/application/refresh-skills.test.mjs test/presentation/tree-view-model.test.mjs`: 19 tests pass.
  - `npm test`: 259 tests pass.
  - `npm run build`: architecture, manifest, build smoke pass.
- [x] 검증한 항목: source list output, persisted analysis metadata merge, stale analysis marker, invalid metadata diagnostic, tree mapping regression, architecture guard.
- [x] 남은 위험 요소: Repository Index V2 schema, stable `sourceId`, source origin, index status는 아직 구현되지 않았다.
- [x] 후속 태스크에서 이어받아야 할 내용: task003에서 repository index metadata store와 stable source identity를 실패 테스트부터 도입한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.
- [x] 최종 목표에는 아직 도달하지 않았다. 추가 태스크를 생성해야 한다.
- [x] 도달하지 못했다면 남은 목표를 정리한다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 `.tasks/task003.md`로 결정한다.
- [ ] 다음 태스크를 `task003.md`로 생성한다.
- [ ] 다음 태스크 생성을 완료한 뒤 즉시 실행을 시작한다.

## 14. Stop Conditions

다음 조건 중 하나라도 발생하면 루프를 멈추고 사용자에게 보고한다.

- [ ] `plan.md`의 최종 목표에 도달했다.
- [ ] 필수 요구사항이 불명확하여 더 이상 안전하게 진행할 수 없다.
- [ ] 외부 정보, 권한, 비밀값, 접근 권한이 없어 진행할 수 없다.
- [ ] `AGENTS.md` 원칙과 충돌하는 요구사항이 발견되었다.
- [ ] 테스트 또는 검증 환경이 없어 완료 여부를 판단할 수 없다.
- [ ] 코드베이스 구조가 계획과 크게 달라 태스크 재설계가 필요하다.
- [ ] 사용자 결정이 필요한 아키텍처 선택지가 발생했다.
