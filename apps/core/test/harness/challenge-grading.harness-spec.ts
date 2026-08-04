/**
 * Stub `GithubRepoLoader` so no real clone/network happens — every instance's
 * `.load()` resolves the docs the CURRENT git case programs via `loaderLoadMock`.
 * Mirrors `process-git-submission-grade-step.service.spec.ts`. Declared first (before
 * any import of the SUT) so jest's mock registers before the SUT module — which
 * imports `GithubRepoLoader` at its own top level — is required.
 */
const loaderLoadMock = jest.fn()
jest.mock(
    "@langchain/community/document_loaders/web/github",
    () => ({
        GithubRepoLoader: jest.fn().mockImplementation(() => ({
            load: loaderLoadMock,
        })),
    }),
)

import {
    makeEntityManagerMock,
    EntityManagerMock,
} from "@modules/tests"
import {
    Locale,
} from "@modules/databases"
import type {
    ChallengeEvaluation,
} from "@modules/bullmq"
import {
    ChallengeEvaluationParseService,
} from "@features/api/processors/ai/shared/challenge-evaluation"
import {
    ProcessGitSubmissionGradeStepService,
} from "@features/api/processors/ai/process-git-submission/steps/process-git-submission-grade-step.service"
import {
    ProcessGoogleDocsSubmissionGradeStepService,
} from "@features/api/processors/ai/process-google-docs-submission/steps/process-google-docs-submission-grade-step.service"
import {
    createHarnessInvoke,
} from "./harness-invoke"
import type {
    HarnessTierName,
} from "./models"
import {
    judge,
} from "./judge"
import {
    readVolumeDoc,
    volumeExists,
} from "./volume"

/** Minimum judge score a produced evaluation must reach to count as passing. */
const PASS_SCORE = 60

/** The tier the harness routes THIS case's grading model call to. */
let currentTier: HarnessTierName = "high"

/**
 * REAL challenge material from the `.volume` SSOT mount (course
 * `0-fullstack-mastery`, module `0-nestjs-core-and-request-lifecycle`, lesson
 * `0-frameworks-in-backend`) — the actual DI-teaching challenge pair the app
 * ships, EASY then its MEDIUM escalation. Grounding in these (rather than a
 * hand-written brief) tests the grading BIZ against the app's real rubric prose.
 *
 * `readVolumeDoc` parses a doc's flat `# field <sep> value` sequence — that
 * covers `title`/`description` cleanly here, but a challenge doc's
 * `requirements`/`steps` sections are a NESTED tree (`## 0 / ### langs / #### 0
 * / ##### lang / ##### body`, repeated per requirement × per language), which
 * the flat parser can't reach: it strips only the outermost `#`, so nested
 * keys collide across requirements/languages and the LAST one silently wins.
 * So `title` below comes straight from `readVolumeDoc`; the graded
 * outcome/approach criteria are transcribed VERBATIM from the same source
 * files (the "typescript" language rows) into the shape
 * `collectSubmissionCriteria` actually reads.
 */
const CHALLENGE_1_DIR = "courses/0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend/challenges/0-order-inventory-cross-module-di-easy"
const CHALLENGE_2_DIR = "courses/0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend/challenges/1-custom-provider-dynamic-module-medium"

/** Skip the whole suite (with a clear message) when the SSOT mount is absent. */
const HAVE_VOLUME = volumeExists(CHALLENGE_1_DIR) && volumeExists(CHALLENGE_2_DIR)
const describeOrSkip = HAVE_VOLUME
    ? describe
    : describe.skip

const challenge1Doc = HAVE_VOLUME
    ? readVolumeDoc(CHALLENGE_1_DIR)
    : undefined
const challenge2Doc = HAVE_VOLUME
    ? readVolumeDoc(CHALLENGE_2_DIR)
    : undefined

/** REAL title, `challenges/0-order-inventory-cross-module-di-easy/en.md` (`# title`). */
const CHALLENGE_1_TITLE = challenge1Doc?.title
    ?? "Reuse a service across two areas via Dependency Injection"
/** REAL title, `challenges/1-custom-provider-dynamic-module-medium/en.md` (`# title`). */
const CHALLENGE_2_TITLE = challenge2Doc?.title
    ?? "Swap implementations via DI and configure at compose time"

/** One challenge-grading eval case: `challenge`/`challengeSubmission` (real, per above) plus a
 * submission of known quality graded by the REAL grade-step service (real prompt + real
 * {@link ChallengeEvaluationParseService}) answered by a real Claude model at `tier`, then judged
 * by {@link judge} against a rubric describing what a good evaluation for THIS submission looks
 * like. Proves the grading BIZ (prompt + criteria rendering + parse) produces a sensible
 * evaluation against REAL challenge prose, not just that a canned fixture parses.
 */
interface GradeCase {
    /** jest row label. */
    name: string
    /** tier the grading model runs at. */
    tier: HarnessTierName
    /** what a good evaluation for this submission must satisfy. */
    rubric: string
}

/**
 * REAL outcome (functional) + approach (code-quality) criteria for CHALLENGE 1, transcribed
 * verbatim from `challenges/0-order-inventory-cross-module-di-easy/en.md`'s TypeScript
 * `requirements`/`steps` bodies (see file header for why `readVolumeDoc` can't reach these).
 */
const CHALLENGE_1 = {
    id: "challenge-1-di-easy",
    title: CHALLENGE_1_TITLE,
}
const CHALLENGE_1_SUBMISSION = {
    outcomeScore: 60,
    approachScore: 40,
    outcomeCriteria: [
        {
            orderIndex: 0,
            critical: true,
            langs: [
                {
                    lang: "typescript",
                    body: "OrderService receives InventoryService via constructor injection — ABSOLUTELY no `new InventoryService()`. InventoryService.reserveStock(productId, qty) subtracts stock (default 100/sku) and returns the reserved amount. POST /orders accepts {productId, qty} (qty is a positive integer) and returns {orderId, productId, reservedQty}; orderId is a UUID v4 generated by crypto.randomUUID().",
                },
            ],
        },
        {
            orderIndex: 1,
            critical: false,
            langs: [
                {
                    lang: "typescript",
                    body: "POST /orders returns HTTP 201 with a body {orderId, productId, reservedQty}. orderId matches the UUID v4 regex; reservedQty === qty, productId === input. The README has 6 sections: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.",
                },
            ],
        },
    ],
    approachCriteria: [
        {
            orderIndex: 0,
            critical: false,
            langs: [
                {
                    lang: "typescript",
                    body: "InventoryModule contains InventoryService and declares exports: [InventoryService]. OrderModule declares imports: [InventoryModule]; InventoryService is NOT re-registered in OrderModule's providers (that would create a second instance). The two business areas are not merged into the same module.",
                },
            ],
        },
    ],
}

/**
 * REAL outcome + approach criteria for CHALLENGE 2, transcribed verbatim from
 * `challenges/1-custom-provider-dynamic-module-medium/en.md`'s TypeScript
 * `requirements`/`steps` bodies.
 */
const CHALLENGE_2 = {
    id: "challenge-2-provider-medium",
    title: CHALLENGE_2_TITLE,
}
const CHALLENGE_2_SUBMISSION = {
    outcomeScore: 60,
    approachScore: 40,
    outcomeCriteria: [
        {
            orderIndex: 0,
            critical: true,
            langs: [
                {
                    lang: "typescript",
                    body: "KvService receives Store via @Inject(STORE) and options via @Inject(STORE_OPTIONS) — ABSOLUTELY no new InMemoryStore() / new FileStore(). POST /kv accepts {key, value} and returns {impl, prefix, ttlSec, storedKey}; storedKey = `${prefix}:${key}` and must actually be saved into the chosen store. impl in the response reflects the impl actually running per the forRoot config.",
                },
            ],
        },
        {
            orderIndex: 1,
            critical: false,
            langs: [
                {
                    lang: "typescript",
                    body: "POST /kv returns 201 with a correct {impl, prefix, ttlSec, storedKey}; storedKey === \"app:hello\" with prefix app. Switching forRoot to impl: 'file' makes the impl field in the response become file. The README has 6 sections: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.",
                },
            ],
        },
    ],
    approachCriteria: [
        {
            orderIndex: 0,
            critical: false,
            langs: [
                {
                    lang: "typescript",
                    body: "Interface Store { set(key, value): void; get(key): string | undefined } and an injection token (e.g. const STORE = Symbol('STORE')) are declared. StoreModule.forRoot(options: { impl: 'memory' | 'file'; prefix: string; ttlSec: number }) returns a DynamicModule with a custom provider using useFactory to pick InMemoryStore or FileStore based on options.impl. Options are wired through DI via a dedicated STORE_OPTIONS provider, not read from env vars scattered inside services.",
                },
            ],
        },
    ],
}

/**
 * Assert the produced {@link ChallengeEvaluation} is structurally sane, then judge it
 * against the case's rubric.
 */
const assertAndJudge = async (
    evaluation: ChallengeEvaluation,
    rubric: string,
): Promise<void> => {
    expect(typeof evaluation.score).toBe("number")
    expect(Number.isFinite(evaluation.score)).toBe(true)
    expect(evaluation.shortFeedback.trim().length).toBeGreaterThan(0)

    const verdict = await judge(rubric,
        JSON.stringify(evaluation))

    expect(verdict.pass).toBe(true)
    expect(verdict.score).toBeGreaterThanOrEqual(PASS_SCORE)
}

/** Minimal job + payload + extended context shared by both flows and every case. */
const makeContext = (
    challenge: { id: string; title: string },
    challengeSubmission: unknown,
    overrides: Record<string, unknown> = {
    },
) => ({
    job: {
        id: "job-1",
        fencingToken: 7,
    },
    queueName: "harness",
    payload: {
        userChallengeSubmissionId: "ucs-1",
        enrollmentId: "enroll-1",
        branch: "main",
        locale: Locale.En,
        lang: "typescript",
        ai: {
        },
        ...overrides,
    },
    extended: {
        challenge,
        challengeSubmission,
        userChallengeSubmission: {
            submissionUrl: "https://github.com/harness-user/di-challenge-repo",
        },
    },
}) as never

// ─────────────────────────────────────────────────────────────────────────
// CHALLENGE 1 (easy, DI reuse) git-submission fixtures — a couple of files
// each, representing a real repo checkout at varying quality.
// ─────────────────────────────────────────────────────────────────────────

const INVENTORY_MODULE_FILE = {
    path: "src/inventory/inventory.module.ts",
    content: [
        "import { Module } from \"@nestjs/common\"",
        "import { InventoryService } from \"./inventory.service\"",
        "",
        "@Module({",
        "    providers: [InventoryService],",
        "    exports: [InventoryService],",
        "})",
        "export class InventoryModule {}",
    ].join("\n"),
}
const INVENTORY_SERVICE_FILE = {
    path: "src/inventory/inventory.service.ts",
    content: [
        "import { Injectable } from \"@nestjs/common\"",
        "",
        "@Injectable()",
        "export class InventoryService {",
        "    private readonly stock = new Map<string, number>()",
        "",
        "    private stockFor(productId: string): number {",
        "        if (!this.stock.has(productId)) this.stock.set(productId, 100)",
        "        return this.stock.get(productId) as number",
        "    }",
        "",
        "    reserveStock(productId: string, qty: number): number {",
        "        const remaining = this.stockFor(productId) - qty",
        "        this.stock.set(productId, remaining)",
        "        return qty",
        "    }",
        "}",
    ].join("\n"),
}
const ORDER_CONTROLLER_FILE = {
    path: "src/order/order.controller.ts",
    content: [
        "import { Body, Controller, Post } from \"@nestjs/common\"",
        "import { OrderService } from \"./order.service\"",
        "",
        "@Controller(\"orders\")",
        "export class OrderController {",
        "    constructor(private readonly orderService: OrderService) {}",
        "",
        "    @Post()",
        "    create(@Body() body: { productId: string; qty: number }) {",
        "        return this.orderService.createOrder(body.productId, body.qty)",
        "    }",
        "}",
    ].join("\n"),
}
const README_1_FILE = {
    path: "README.md",
    content: [
        "# Challenge description",
        "Reuse InventoryService from OrderService via dependency injection.",
        "",
        "# How to run",
        "`npm run start:dev`",
        "",
        "# Architecture/Stack",
        "NestJS. InventoryModule exports InventoryService; OrderModule imports InventoryModule.",
        "",
        "# Smoke Test",
        "POST /orders {\"productId\":\"SKU-001\",\"qty\":3} -> 201 {\"orderId\":\"...\",\"productId\":\"SKU-001\",\"reservedQty\":3}",
        "",
        "# Code Execution Trace",
        "OrderController -> OrderService -> InventoryService (order.controller.ts:9 -> order.service.ts:9 -> inventory.service.ts:13)",
        "",
        "# Design Decisions",
        "InventoryService is exported and injected — OrderService never instantiates it itself.",
    ].join("\n"),
}

/** Correct, well-structured DI: constructor injection, module boundary respected, real UUID v4, full README. */
const GIT_PASS_FILES = [
    INVENTORY_MODULE_FILE,
    INVENTORY_SERVICE_FILE,
    {
        path: "src/order/order.module.ts",
        content: [
            "import { Module } from \"@nestjs/common\"",
            "import { InventoryModule } from \"../inventory/inventory.module\"",
            "import { OrderService } from \"./order.service\"",
            "import { OrderController } from \"./order.controller\"",
            "",
            "@Module({",
            "    imports: [InventoryModule],",
            "    controllers: [OrderController],",
            "    providers: [OrderService],",
            "})",
            "export class OrderModule {}",
        ].join("\n"),
    },
    {
        path: "src/order/order.service.ts",
        content: [
            "import { Injectable } from \"@nestjs/common\"",
            "import { randomUUID } from \"crypto\"",
            "import { InventoryService } from \"../inventory/inventory.service\"",
            "",
            "@Injectable()",
            "export class OrderService {",
            "    constructor(private readonly inventoryService: InventoryService) {}",
            "",
            "    createOrder(productId: string, qty: number) {",
            "        const reservedQty = this.inventoryService.reserveStock(productId, qty)",
            "        return { orderId: randomUUID(), productId, reservedQty }",
            "    }",
            "}",
        ].join("\n"),
    },
    ORDER_CONTROLLER_FILE,
    README_1_FILE,
]

/** Nothing implemented — placeholder + a README admitting it's unfinished. */
const GIT_FAIL_FILES = [
    {
        path: "README.md",
        content: [
            "# My submission",
            "",
            "TODO: wire InventoryService into OrderService. I ran out of time.",
        ].join("\n"),
    },
    {
        path: "src/order/order.service.ts",
        content: [
            "// placeholder, not implemented yet",
            "export class OrderService {}",
        ].join("\n"),
    },
]

/**
 * PARTIAL: the CRITICAL outcome criterion is genuinely met (real constructor injection, real
 * `reserveStock`, real `crypto.randomUUID()`, correct `POST /orders` contract) — but the
 * module-boundary APPROACH criterion is violated (`OrderModule` re-registers `InventoryService`
 * as its own provider instead of importing `InventoryModule`) and there is no README at all
 * (misses the non-critical outcome criterion's 6-section requirement).
 */
const GIT_PARTIAL_FILES = [
    INVENTORY_MODULE_FILE,
    INVENTORY_SERVICE_FILE,
    {
        path: "src/order/order.module.ts",
        content: [
            "import { Module } from \"@nestjs/common\"",
            "import { InventoryService } from \"../inventory/inventory.service\"",
            "import { OrderService } from \"./order.service\"",
            "import { OrderController } from \"./order.controller\"",
            "",
            "// NOTE: re-registers InventoryService directly instead of importing InventoryModule",
            "@Module({",
            "    controllers: [OrderController],",
            "    providers: [OrderService, InventoryService],",
            "})",
            "export class OrderModule {}",
        ].join("\n"),
    },
    {
        path: "src/order/order.service.ts",
        content: [
            "import { Injectable } from \"@nestjs/common\"",
            "import { randomUUID } from \"crypto\"",
            "import { InventoryService } from \"../inventory/inventory.service\"",
            "",
            "@Injectable()",
            "export class OrderService {",
            "    constructor(private readonly inventoryService: InventoryService) {}",
            "",
            "    createOrder(productId: string, qty: number) {",
            "        const reservedQty = this.inventoryService.reserveStock(productId, qty)",
            "        return { orderId: randomUUID(), productId, reservedQty }",
            "    }",
            "}",
        ].join("\n"),
    },
    ORDER_CONTROLLER_FILE,
]

// ─────────────────────────────────────────────────────────────────────────
// CHALLENGE 2 (medium, custom-provider dynamic module) Google-Docs write-up
// fixtures — a couple of doc-text variants.
// ─────────────────────────────────────────────────────────────────────────

/** Thorough, correct write-up: token + factory + dedicated options provider + exact contract. */
const GDOCS_PASS_TEXT = [
    "# Store Swap Design — Dynamic Module + Custom Provider",
    "",
    "## Contract",
    "`Store` is an interface: `set(key: string, value: string): void` and `get(key: string): string | undefined`.",
    "Two implementations exist, `InMemoryStore` (in-memory Map) and `FileStore` (reads/writes a JSON file),",
    "both `implements Store`. An injection token `const STORE = Symbol('STORE')` identifies the active one.",
    "",
    "## Dynamic module",
    "`StoreModule.forRoot(options: { impl: 'memory' | 'file'; prefix: string; ttlSec: number })` returns a",
    "`DynamicModule`. It registers a dedicated `STORE_OPTIONS` provider (`{ provide: STORE_OPTIONS, useValue: options }`)",
    "and a custom provider `{ provide: STORE, useFactory: (opts) => opts.impl === 'file' ? new FileStore() : new InMemoryStore(), inject: [STORE_OPTIONS] }`,",
    "exporting both `STORE` and `STORE_OPTIONS`. No code outside this factory ever calls `new InMemoryStore()` or `new FileStore()`.",
    "",
    "## KV endpoint",
    "`KvService` receives `Store` via `@Inject(STORE)` and the options via `@Inject(STORE_OPTIONS)` —",
    "constructor injection only, never a manual `new`. `POST /kv` accepts `{ key, value }`, computes",
    "`storedKey = \\`${prefix}:${key}\\`` , actually writes it into the injected store, and responds",
    "`{ impl, prefix, ttlSec, storedKey }` where `impl` reflects whichever implementation `forRoot` wired up.",
    "",
    "## Verifying the swap",
    "With `forRoot({ impl: 'memory', prefix: 'app', ttlSec: 60 })`, `POST /kv { key: 'hello', value: 'world' }`",
    "returns `201` with `storedKey === 'app:hello'` and `impl === 'memory'`. Flipping `forRoot` to",
    "`impl: 'file'` and rebooting flips the response's `impl` to `'file'` with no other code change.",
    "",
    "## README",
    "The README documents all 6 required sections: Challenge description, How to run, Architecture/Stack,",
    "Smoke Test, Code Execution Trace, Design Decisions.",
].join("\n")

/** Vague, contentless write-up — never describes the token, factory, or the /kv contract. */
const GDOCS_FAIL_TEXT = [
    "# My submission",
    "",
    "I made the store thing configurable. It can use memory or a file, I'm not sure which one is on",
    "by default. The endpoint saves whatever you send it. Will polish later.",
].join("\n")

/**
 * PARTIAL: the token + factory-per-impl mechanism (APPROACH) is described reasonably, and the
 * CRITICAL contract is mostly right (token injection, prefix applied, impl surfaced) — but options
 * are read from scattered env vars instead of a dedicated `STORE_OPTIONS` provider (violates the
 * approach criterion), and there is no mention of the README or of the config-switch behaviour
 * (misses the non-critical outcome criterion).
 */
const GDOCS_PARTIAL_TEXT = [
    "# Store Swap Design",
    "",
    "## Store contract",
    "There is a `Store` interface with `set(key, value)` and `get(key)`, and two implementations,",
    "`InMemoryStore` and `FileStore`. The active implementation is picked via an injection token",
    "`STORE`, resolved by a factory provider that reads `options.impl` and constructs the right",
    "implementation, so nothing outside the factory ever calls `new InMemoryStore()` or `new FileStore()`.",
    "",
    "## KV endpoint",
    "`KvService` injects the `Store` token and applies the configured `prefix` to build the storage key,",
    "then actually writes the value into the chosen store. `POST /kv` exposes this and returns the impl",
    "that is currently active so callers can tell which backend served the request.",
    "",
    "## Configuration",
    "The active implementation and its `prefix`/`ttlSec` are read straight from environment variables",
    "(`STORE_IMPL`, `STORE_PREFIX`, `STORE_TTL_SEC`) inside `KvService` and inside `InMemoryStore`/`FileStore`",
    "wherever each of them needs a value, since that was the fastest way to wire every piece up.",
].join("\n")

/**
 * LLM-eval harness for CHALLENGE grading — the two AI-graded submission flows
 * (GitHub repo, Google Docs write-up), grounded in TWO REAL StarCi Academy
 * challenges from the `.volume` SSOT mount (`0-order-inventory-cross-module-di-easy`
 * for the git flow, `1-custom-provider-dynamic-module-medium` for the Google Docs
 * flow — see file header for how the criteria were sourced). Boots the REAL
 * grade-step service + REAL {@link ChallengeEvaluationParseService}, swaps only
 * {@link AiInvokeService} for the tiered harness model ({@link createHarnessInvoke},
 * `.secrets` auth), mocks every other dependency (source loader, retrieval,
 * storage/config, entitlement, persistence), captures the `{ evaluation, passed }`
 * argument the SUT hands to `jobActionService.saveExecutionResult({ key: "grade" })`,
 * and judges the produced {@link ChallengeEvaluation}. Covers, per flow: a plausibly
 * passing submission, a plausibly failing one, a PARTIAL one (meets the critical
 * criterion but misses supporting ones), cross-submission DISCRIMINATION (passing
 * strictly outscores failing on the SAME real challenge), and — git only — a
 * missing/placeholder repo grading to a low/failing result rather than crashing.
 *
 * Requires the `.volume` mount + a Claude Code OAuth token
 * (`.secrets/claude-code-token.txt` / `CLAUDE_CODE_OAUTH_TOKEN`) + live API.
 */
describeOrSkip("Challenge grading — real grade flow judged (harness)",
    () => {
        afterEach(() => {
            currentTier = "high"
            jest.clearAllMocks()
        })

        describe("git submission (ProcessGitSubmissionGradeStepService)",
            () => {
                let entityManager: EntityManagerMock

                const jobActionService = {
                    increaseJob: jest.fn(),
                    saveExecutionResult: jest.fn(),
                    loadExecutionResult: jest.fn().mockResolvedValue(undefined),
                    failJob: jest.fn(),
                }
                const mountStorageService = {
                    githubAccessToken: "ORG-TOKEN",
                    appConfig: {
                        systemConfig: {
                            challenge: {
                                passThreshold: 0.5,
                            },
                        },
                    },
                }
                const aiEntitlementService = {
                    resolve: jest.fn(),
                    consume: jest.fn(),
                    assertNotOverQuota: jest.fn().mockResolvedValue(undefined),
                }
                const gradingRetrievalService = {
                    // no real RAG chunk/embed/retrieve — the harness feeds the whole
                    // fixture repo straight to the model via the human message excerpt
                    retrieveGradingExcerpt: jest.fn(),
                }
                const encryptionService = {
                    decrypt: jest.fn(),
                }

                const buildService = () => new ProcessGitSubmissionGradeStepService(
                    entityManager as never,
                    jobActionService as never,
                    {
                        log: jest.fn(),
                    } as never,
                    mountStorageService as never,
                    createHarnessInvoke(() => currentTier) as never,
                    aiEntitlementService as never,
                    new ChallengeEvaluationParseService(),
                    gradingRetrievalService as never,
                    encryptionService as never,
                )

                beforeEach(() => {
                    entityManager = makeEntityManagerMock()
                    // token-lookup findOne (EnrollmentEntity) → no stored token → org token path
                    entityManager.findOne.mockResolvedValue(null)
                    // quota-debit findOneOrFail (EnrollmentEntity) → resolvable user
                    entityManager.findOneOrFail.mockResolvedValue({
                        id: "enroll-1",
                        userId: "user-1",
                    })
                })

                /** Grade `files` as a git submission of CHALLENGE 1 and return the captured result. */
                const runGrade = async (
                    files: Array<{ path: string; content: string }>,
                    excerptOverride?: string,
                ): Promise<{ evaluation: ChallengeEvaluation; passed: boolean }> => {
                    loaderLoadMock.mockResolvedValue(
                        files.map((file) => ({
                            pageContent: file.content,
                            metadata: {
                                source: file.path,
                            },
                            id: file.path,
                        })),
                    )
                    // the excerpt IS the fixture repo, verbatim — no real vector retrieval
                    gradingRetrievalService.retrieveGradingExcerpt.mockResolvedValue({
                        excerpt: excerptOverride ?? files
                            .map((file) => `// ${file.path}\n${file.content}`)
                            .join("\n\n"),
                    })

                    const service = buildService()
                    await service.process(makeContext(CHALLENGE_1,
                        CHALLENGE_1_SUBMISSION))

                    const call = jobActionService.saveExecutionResult.mock.calls
                        .map(([arg]: [{ key: string; executionResult: unknown }]) => arg)
                        .find((arg: { key: string }) => arg.key === "grade")
                    jobActionService.saveExecutionResult.mockClear()

                    return call?.executionResult as { evaluation: ChallengeEvaluation; passed: boolean }
                }

                const GIT_CASES: Array<GradeCase & { files: Array<{ path: string; content: string }> }> = [
                    {
                        name: "correct, well-structured submission (real challenge 0-order-inventory-cross-module-di-easy) → plausibly-high score, evidence-based feedback",
                        tier: "high",
                        files: GIT_PASS_FILES,
                        rubric: [
                            `The output is a JSON ChallengeEvaluation for a submission of the REAL StarCi Academy challenge "${CHALLENGE_1_TITLE}".`,
                            "The submission correctly implements the CRITICAL requirement — OrderService receives InventoryService via",
                            "constructor injection (no manual `new InventoryService()`), InventoryService.reserveStock subtracts from a",
                            "per-SKU stock of 100, and POST /orders returns {orderId, productId, reservedQty} with orderId a real UUID v4",
                            "from crypto.randomUUID() — AND satisfies the structural approach requirement (InventoryModule exports",
                            "InventoryService, OrderModule imports it instead of re-registering it) AND ships a README with the 6 required",
                            "sections. A good evaluation gives it a plausibly HIGH score (every criterion, including the critical one,",
                            "should read as met) and feedback/details that reference the actual submitted files (the constructor injection",
                            "in order.service.ts, the exports/imports wiring, the README sections), not generic praise. Pass if the score",
                            "is plausibly-high and the feedback is concrete.",
                        ].join(" "),
                    },
                    {
                        name: "broken/empty submission (real challenge 0-order-inventory-cross-module-di-easy) → plausibly-low score, concrete named failures",
                        tier: "mid",
                        files: GIT_FAIL_FILES,
                        rubric: [
                            `The output is a JSON ChallengeEvaluation for a submission of the REAL StarCi Academy challenge "${CHALLENGE_1_TITLE}"`,
                            "that does NOT implement the challenge at all — no InventoryService, no POST /orders endpoint, just a",
                            "placeholder file and a README saying it's unfinished. A good evaluation gives it a plausibly LOW",
                            "(near-zero) score, since the CRITICAL requirement — DI-based reuse of InventoryService with the correct",
                            "POST /orders contract — is clearly NOT MET, AND feedback/details that name CONCRETE missing pieces (no",
                            "InventoryService, no order endpoint, no dependency injection) rather than vague boilerplate. Pass if the",
                            "score is plausibly-low and the feedback names concrete gaps.",
                        ].join(" "),
                    },
                    {
                        name: "partial submission — critical DI/contract met, module boundary + README missed (real challenge 0-order-inventory-cross-module-di-easy) → mid score, feedback distinguishes",
                        tier: "low",
                        files: GIT_PARTIAL_FILES,
                        rubric: [
                            `The output is a JSON ChallengeEvaluation for a submission of the REAL StarCi Academy challenge "${CHALLENGE_1_TITLE}"`,
                            "that gets the CORE mechanics right — OrderService genuinely injects InventoryService via its constructor",
                            "(no `new`), reserveStock and POST /orders behave correctly, and orderId is a genuine UUID v4 — so the",
                            "CRITICAL requirement should read as MET. However the submission does NOT respect the required module",
                            "boundary (OrderModule re-registers InventoryService as its own provider instead of importing",
                            "InventoryModule and reusing its export) and ships NO README at all (missing the required 6 sections). A",
                            "good evaluation reflects this split: it should NOT be near-zero (the critical mechanism genuinely works)",
                            "and should NOT be near-max (the module-boundary and README criteria are missed), landing in a clearly",
                            "MIDDLE band, with feedback/details naming BOTH what works (constructor injection, correct contract) AND",
                            "what's missing (provider re-registration instead of module import, no README) rather than one blanket",
                            "verdict. Pass if the score is plausibly mid-range (neither near-zero nor near-max) and the feedback",
                            "distinguishes met vs unmet criteria.",
                        ].join(" "),
                    },
                ]

                it.each(GIT_CASES)(
                    "$name (tier=$tier)",
                    async ({
                        tier,
                        files,
                        rubric,
                    }) => {
                        currentTier = tier
                        const result = await runGrade(files)
                        await assertAndJudge(result.evaluation,
                            rubric)
                    },
                )

                // ── discrimination: a real passing submission must strictly outscore a real failing one ──
                it("ranks the PASSING submission strictly above the FAILING one for the SAME real challenge",
                    async () => {
                        currentTier = "high"
                        const passing = await runGrade(GIT_PASS_FILES)
                        const failing = await runGrade(GIT_FAIL_FILES)

                        expect(Number.isFinite(passing.evaluation.score)).toBe(true)
                        expect(Number.isFinite(failing.evaluation.score)).toBe(true)
                        expect(passing.evaluation.score).toBeGreaterThan(failing.evaluation.score)
                    })

                // ── missing/placeholder repo: the loader returns nothing → low/failing grade, not a crash ──
                it("grades an EMPTY/placeholder repo to a low, failing result instead of crashing",
                    async () => {
                        currentTier = "mid"
                        const result = await runGrade([],
                            "")

                        expect(result.passed).toBe(false)
                        await assertAndJudge(result.evaluation,
                            [
                                `The output is a JSON ChallengeEvaluation for a submission of the REAL StarCi Academy challenge "${CHALLENGE_1_TITLE}"`,
                                "whose repository excerpt was completely EMPTY — no files were loaded at all. A good evaluation",
                                "reflects that nothing was submitted: a plausibly very LOW (near-zero) score, and feedback/details",
                                "that acknowledge the absence of any submitted code (e.g. no files found / empty repository) rather",
                                "than fabricating evidence of code that was never provided. Pass if the score is plausibly very-low",
                                "and the feedback does not hallucinate specifics about code that isn't there.",
                            ].join(" "))
                    })
            })

        describe("Google Docs submission (ProcessGoogleDocsSubmissionGradeStepService)",
            () => {
                let entityManager: EntityManagerMock

                const jobActionService = {
                    increaseJob: jest.fn(),
                    saveExecutionResult: jest.fn(),
                    loadExecutionResult: jest.fn().mockResolvedValue(undefined),
                    failJob: jest.fn(),
                }
                const mountStorageService = {
                    appConfig: {
                        systemConfig: {
                            challenge: {
                                passThreshold: 0.5,
                            },
                        },
                    },
                }
                const aiEntitlementService = {
                    resolve: jest.fn(),
                    consume: jest.fn(),
                    assertNotOverQuota: jest.fn().mockResolvedValue(undefined),
                }
                const gradingRetrievalService = {
                    retrieveGradingExcerpt: jest.fn(),
                }
                const googleDriverApiService = {
                    fetchGoogleDocsText: jest.fn(),
                }

                const buildService = () => new ProcessGoogleDocsSubmissionGradeStepService(
                    entityManager as never,
                    jobActionService as never,
                    {
                        log: jest.fn(),
                    } as never,
                    mountStorageService as never,
                    createHarnessInvoke(() => currentTier) as never,
                    aiEntitlementService as never,
                    googleDriverApiService as never,
                    new ChallengeEvaluationParseService(),
                    gradingRetrievalService as never,
                )

                beforeEach(() => {
                    entityManager = makeEntityManagerMock()
                    entityManager.findOneOrFail.mockResolvedValue({
                        id: "enroll-1",
                        userId: "user-1",
                    })
                    entityManager.transaction.mockImplementation(
                        async (cb: (em: unknown) => Promise<unknown>) => cb(entityManager),
                    )
                })

                /** Grade `docText` as a Google-Docs submission of CHALLENGE 2 and return the captured result. */
                const runGrade = async (
                    docText: string,
                ): Promise<{ evaluation: ChallengeEvaluation; passed: boolean }> => {
                    googleDriverApiService.fetchGoogleDocsText.mockResolvedValue({
                        text: docText,
                    })
                    // the excerpt IS the fixture doc text, verbatim — no real vector retrieval
                    gradingRetrievalService.retrieveGradingExcerpt.mockResolvedValue({
                        excerpt: docText,
                    })

                    const service = buildService()
                    await service.process(makeContext(CHALLENGE_2,
                        CHALLENGE_2_SUBMISSION))

                    const call = jobActionService.saveExecutionResult.mock.calls
                        .map(([arg]: [{ key: string; executionResult: unknown }]) => arg)
                        .find((arg: { key: string }) => arg.key === "grade")
                    jobActionService.saveExecutionResult.mockClear()

                    return call?.executionResult as { evaluation: ChallengeEvaluation; passed: boolean }
                }

                const GDOCS_CASES: Array<GradeCase & { docText: string }> = [
                    {
                        name: "thorough design write-up (real challenge 1-custom-provider-dynamic-module-medium) → plausibly-high score, content-based feedback",
                        tier: "high",
                        docText: GDOCS_PASS_TEXT,
                        rubric: [
                            `The output is a JSON ChallengeEvaluation for a write-up of the REAL StarCi Academy challenge "${CHALLENGE_2_TITLE}".`,
                            "The write-up correctly and specifically describes the CRITICAL requirement — a Store injection token",
                            "resolved by a useFactory custom provider, KvService injecting Store + STORE_OPTIONS via @Inject (never",
                            "`new`), and POST /kv returning {impl, prefix, ttlSec, storedKey} with storedKey = `${prefix}:${key}` and",
                            "impl reflecting the active forRoot config — AND the structural approach requirement (a dedicated",
                            "STORE_OPTIONS provider wired through DI, not scattered env reads) AND mentions the README's 6 sections.",
                            "A good evaluation gives it a plausibly HIGH score (the criteria should read as met/well-addressed) and",
                            "feedback/details that reference the actual content of the write-up (the token, the factory, the exact",
                            "storedKey formula), not generic platitudes. Pass if the score is plausibly-high and the feedback is",
                            "concrete.",
                        ].join(" "),
                    },
                    {
                        name: "vague, contentless write-up (real challenge 1-custom-provider-dynamic-module-medium) → plausibly-low score, concrete named gaps",
                        tier: "mid",
                        docText: GDOCS_FAIL_TEXT,
                        rubric: [
                            `The output is a JSON ChallengeEvaluation for a write-up of the REAL StarCi Academy challenge "${CHALLENGE_2_TITLE}"`,
                            "that never actually describes the Store injection token, the useFactory dynamic-module wiring, or the",
                            "exact POST /kv contract (storedKey format, impl field) — just filler sentences admitting uncertainty. A",
                            "good evaluation gives it a plausibly LOW score (the CRITICAL outcome criterion should read as NOT MET) AND",
                            "feedback/details that name CONCRETE missing content (e.g. no token/factory described, no storedKey/impl",
                            "contract) rather than vague boilerplate. Pass if the score is plausibly-low and the feedback names concrete",
                            "gaps.",
                        ].join(" "),
                    },
                    {
                        name: "partial write-up — token/factory + rough contract described, options wired via env not DI, no README mention (real challenge 1-custom-provider-dynamic-module-medium) → mid score, feedback distinguishes",
                        tier: "low",
                        docText: GDOCS_PARTIAL_TEXT,
                        rubric: [
                            `The output is a JSON ChallengeEvaluation for a write-up of the REAL StarCi Academy challenge "${CHALLENGE_2_TITLE}"`,
                            "that DOES describe the core mechanism reasonably — a Store injection token resolved by a factory that",
                            "picks the impl, KvService applying the prefix and actually writing to the store, POST /kv exposing the",
                            "active impl — so the CRITICAL requirement should read as roughly MET. However it explicitly describes",
                            "options being read from scattered environment variables inside KvService and the store implementations,",
                            "rather than a dedicated STORE_OPTIONS DI provider (violating the approach requirement), and it never",
                            "mentions the README or the config-switch verification (missing the non-critical outcome requirement). A",
                            "good evaluation reflects this split with a MIDDLE-band score (neither near-zero nor near-max) and",
                            "feedback/details naming BOTH what's described well (the token/factory mechanism) AND what's missing (env",
                            "vars instead of a DI options provider, no README/switch verification) rather than one blanket verdict.",
                            "Pass if the score is plausibly mid-range and the feedback distinguishes met vs unmet criteria.",
                        ].join(" "),
                    },
                ]

                it.each(GDOCS_CASES)(
                    "$name (tier=$tier)",
                    async ({
                        tier,
                        docText,
                        rubric,
                    }) => {
                        currentTier = tier
                        const result = await runGrade(docText)
                        await assertAndJudge(result.evaluation,
                            rubric)
                    },
                )

                // ── discrimination: a real passing write-up must strictly outscore a real failing one ──
                it("ranks the PASSING write-up strictly above the FAILING one for the SAME real challenge",
                    async () => {
                        currentTier = "high"
                        const passing = await runGrade(GDOCS_PASS_TEXT)
                        const failing = await runGrade(GDOCS_FAIL_TEXT)

                        expect(Number.isFinite(passing.evaluation.score)).toBe(true)
                        expect(Number.isFinite(failing.evaluation.score)).toBe(true)
                        expect(passing.evaluation.score).toBeGreaterThan(failing.evaluation.score)
                    })
            })
    })
