# Task 031. Transfer Command Input Collection

## 1. Task Purpose

- [x] 이 태스크의 목적은 command palette에서 transfer 명령 실행 시 필요한 target, applied skill, 명령별 추가 input DTO를 presentation 계층에서 수집하는 것이다.
- [x] 이 태스크 완료 후 사용자는 command palette만으로 applied skill을 Main Repository로 copy, backup, move할 수 있어야 한다.

## 2. Scope

### Included

- [x] `sponzeySkills.copyAppliedSkillToMainRepository` input을 수집한다.
- [x] `sponzeySkills.backupAppliedSkillToMainRepository` input을 수집한다.
- [x] `sponzeySkills.moveAppliedSkillToMainRepository` input을 수집한다.
- [x] 공통 missing target은 read model의 global/project target group을 quick pick으로 표시해 수집한다.
- [x] 공통 missing applied skill은 선택된 target group의 `skills`를 quick pick으로 표시해 수집한다.
- [x] copy/move의 missing `sourceName`은 input box로 수집한다.
- [x] backup의 missing `snapshotId`는 input box로 수집한다.
- [x] move의 missing `cleanupConfirmed`는 명시적 quick pick 확인으로 수집한다.
- [x] 이미 input DTO가 제공된 호출은 prompt 없이 그대로 통과시킨다.
- [x] input collection 취소 시 use case handler를 호출하지 않고 typed cancelled result를 반환한다.
- [x] activation에서 command palette transfer 실행 시 prompt input이 transfer use case로 전달되는지 검증한다.

### Excluded

- [x] repository source name conflict 해결 UI는 구현하지 않는다.
- [x] backup snapshot ID 자동 생성 정책은 구현하지 않는다.
- [x] tree item context menu command input mapping은 구현하지 않는다.
- [x] transfer 완료 후 상세 diff preview는 구현하지 않는다.

## 3. Architecture Notes

- [x] 변경 계층은 presentation과 extension boundary에 한정한다.
- [x] input collector는 VSCode API를 import하지 않고 `window`와 `loadReadModel` dependency를 명시적으로 받는다.
- [x] input collector는 read model을 표시용 선택지로 변환하고 transfer policy를 구현하지 않는다.
- [x] copy/backup/move의 실제 파일 변경 정책은 Application/Infrastructure의 기존 use case와 adapter에 남긴다.
- [x] Domain/Application에는 prompt, window, command palette dependency를 추가하지 않는다.

## 4. Configuration Rules

- [x] input collection은 settings/environment를 직접 읽지 않는다.
- [x] read model loader는 activation composition에서 전달받는다.
- [x] 수집된 값은 명시적 input DTO로 use case handler에 전달한다.
- [x] snapshot ID 기본값 생성을 위해 런타임 환경 값을 새로 조회하지 않는다.

## 5. Logging Policy

- [x] input collector는 skill body, file content, stack trace를 로그나 notification에 노출하지 않는다.
- [x] 취소 result는 diagnostic code/message 수준만 반환한다.
- [x] Product Log/Field Debug Log persistence는 구현하지 않는다.

## 6. TDD Plan

- [x] 실패하는 presentation input collector 테스트를 먼저 작성한다.
- [x] copy transfer input이 target/applied skill/source name prompt로 채워지는지 검증한다.
- [x] backup transfer input이 target/applied skill/snapshot ID prompt로 채워지는지 검증한다.
- [x] move transfer input이 target/applied skill/source name/cleanup confirmation prompt로 채워지는지 검증한다.
- [x] 기존 transfer DTO가 있는 호출은 prompt와 read model load 없이 통과하는지 검증한다.
- [x] input 취소 시 wrapped handler가 호출되지 않는지 검증한다.
- [x] activation에서 command palette transfer 실행 시 prompt input이 transfer adapter 호출로 전달되는지 검증한다.

## 7. Completion Report

### Summary

- transfer command palette 실행 시 target과 applied skill을 read model 기반 quick pick으로 수집하도록 input collector를 확장했다.
- copy/move는 `sourceName`, backup은 `snapshotId`, move는 `cleanupConfirmed`를 명시적으로 수집한다.
- remove와 transfer가 공유하는 applied skill 선택 로직을 presentation 계층 내부 helper로 분리했다.
- activation 경로에서 copy/backup/move prompt 입력이 use case adapter 호출까지 전달되는지 검증했다.

### Changed Files

- `src/presentation/command-input-collector.js`
- `test/presentation/command-input-collector.test.mjs`
- `test/extension-activation.test.mjs`
- `.tasks/task031.md`

### Test Results

- `npm test -- test/presentation/command-input-collector.test.mjs`: 17 tests passed.
- `npm test -- test/extension-activation.test.mjs`: 11 tests passed.
- `npm test`: 113 tests passed.
- `npm run check:architecture`: architecture ok, 23 source files checked.
- `npm run build`: architecture ok, build smoke ok.

### Verified Items

- transfer 명령의 missing target prompt는 read model의 global/project target group을 사용한다.
- transfer 명령의 missing applied skill prompt는 선택된 target group의 applied skill 목록을 사용한다.
- copy/move의 source name, backup의 snapshot ID, move의 cleanup confirmation은 명시적 DTO 필드로 전달된다.
- input collector는 VSCode API를 직접 import하지 않고 주입된 `window`와 `loadReadModel`만 사용한다.
- Domain/Application 계층에는 command palette 또는 prompt 의존성을 추가하지 않았다.
- 취소 이벤트는 typed cancelled result로 반환되고 use case handler를 호출하지 않는다.

### Remaining Risks

- snapshot ID 자동 생성 정책은 아직 없다. 사용자가 직접 입력한 ID가 adapter validation을 통과해야 한다.
- source name conflict가 발생했을 때 재입력 UX는 아직 없다. 현재는 기존 use case diagnostic을 표시하는 흐름을 따른다.
- tree item context menu에서 선택된 node를 transfer DTO로 매핑하는 흐름은 아직 별도 태스크로 남아 있다.
- move confirmation에서 `Do not move`를 선택하면 use case의 confirmation-required diagnostic으로 종료된다. 더 명확한 no-op 취소 UX는 후속 태스크에서 분리한다.

### Follow-up Tasks

- tree item context menu command input mapping을 추가한다.
- empty target/applied skill quick pick에 대한 unavailable result 처리를 설계한다.
- source name conflict 또는 backup snapshot conflict 발생 시 재시도 UX를 별도 정책으로 정의한다.

- [x] 수행한 변경 사항을 요약한다.
- [x] 생성하거나 수정한 파일을 기록한다.
- [x] 실행한 테스트 명령과 결과를 기록한다.
- [x] 검증한 항목을 기록한다.
- [x] 남은 위험 요소를 기록한다.
- [x] 후속 태스크에서 이어받아야 할 내용을 기록한다.
