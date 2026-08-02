# BE testing architecture — paste-in prompt (shared: BE Nivo + BE MiMia)

Paste the block below into a Claude Code session inside the target backend. It is self-contained;
each session discovers and adapts to that project's own structure.

```
You are adding the StarCi three-kind backend test architecture to THIS NestJS project. Adapt every step to how this project is actually built — discover its structure first, do not assume names.

BEFORE YOU START
- Read this project's Jest config, its AppModule, its env/config module, and find EVERY LLM/AI provider it injects — OpenAI client, OpenRouter client, any other paid model API. Grep for: openai, openrouter, OPENAI_API_KEY, OPENROUTER, model-client class names.
- Confirm the stack (NestJS + TypeORM + Postgres assumed; adjust containers/ORM if different).

KIND 1 — unit (Jest, isolated)
- A Jest "unit" project; .spec.ts co-located with the file it tests.
- The unit is isolated, its deps mocked: Test.createTestingModule({...}).overrideProvider(Dep).useValue(mock).
- Test logic/branches/thrown exceptions — not the framework. No real I/O.
- Script: "test:unit": "jest --selectProjects unit".

KIND 2 — e2e (Testcontainers)
- Separate Jest e2e config (test/e2e/jest-e2e.json).
- Add @testcontainers/postgresql (+ a container per other real dep). Global setup: start a real Postgres container, run migrations, boot the REAL Nest app against it; teardown stops it. Nothing mocked.
- Tests hit real endpoints/resolvers/webhooks end to end (*.e2e-spec.ts).
- Script: "test:e2e:docker": "jest --config test/e2e/jest-e2e.json --runInBand".

KIND 3 — harness (AI features on Claude Code OAuth)  ← the point
AI features (grading, RAG, generation) have no fixed expected output. The harness:
1) OVERRIDE every paid LLM provider with Claude on Claude Code OAuth. In the testing module replace the OpenAI client, the OpenRouter client, and any other paid model client with ONE Claude client authed by Claude Code OAuth (token from the Claude Code environment, injected in code) — so AI runs with NO production provider key and at no cost:
     Test.createTestingModule({ imports: [AppModule] })
       .overrideProvider(OpenAiClient).useValue(claudeClient)
       .overrideProvider(OpenRouterClient).useValue(claudeClient)
       // ...every other paid model provider
       .compile()
2) JUDGE the output with Claude. A judge(rubric, output) helper calls the Anthropic SDK with a structured-output schema returning { pass, score, reasons }; the test asserts pass + a score threshold. This tests non-deterministic AI output against a rubric, not an exact value.
- Files: test/harness/*.harness-spec.ts, test/harness/judge.ts, its own jest-harness.json.
- Script: "harness": "jest --config test/harness/jest-harness.json --runInBand".

VERIFY
Run each of the three, fix until green, report which now exist and pass. DO NOT fake a pass — if the harness cannot reach Claude Code OAuth here, say so rather than stubbing the judge to always pass.

REFERENCE
Full grounded rule: canon/be/enforce/authoring/testing.md in github.com/starci183/starci-claude-skills. The block above is self-contained.
```
