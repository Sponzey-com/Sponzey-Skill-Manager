# Task 021. Default Skill Analyzer Wiring

## 1. Task Purpose

- [x] 이 태스크의 목적은 실제 extension composition에서 import/apply command가 기본 analyzer 없이 not-wired로 남는 문제를 해결하는 것이다.
- [x] 이 태스크 완료 후 analyzer가 명시 주입되지 않아도 repository source files를 읽어 `SKILL.md` 분석을 수행해야 한다.

## 2. Scope

### Included

- [x] repository file reader port를 통해 source skill files를 읽는 analyzer adapter를 application 계층에 추가한다.
- [x] `FileSystemSkillRepository`가 source directory files를 relative path map으로 읽는 method를 제공한다.
- [x] `createExtensionComposition`이 analyzer 미주입 시 기본 analyzer를 생성해 import/apply use case를 wire한다.
- [x] import command의 optional analysis가 기본 analyzer로 동작하는지 검증한다.
- [x] apply command의 risk analysis가 기본 analyzer로 동작하는지 검증한다.

### Excluded

- [x] analyzer rule set 확장은 구현하지 않는다.
- [x] Field Debug Log persistence는 구현하지 않는다.
- [x] VSCode input prompt는 구현하지 않는다.
- [x] TreeDataProvider runtime class는 구현하지 않는다.

## 3. Architecture Notes

- [x] 파일시스템 read는 infrastructure adapter에만 둔다.
- [x] analyzer adapter는 application 계층에서 repository port와 pure analyzer를 조합한다.
- [x] Domain은 파일시스템, VSCode API, 환경 설정에 의존하지 않는다.
- [x] Presentation에는 analyzer logic을 추가하지 않는다.

## 4. Configuration Rules

- [x] analyzer wiring은 runtime 중간 설정 재조회 없이 activation composition에서 결정한다.
- [x] analyzer는 환경 변수나 설정 singleton을 직접 읽지 않는다.
- [x] source path는 use case input과 repository source 객체에서 명시적으로 전달한다.

## 5. Logging Policy

- [x] analyzer adapter는 skill body/file content를 Product Log 또는 notification에 노출하지 않는다.
- [x] import/apply use case의 기존 Product Log/Field Debug Log 정책을 유지한다.
- [x] filesystem read 실패는 diagnostic code/message로만 반환한다.

## 6. TDD Plan

- [x] 실패하는 composition 테스트를 먼저 작성한다.
- [x] analyzer 미주입 상태에서 import command가 optional analysis를 수행하는지 검증한다.
- [x] analyzer 미주입 상태에서 apply command가 low risk source를 target에 쓰는지 검증한다.
- [x] filesystem repository가 nested reference file을 relative path map으로 읽는지 검증한다.

## 7. Completion Report

### Summary

- [x] `createRepositorySkillAnalyzer`를 추가해 application 계층에서 repository file reader port와 pure `analyzeSkillDirectory`를 조합하도록 했다.
- [x] `FileSystemSkillRepository.readSourceSkillFiles`를 추가해 source directory의 nested files를 relative path key map으로 읽도록 했다.
- [x] `createExtensionComposition`이 analyzer 미주입 시 기본 repository analyzer를 생성하도록 변경했다.
- [x] import/apply command가 기본 analyzer로 wire되어 not-wired 상태를 벗어나는지 검증했다.

### Files

- [x] `src/application/analysis/repository-skill-analyzer.js`를 추가했다.
- [x] `src/application/index.js`를 수정했다.
- [x] `src/extension-composition.js`를 수정했다.
- [x] `src/infrastructure/filesystem/file-system-skill-repository.js`를 수정했다.
- [x] `test/extension-composition.test.mjs`를 수정했다.
- [x] `test/infrastructure/file-system-skill-repository.test.mjs`를 수정했다.
- [x] `.tasks/task021.md`를 완료 상태로 갱신했다.

### Tests

- [x] `npm test -- test/extension-composition.test.mjs` 통과. `3`개 테스트가 모두 통과했다.
- [x] `npm test -- test/infrastructure/file-system-skill-repository.test.mjs` 통과. `10`개 테스트가 모두 통과했다.
- [x] `npm test` 통과. `79`개 테스트가 모두 통과했다.
- [x] `npm run check:architecture` 통과. `21`개 source file에서 architecture violation이 없음을 확인했다.
- [x] `npm run build` 통과. architecture check와 build smoke가 모두 통과했다.

### Validated Items

- [x] analyzer 미주입 composition에서 `sponzeySkills.importSkill`이 optional analysis를 수행한다.
- [x] analyzer 미주입 composition에서 `sponzeySkills.applySkillToGlobalTarget`이 low risk source를 target에 copy mode로 적용한다.
- [x] filesystem adapter가 `SKILL.md`와 `references/details.md`를 각각 relative path key로 반환한다.
- [x] 파일시스템 접근은 infrastructure adapter에만 있고, analyzer 조합은 application 계층에 있다.
- [x] 설정 또는 환경 값 재조회 없이 activation composition에서 analyzer wiring이 결정된다.

### Remaining Risks

- [x] VSCode prompt/input collection은 아직 없다.
- [x] 실제 TreeDataProvider runtime class는 아직 없다.
- [x] analyzer rule set은 MVP 최소 규칙만 포함한다.
- [x] OutputChannel 기반 상세 진단과 Field Debug Log persistence는 아직 없다.

### Follow-Up

- [x] 후속 태스크에서 사용자 입력이 필요한 command의 input DTO collection boundary를 presentation 계층에 추가한다.
- [x] 후속 태스크에서 TreeDataProvider runtime class를 구현해 refresh read model을 VSCode view에 연결한다.
