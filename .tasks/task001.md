# Task 001. Phase 004 Baseline Integrity

## 1. Task Purpose

- [x] Phase 003 산출물이 `.tasks/phase003/`에 보존되어 있는지 검증한다.
- [x] 이 태스크가 `.tasks/plan.md`의 Phase 004.1 "Phase 003 Archive And Baseline Integrity" 목표에 기여함을 기록한다.
- [x] 이 태스크 완료 후 Phase 004 개발을 시작할 수 있는 문서, release smoke checklist, release gate, test/build baseline이 확인된 상태여야 한다.

## 2. Current Context

- [x] 현재 코드베이스는 Phase 003 기능 구현 이후 Phase 004 계획을 루트 `.tasks/plan.md`에 둔 상태다.
- [x] 이전 Phase 003 task 문서와 release smoke 문서는 `.tasks/phase003/` 아래로 이동되어 있어야 한다.
- [x] 이번 태스크는 Repository Index V2 구현 전에 archive와 verification baseline을 먼저 고정해야 하므로 시작한다.
- [x] 현재 확인된 제약 사항: 이 태스크는 제품 runtime behavior를 변경하지 않는다. Extension Development Host manual smoke는 자동 실행하지 않고 smoke checklist 존재와 release gate 기준만 검증한다.

## 3. Scope

### Included

- [x] `.tasks/phase003/plan.md`, `.tasks/phase003/task001.md`부터 `.tasks/phase003/task022.md`, `.tasks/phase003/release-smoke.md` 존재를 확인한다.
- [x] 루트 `.tasks/plan.md`와 `.tasks/release-smoke.md`가 Phase 004 기준인지 확인한다.
- [x] `scripts/release-gate.mjs`와 release smoke checklist test가 Phase 004 marker와 product signal을 검증하는지 확인한다.

### Excluded

- [x] Repository Index V2 source identity 구현은 이번 태스크에서 다루지 않는다.
- [x] Git versioning, backup compare/restore, analyzer policy, diagnostics remediation 구현은 이번 태스크에서 다루지 않는다.
- [x] Extension Development Host 수동 smoke 실행은 후속 release candidate task에서 다룬다.

## 4. Functional Units

이번 태스크는 기능 2~3개 단위로만 구성한다.

### Functional Unit 1

- [x] Phase 003 archive integrity를 검증한다.
- [x] 입력: `.tasks/phase003/` 파일 목록.
- [x] 출력: archive 파일 존재 여부와 누락 항목 없음.
- [x] 성공 조건: `plan.md`, `release-smoke.md`, `task001.md`부터 `task022.md`까지 모두 존재한다.
- [x] 실패 조건: 하나라도 누락되면 Phase 004 진행을 중단하고 archive 복구가 필요하다.

### Functional Unit 2

- [x] Phase 004 release smoke checklist와 release gate marker 일치를 검증한다.
- [x] 입력: `.tasks/release-smoke.md`, `scripts/release-gate.mjs`, `test/scripts/release-smoke-checklist.test.mjs`.
- [x] 출력: Phase 004 section marker와 product signal이 테스트로 검증되는 상태.
- [x] 성공 조건: focused release checklist tests가 통과한다.
- [x] 실패 조건: release gate가 Phase 003 marker를 요구하거나 Phase 004 checklist 필수 section을 누락한다.

### Functional Unit 3

- [x] baseline verification command를 실행한다.
- [x] 입력: 현재 workspace source, test, scripts.
- [x] 출력: `npm test`, `npm run build`, `npm run release:gate` 결과.
- [x] 성공 조건: 세 명령이 모두 통과한다.
- [x] 실패 조건: 하나라도 실패하면 Completion Report에 실패 명령과 원인을 기록하고 다음 task 생성을 중단한다.

## 5. Architecture Notes

- [x] 변경되는 계층은 `.tasks` 문서와 release script/test verification 범위다.
- [x] 도메인, 유스케이스, 어댑터, 인프라 책임은 이번 태스크에서 변경하지 않는다.
- [x] 의존성 방향은 기존 architecture guard로 확인한다.
- [x] 외부 시스템 접근은 없다. 파일시스템 접근은 검증 명령과 테스트가 workspace 안에서만 수행한다.
- [x] 새 인터페이스, 포트, 어댑터를 정의하지 않는다.
- [x] 전역 상태, 숨겨진 I/O, 암묵적 설정 접근을 추가하지 않는다.

## 6. Configuration Rules

- [x] 외부 설정 파일 의존을 추가하지 않는다.
- [x] 환경 값은 프로그램 시작 시 최초 1회만 수신한다는 기존 RuntimeContext 정책을 변경하지 않는다.
- [x] 최초 수신 이후 환경 값을 전역 상수처럼 사용하는 코드를 추가하지 않는다.
- [x] 환경 값 전달 방식은 이번 태스크에서 변경하지 않는다.
- [x] 프로세스 중간에 환경 설정 값을 삽입하거나 변경하지 않는다.
- [x] 런타임 중간 재설정, 동적 환경 변경, 숨겨진 설정 조회를 추가하지 않는다.

## 7. Logging Requirements

### Product Log

- [x] 제품 runtime Product Log를 추가하지 않는다.
- [x] 사용자 영향, 핵심 상태 변화, 장애 원인 추적에 필요한 정보는 이번 태스크에서 새로 발생하지 않는다.
- [x] 민감 정보와 과도한 내부 상태를 기록하지 않는다.

### Field Debug Log

- [x] Field Debug Log가 필요하지 않다고 판단한다.
- [x] 활성화 조건을 새로 추가하지 않는다.
- [x] 민감 정보 마스킹 기준을 변경하지 않는다.
- [x] 보존 범위와 사용 범위를 변경하지 않는다.

### Development Log

- [x] 개발 및 테스트 중 확인할 로그는 test command output으로 제한한다.
- [x] 프로덕션 기본 동작에 포함되는 development log를 추가하지 않는다.
- [x] 테스트 완료 후 제거 또는 비활성화할 임시 로그를 만들지 않는다.

## 8. State Machine Requirements

- [x] 상태머신이 필요하지 않다고 판단한다.
- [x] 복잡한 내부 흐름을 암묵적 플래그 조합으로 관리하지 않는다.
- [x] 상태 목록은 필요하지 않다.
- [x] 이벤트 목록은 필요하지 않다.
- [x] 전이 조건은 필요하지 않다.
- [x] 실패 상태와 종료 상태는 검증 명령의 pass/fail로만 기록한다.
- [x] 상태 전이 테스트는 이번 태스크 범위가 아니다.

## 9. TDD Plan

- [x] 새 제품 behavior가 없으므로 새 실패 테스트를 추가하지 않는다.
- [x] 테스트 대상은 release gate와 release smoke checklist validation이다.
- [x] 정상 케이스는 기존 `test/scripts/release-gate.test.mjs`와 `test/scripts/release-smoke-checklist.test.mjs`로 검증한다.
- [x] 실패 케이스는 invalid smoke checklist test로 검증한다.
- [x] 경계값 테스트는 이번 태스크 범위가 아니다.
- [x] 외부 의존성은 release gate test의 fake `runCommand`, `checkFile`, `readTextFile`로 대체한다.
- [x] 설정 값 전달 방식 테스트는 이번 태스크에서 변경하지 않는다.
- [x] 로그 정책 검증 테스트는 이번 태스크에서 변경하지 않는다.
- [x] 상태 전이가 없으므로 상태 전이 테스트를 작성하지 않는다.
- [x] 테스트를 통과하는 최소 구현은 이미 존재하는 Phase 004 checklist와 release gate marker를 확인하는 것이다.
- [x] 테스트 통과 후 구조 정리는 필요하지 않다.

## 10. Implementation Checklist

- [x] 테스트 파일 상태를 먼저 확인한다.
- [x] focused release checklist tests를 실행한다.
- [x] 최소 구현 변경이 필요한지 판단한다.
- [x] 계층 간 의존성을 확인한다.
- [x] 외부 의존성이 경계 계층에만 있는지 확인한다.
- [x] 설정 값 전달 방식이 명시적인지 확인한다.
- [x] 새 로그가 필요 없음을 확인한다.
- [x] 상태 관리가 필요 없음을 확인한다.
- [x] 중복과 구조 문제를 확인한다.
- [x] 모든 테스트를 실행한다.

## 11. Validation Checklist

- [x] 기능 요구사항이 충족되었다.
- [x] 테스트가 모두 통과한다.
- [x] 새 제품 behavior가 없으므로 새 실패 테스트가 필요하지 않음을 기록했다.
- [x] 도메인 계층이 외부 프레임워크에 의존하지 않는다.
- [x] 유스케이스가 명시적 입력과 출력을 가진다는 기존 구조를 변경하지 않았다.
- [x] 외부 환경 값이 런타임 중간에 재조회되지 않는다.
- [x] 외부 환경 값이 전역 상수처럼 사용되지 않는다.
- [x] 로그가 Product Log, Field Debug Log, Development Log 기준에 맞게 분리되었다.
- [x] 개발용 로그가 프로덕션 기본 동작에 포함되지 않는다.
- [x] 복잡한 흐름이 없으므로 상태머신이 필요하지 않다.
- [x] 리팩터링과 기능 변경이 섞이지 않았다.

## 12. Completion Report

태스크 완료 후 다음 내용을 기록한다.

- [x] 수행한 변경 사항: Phase 004 루프형 작업의 시작 태스크로 이 문서를 생성했고, Phase 003 archive와 Phase 004 release smoke/release gate baseline을 검증했다.
- [x] 생성하거나 수정한 파일: `.tasks/task001.md`.
- [x] 실행한 테스트 명령과 결과:
  - `find .tasks/phase003 -maxdepth 1 -type f | sort`: `plan.md`, `release-smoke.md`, `task001.md`부터 `task022.md`까지 확인.
  - `node --test test/scripts/release-gate.test.mjs test/scripts/release-smoke-checklist.test.mjs`: 5 tests pass.
  - `npm test`: 259 tests pass.
  - `npm run build`: architecture, manifest, build smoke pass.
  - `npm run release:gate`: tests, architecture, manifest, build, docs, smoke pass.
- [x] 검증한 항목: Phase 003 archive integrity, Phase 004 release smoke checklist marker, release gate marker, full test/build/release gate baseline.
- [x] 남은 위험 요소: Extension Development Host manual smoke는 이번 태스크에서 실행하지 않았다. Phase 004 release candidate task에서 실제 VSCode host smoke evidence를 남겨야 한다.
- [x] 후속 태스크에서 이어받아야 할 내용: Repository Index V2 구현 전에 DTO/read model/schema naming을 Tidy First로 정리해야 한다.

## 13. Next Task Decision Hook

이 태스크 완료 후 반드시 다음 판단을 수행한다.

- [x] `plan.md`의 최종 목표에 도달했는지 확인한다.
- [x] 최종 목표에는 아직 도달하지 않았다. 추가 태스크를 생성해야 한다.
- [x] 도달하지 못했다면 남은 목표를 정리한다.
- [x] 남은 목표 중 가장 우선순위가 높은 작업을 선택한다.
- [x] 다음 태스크가 기능 2~3개 단위를 넘지 않도록 범위를 제한한다.
- [x] 다음 태스크가 테스트와 검증을 포함하도록 정의한다.
- [x] 다음 태스크가 `AGENTS.md` 원칙과 충돌하지 않는지 확인한다.
- [x] 다음 태스크 파일명을 `.tasks/task002.md`로 결정한다.
- [ ] 다음 태스크를 `task002.md`로 생성한다.
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
