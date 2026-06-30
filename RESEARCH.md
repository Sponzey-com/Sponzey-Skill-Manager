# Agent Skills 관리 도구 리서치

리서치 일자: 2026-06-26

## 요약

Agent Skills 생태계는 `SKILL.md`를 중심으로 한 "재사용 가능한 작업 지식 패키지"로 빠르게 표준화되고 있다. Anthropic Claude Code와 OpenAI Codex 모두 Agent Skills 표준을 지원하며, Codex는 `.agents/skills`를 중심으로 저장소, 사용자, 관리자, 시스템 스코프를 구분한다. MCP는 Skill 자체라기보다 외부 도구와 데이터 소스를 연결하는 표준 프로토콜이지만, Skill이 MCP 서버 의존성을 선언하거나 MCP 서버 개발 절차를 안내하는 방식으로 함께 쓰인다.

Sponzey Skills Manager 같은 관리 도구를 만든다면 단순 파일 브라우저보다 "발견, 검증, 설치, 활성/비활성, 의존성/권한 확인, 테스트 프롬프트, 배포 패키징"을 한 흐름으로 묶는 것이 핵심이다. 특히 untrusted repository skill, 실행 스크립트, MCP 도구, OAuth 권한은 보안 경계가 다르므로 UI와 데이터 모델에서 분리해 다뤄야 한다.

## 용어 정리

| 용어                   | 의미                                                                      | 관리 포인트                            |
| -------------------- | ----------------------------------------------------------------------- | --------------------------------- |
| Skill                | `SKILL.md`와 선택적 `scripts/`, `references/`, `assets/`를 포함한 폴더형 작업 지식 패키지 | 메타데이터, 설명 품질, 트리거, 파일 구조, 버전      |
| Tool                 | 모델이 호출하는 단일 함수/API/명령                                                   | 입력 스키마, 권한, 실행 결과, 오류 처리          |
| MCP server           | 외부 도구/데이터/프롬프트를 MCP로 노출하는 서버                                            | 설치 명령, 인증, transport, tool 목록, 보안 |
| Plugin/package       | 하나 이상의 skill, MCP 설정, 앱 매핑 등을 배포하기 위한 묶음                                | manifest, 버전, 출처, 업데이트            |
| Registry/marketplace | skill 또는 MCP server를 검색/설치하는 카탈로그                                       | 검색, 검증, 평판, namespace, 보안 스캔      |

## 생태계 현황

### 1. Agent Skills open standard

Agent Skills 표준은 skill을 `SKILL.md`가 들어 있는 디렉터리로 정의한다. 필수 frontmatter는 `name`, `description`이고, 선택적으로 `license`, `compatibility`, `metadata`, `allowed-tools` 등을 둔다. 표준은 progressive disclosure를 권장한다. 즉 세션 시작 시에는 skill 이름과 설명만 모델에 보여주고, 실제 필요할 때 `SKILL.md` 본문과 참조 파일을 추가로 읽는다.

관리 도구 관점에서 중요한 점은 다음이다.

- `name`은 디렉터리명과 일치해야 하고 길이/문자 규칙이 있다.
- `description`은 자동 선택 품질을 좌우하므로 lint 대상이 되어야 한다.
- 긴 본문은 `references/`로 분리해 컨텍스트 비용을 줄이는 것이 좋다.
- validator가 필요하다. 표준 문서는 `skills-ref validate ./my-skill` 같은 검증 흐름을 제시한다.
- 로컬 agent는 project/user/org/bundled scope를 스캔할 수 있고, 클라우드 agent는 API, registry, 업로드, 설정 저장소 같은 별도 공급 방식이 필요하다.

주요 출처: [Agent Skills overview](https://agentskills.io/home), [Agent Skills specification](https://agentskills.io/specification), [Adding skills support](https://agentskills.io/client-implementation/adding-skills-support)

### 2. Anthropic Claude Code Skills

Claude Code는 `~/.claude/skills/<skill-name>/SKILL.md`, `.claude/skills/<skill-name>/SKILL.md`, plugin skill 등을 지원한다. 명령형 호출은 `/skill-name` 형태이고, 모델이 description을 보고 자동으로 skill을 고를 수도 있다. Claude Code 문서에는 skill 디렉터리 변경 감지, parent/nested 디렉터리 탐색, additional directory 처리, invocation 제어, subagent 실행, dynamic context injection 등이 포함된다.

관리 도구 관점의 시사점:

- Claude 호환성을 목표로 하면 `.claude/skills`와 `.agents/skills` 양쪽을 인덱싱해야 한다.
- 같은 이름의 skill이 여러 스코프에 있을 때 우선순위와 shadowing을 UI에 보여줘야 한다.
- Claude Code frontmatter는 표준보다 넓은 필드를 갖는다. 예: `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`.
- skill이 plugin 역할까지 할 수 있으므로 "폴더형 skill"과 "배포형 plugin"을 구분해 보여주는 것이 좋다.

주요 출처: [Claude Code Skills](https://code.claude.com/docs/en/skills)

### 3. OpenAI Codex Skills

Codex는 Agent Skills를 task-specific capability로 설명하고, skill을 "workflow authoring format", plugin을 "installable distribution unit"으로 분리한다. Codex CLI, IDE extension, Codex app에서 사용할 수 있으며, progressive disclosure를 사용한다. 초기 skill 목록은 컨텍스트 창의 2% 또는 8,000자 한도 내에서 관리되고, 많은 skill이 설치되면 description이 축약되거나 일부 skill이 빠질 수 있다.

Codex의 로컬 저장 위치:

| Scope  | 위치                                                                          | 용도                        |
| ------ | --------------------------------------------------------------------------- | ------------------------- |
| REPO   | `$CWD/.agents/skills`, 상위 폴더의 `.agents/skills`, `$REPO_ROOT/.agents/skills` | repo/module/team workflow |
| USER   | `$HOME/.agents/skills`                                                      | 사용자 전역 skill              |
| ADMIN  | `/etc/codex/skills`                                                         | 머신/컨테이너 공용 skill          |
| SYSTEM | Codex bundled                                                               | built-in skill            |

Codex는 `$skill-creator`, `$skill-installer`, Record & Replay를 제공하고, `~/.codex/config.toml`의 `[[skills.config]]`로 skill을 비활성화할 수 있다. 또한 `agents/openai.yaml`로 UI metadata, implicit invocation 정책, MCP tool dependency를 선언할 수 있다.

OpenAI API 측면에서도 hosted/local shell 환경에 reusable/versioned skill bundle을 붙이는 문서가 있다. 즉 관리 도구는 로컬 Codex skill뿐 아니라 API에 업로드할 zip/multipart skill bundle까지 염두에 둘 수 있다.

주요 출처: [Codex Agent Skills](https://developers.openai.com/codex/skills), [OpenAI API Skills](https://developers.openai.com/api/docs/guides/tools-skills)

### 4. MCP와 MCP Registry

MCP는 AI 애플리케이션이 외부 시스템에 연결하기 위한 open-source 표준이다. Tools, resources, prompts를 노출하고, tool은 이름, 설명, JSON Schema 기반 input schema, 선택적 output schema를 가진다. MCP tool은 model-controlled 호출이 가능하지만, 공식 spec은 사용자에게 노출되는 도구와 호출 상태를 명확히 보여주고 중요한 작업에는 human-in-the-loop 확인을 권장한다.

MCP Registry는 공개 MCP server metadata를 위한 공식 중앙 저장소다. 현재 preview 상태이며, DNS/GitHub 기반 namespace 검증, REST API, 표준 설치/설정 metadata, `server.json` 포맷을 제공한다. 단, 실제 보안 스캔은 underlying package registry와 downstream aggregator/marketplace에 위임하는 구조다.

관리 도구 관점의 시사점:

- Skill은 "작업 절차"이고 MCP server는 "실행 가능한 외부 능력"이다. 둘을 같은 목록에 섞기보다 dependency 관계로 연결하는 것이 낫다.
- MCP server 설치 명령, env vars, remote URL, OAuth 필요 여부, exposed tool 목록을 skill metadata와 함께 보여줘야 한다.
- MCP Inspector 같은 도구를 사용해 server capability와 tool schema를 검증할 수 있다.

주요 출처: [MCP intro](https://modelcontextprotocol.io/docs/getting-started/intro), [MCP tools spec](https://modelcontextprotocol.io/specification/2025-06-18/server/tools), [MCP Registry](https://modelcontextprotocol.io/registry/about), [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)

### 5. MCP/agent tool 관리 서비스

| 서비스      | 초점                                                                                      | Skills Manager에 참고할 점                    |
| -------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| Composio | 1,000+ app toolkit, per-user auth, sessions, triggers, sandbox/workbench, MCP client 연동 | OAuth/권한/실행 환경을 skill 파일과 분리해 관리하는 패턴    |
| Smithery | MCP 기반 tool/integration catalog, managed OAuth, credential storage, publish flow        | MCP 서버 검색/연결/배포와 credential lifecycle UI |
| PulseMCP | MCP 서버, 클라이언트, 앱, use case 탐색과 뉴스레터                                                     | discovery/catalog UX와 MCP 생태계 모니터링       |

이들은 `SKILL.md` 편집기라기보다 tool/MCP connection layer에 가깝다. Sponzey가 Agent Skills Manager를 목표로 한다면, 이들과 경쟁하기보다 "skill이 요구하는 MCP/tool dependency를 감지하고 연결 상태를 보여주는 관리 계층"으로 보는 것이 현실적이다.

주요 출처: [Composio docs](https://docs.composio.dev/docs), [Composio product page](https://composio.dev/), [Smithery docs](https://smithery.ai/docs), [PulseMCP](https://www.pulsemcp.com/)

### 6. 프레임워크별 tool 관리

LangChain, CrewAI, AutoGen, Pydantic AI는 모두 agent가 callable tools를 사용하는 구조를 제공한다. 이들은 대체로 Python/TypeScript 코드 안에서 함수, schema, context/state, memory, workbench/toolset을 관리한다. Agent Skills와의 차이는 "파일 기반 workflow instruction package"가 아니라 "런타임 호출 가능한 함수/서버"에 초점이 있다는 점이다.

관리 도구 관점의 시사점:

- LangChain/Pydantic AI의 tool schema, CrewAI의 tools repository, AutoGen의 Workbench/MCP 연동은 skill 실행 의존성으로 모델링할 수 있다.
- Framework tool을 skill 안에 직접 넣기보다 skill metadata에서 "필요한 toolset/MCP/app"으로 참조하는 편이 이식성이 높다.
- 코드 기반 tool은 테스트, sandbox, dependency install, secret injection 문제가 생기므로 skill authoring UX와 분리하는 것이 좋다.

주요 출처: [LangChain tools](https://docs.langchain.com/oss/python/langchain/tools), [CrewAI tools](https://docs.crewai.com/en/concepts/tools), [AutoGen agents/tools](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/agents.html), [Pydantic AI tools](https://pydantic.dev/docs/ai/tools-toolsets/tools/)

## 비교 표

| 대상                                   | 관리 단위                                         | 강점                                                        | 약점/주의                                | Sponzey MVP 반영           |
| ------------------------------------ | --------------------------------------------- | --------------------------------------------------------- | ------------------------------------ | ------------------------ |
| Agent Skills 표준                      | `SKILL.md` 폴더                                 | 크로스 클라이언트, 단순 구조, 버전 관리 쉬움                                | client-specific extension 차이         | 기본 데이터 모델과 validator     |
| Claude Code Skills                   | `.claude/skills`, plugin skills               | 풍부한 frontmatter, 자동/수동 호출, subagent/dynamic context       | Claude 전용 필드가 많음                     | 호환성 lint와 import/export  |
| Codex Skills                         | `.agents/skills`, plugin distribution         | 표준 경로, skill creator/installer, config disable, plugin 배포 | 컨텍스트 budget 때문에 대량 skill UX 필요       | `.agents/skills` 우선 지원   |
| OpenAI API Skills                    | hosted/local shell에 attach되는 versioned bundle | API 업로드/재사용 가능                                            | 앱 내 skill registry와 로컬 파일 sync 필요    | zip export/API upload 후보 |
| MCP Registry                         | MCP server metadata                           | tool/server discovery 표준화                                 | private server 미지원, security scan 위임 | dependency resolver 후보   |
| Composio/Smithery                    | agent tool/auth gateway                       | OAuth, credential, app integrations                       | skill authoring 자체는 아님               | connector integration 후보 |
| LangChain/CrewAI/AutoGen/Pydantic AI | code-level tools/toolsets                     | 앱 내부 agent runtime과 잘 맞음                                  | skill portability 낮음                 | 실행 의존성 타입으로만 관리          |

## Sponzey Skills Manager 제안

### MVP 기능

1. Skill discovery
   - `$REPO_ROOT/.agents/skills`, `$HOME/.agents/skills`, `.claude/skills` 스캔
   - scope, absolute path, source client, symlink 여부 표시
   - 동일 `name` 충돌과 shadowing 진단
2. Skill validation/lint
   - `SKILL.md` frontmatter parse
   - `name`, directory name, `description` 길이/구체성, required field 검사
   - `scripts/`, `references/`, `assets/` 참조 파일 존재 여부 검사
   - Claude/Codex extension field를 "표준", "Claude-only", "Codex-only", "unknown"으로 표시
3. Enable/disable and invocation policy
   - Codex `~/.codex/config.toml` 비활성화 항목 조회/수정
   - `agents/openai.yaml`의 `allow_implicit_invocation` 편집
   - Claude의 `disable-model-invocation`, `user-invocable` 편집
4. Authoring editor
   - `SKILL.md` frontmatter form + markdown editor
   - description trigger test 입력창
   - context budget preview: catalog entry 길이, 본문 길이, reference 분리 추천
5. Dependency and security view
   - `allowed-tools`, `dependencies.tools`, inline shell/dynamic context, `scripts/` 탐지
   - MCP dependency URL/transport/status 표시
   - "읽기 전용", "파일 쓰기", "shell 실행", "network/OAuth", "state-changing external action" 같은 risk badge
6. Packaging
   - `.agents/skills/<name>` 생성
   - zip export
   - plugin packaging은 MVP 이후로 분리

### 권장 데이터 모델

```text
Skill
- id
- name
- description
- scope: repo | user | admin | system | claude | plugin | api
- root_path
- skill_md_path
- source_client: standard | codex | claude | unknown
- standard_validity: valid | warning | invalid
- enabled
- implicit_invocation_allowed
- compatibility
- license
- metadata_json
- body_token_estimate
- catalog_token_estimate
- risk_level
- last_scanned_at

SkillFile
- skill_id
- relative_path
- kind: manifest | script | reference | asset | metadata | unknown
- exists
- executable
- size_bytes

SkillDependency
- skill_id
- type: mcp | shell | python | node | app | env | network | unknown
- name
- transport
- url_or_command
- required
- status

Diagnostic
- skill_id
- severity: info | warning | error
- code
- message
- file_path
```

### MVP 우선순위

1. `.agents/skills`와 `.claude/skills` 스캔/목록/상세 보기
2. `SKILL.md` validation과 description 품질 lint
3. enable/disable 및 implicit invocation 설정
4. dependency/risk badge
5. zip export와 repo skill 생성
6. MCP Registry/Smithery/Composio 연동
7. plugin packaging, API upload, eval 자동화

## 보안/품질 체크리스트

- Untrusted repo skill은 기본 비활성 또는 trust prompt가 필요하다.
- `scripts/`가 있거나 shell 명령을 주입하는 skill은 실행 전 권한 확인을 해야 한다.
- Skill 본문은 agent prompt에 들어가므로 prompt injection과 policy override를 검사해야 한다.
- OAuth token/API key는 skill 폴더에 저장하지 않고 외부 credential store로 분리해야 한다.
- `description`이 너무 넓으면 잘못 자동 실행될 수 있다. 반대로 너무 짧으면 skill이 선택되지 않는다.
- Skill이 state-changing MCP tool을 요구하면 human-in-the-loop 확인 정책을 표시해야 한다.
- 많은 skill이 설치되면 catalog budget 문제가 생기므로 tag/filter/priority/disable 기능이 필요하다.
- 표준 필드와 client-specific 필드를 분리 저장해야 Claude/Codex 간 round-trip 손실을 줄일 수 있다.

## 결론

Sponzey Skills Manager의 가장 좋은 포지션은 "Agent Skills 파일 관리 + 호환성 검사 + 실행 의존성/보안 가시화"다. MCP marketplace나 Composio/Smithery 같은 tool gateway를 직접 대체하기보다, skill이 그런 도구를 어떻게 요구하는지 파악하고 사용자가 안전하게 설치/활성화/배포할 수 있게 만드는 쪽이 차별화된다.

초기 구현은 Codex의 `.agents/skills`를 기준으로 잡고 Claude의 `.claude/skills` import를 지원하는 것이 좋다. Agent Skills 표준을 canonical model로 두되, Claude/Codex 확장 필드는 손실 없이 보존해야 한다.
