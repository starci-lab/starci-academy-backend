import {
    readFileSync,
} from "node:fs"
import {
    join,
} from "node:path"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    Document,
} from "@langchain/core/documents"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    GradingRetrievalService,
} from "@modules/integrations/rag/grading-rag-retrieval.service"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    ProjectEvaluation,
} from "@modules/integrations/bullmq/types/evaluation/project-evaluation"
import {
    ProjectEvaluationParseService,
} from "@features/api/processors/ai/shared/project-evaluation/project-evaluation-parse.service"
import type {
    ReviewMilestoneTaskGradeResult,
} from "@features/api/processors/ai/review-milestone-task/types/grade"
import {
    HarnessInvokeService,
} from "@tests/helpers/harness-invoke.service"
import {
    JudgeService,
} from "@tests/helpers/judge.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"
import {
    readVolumeDoc,
    volumeExists,
} from "@tests/helpers/volume"
import type {
    HarnessTierName,
} from "@tests/helpers/models"

/** Params for the `GradingRetrievalService.retrieveGradingExcerpt` mock. */
interface RetrieveGradingExcerptParams {
    documents: Array<Document>
}

/**
 * Stub `GithubRepoLoader` so no real clone/network happens -- every instance's
 * `.load()` resolves the docs the current case programs via `loaderLoadMock`.
 * Mirrors `review-milestone-task-grade-step.service.spec.ts`.
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

/**
 * `GradingRetrievalService` (real chunk/embed/Qdrant retrieval) is mocked out below --
 * that infra isn't what this harness is judging -- but importing its class still pulls
 * in `@langchain/qdrant` transitively through the `@modules/rag` barrel. Stub it the
 * same way the unit spec does so no real Qdrant client construction is attempted.
 */
jest.mock(
    "@langchain/qdrant",
    () => ({
        QdrantVectorStore: Object.assign(
            jest.fn(),
            {
                fromExistingCollection: jest.fn(),
                fromDocuments: jest.fn(),
            },
        ),
    }),
    {
        virtual: true,
    },
)

// Imported AFTER the mocks above so its transitive GithubRepoLoader/qdrant imports
// resolve to the stubs instead of hitting the network or a real vector store.
import {
    ReviewMilestoneTaskGradeStepService,
} from "@features/api/processors/ai/review-milestone-task/steps/review-milestone-task-grade-step.service"

/** Minimum judge score a produced evaluation must reach to count as passing. */
const PASS_SCORE = 60

/** Connection name the SUT's `@InjectPrimaryPostgreSQLEntityManager()` resolves to. */
const POSTGRESQL_PRIMARY = "primary"

/** The tier the harness routes THIS case's grading model call to. */
let currentTier: HarnessTierName = "high"

/** The `MilestoneTaskEntity`-shaped fixture the CURRENT case's `findOneOrFail` resolves. */
let currentTaskFixture: unknown

const ENROLLMENT_ID = "harness-enrollment"
const USER_ID = "harness-user"

// ─────────────────────────────────────────────────────────────────────────────
// Grounding: read REAL capstone tasks straight out of the `.volume` SSOT mount.
//
// A task mount doc (`.volume/data/courses/<course>/milestones/<milestone>/tasks/<task>/en.md`)
// is one flat `readVolumeDoc`-parseable file for its TOP-LEVEL scalar fields (title,
// description, verified, maxScore, ...) -- `readVolumeDoc` handles those directly. But its
// `# criterias` field is itself a NESTED markdown tree (`## <langIndex>` -> `### lang` /
// `### outcome` / `### approach` -> `#### <criterionIndex>` -> `##### body` / `##### score` /
// `##### critical`), which the app's real ingestion (`MilestoneTaskParserService`, via
// `ExtractJsonFromMdService`) parses with a full heading-tree extractor. `readVolumeDoc`'s
// flat SEP-splitter can't recover that structure, so this harness carries its own tiny
// SEP-anchored extractor (below) -- reading the SAME raw file, the SAME `SEP` marker, no
// fabricated text -- to pull out the real outcome/approach criteria for one language.
// ─────────────────────────────────────────────────────────────────────────────

/** The StarCi authoring separator (mirrors `volume.ts`'s private `SEP`; not exported there). */
const SEP = "<!-- @starci/seperator -->"

/** Root of the SSOT content mount (mirrors `volume.ts`'s `VOLUME_DATA`). */
const volumeDataPath = (relDir: string): string => join(process.cwd(),
    ".volume",
    "data",
    relDir,
    "en.md")

/** One `<header>\n<SEP>\n<value>\n<SEP>` field read starting from `fromIndex`. */
interface FieldRead {
    /** The trimmed value between the two separators. */
    value: string
    /** Index right after the closing separator -- where the NEXT field search should resume. */
    nextIndex: number
}

/**
 * Reads the value of the first `header` occurrence at/after `fromIndex`, delimited by the
 * `SEP` markers that bracket it in the mount's authoring format. Throws when the header (or
 * its surrounding separators) is missing -- a harness should fail loudly on a malformed real
 * doc, not silently grade an empty rubric.
 */
const fieldAfter = (
    text: string,
    header: string,
    fromIndex = 0,
): FieldRead => {
    const headerIndex = text.indexOf(header,
        fromIndex)
    if (headerIndex === -1) {
        throw new Error(`milestone-grading harness: header not found: "${header}" (from index ${fromIndex})`)
    }
    const openSep = text.indexOf(SEP,
        headerIndex + header.length)
    if (openSep === -1) {
        throw new Error(`milestone-grading harness: opening separator not found after "${header}"`)
    }
    const closeSep = text.indexOf(SEP,
        openSep + SEP.length)
    if (closeSep === -1) {
        throw new Error(`milestone-grading harness: closing separator not found after "${header}"`)
    }
    return {
        value: text.slice(openSep + SEP.length,
            closeSep).trim(),
        nextIndex: closeSep + SEP.length,
    }
}

/** One real grading criterion read off the mount (`##### body` / `##### score` / `##### critical`). */
interface RealCriterion {
    body: string
    score: number
    critical: boolean
}

/** Repeatedly read `##### body` / `##### score` / `##### critical` triples until none remain. */
const parseCriteriaSection = (
    section: string,
): Array<RealCriterion> => {
    const criteria: Array<RealCriterion> = []
    let index = 0
    for (;;) {
        if (section.indexOf("##### body",
            index) === -1) {
            break
        }
        const body = fieldAfter(section,
            "##### body",
            index)
        const score = fieldAfter(section,
            "##### score",
            body.nextIndex)
        const critical = fieldAfter(section,
            "##### critical",
            score.nextIndex)
        criteria.push({
            body: body.value,
            score: Number(score.value),
            critical: critical.value === "true",
        })
        index = critical.nextIndex
    }
    return criteria
}

/**
 * Reads the REAL outcome + approach grading criteria for one language block (`## N` -> `### lang`
 * matching `lang`) out of a real task's `en.md` mount doc. Bounds the approach section to the
 * CURRENT language block (stopping at the next `## ` block or the trailing `# difficulty`
 * heading) so it never bleeds into the next language's criteria.
 */
const readRealTaskCriteria = (
    relDir: string,
    lang: string,
): { outcome: Array<RealCriterion>; approach: Array<RealCriterion> } => {
    const raw = readFileSync(volumeDataPath(relDir),
        "utf8")

    let searchFrom = 0
    let langBlockIndex = -1
    for (;;) {
        const langField = fieldAfter(raw,
            "### lang",
            searchFrom)
        if (langField.value === lang) {
            langBlockIndex = langField.nextIndex
            break
        }
        searchFrom = langField.nextIndex
    }

    const outcomeStart = raw.indexOf("### outcome",
        langBlockIndex)
    const approachStart = raw.indexOf("### approach",
        outcomeStart)
    const nextLangBlock = raw.indexOf("\n## ",
        approachStart)
    const difficultyHeading = raw.indexOf("\n# difficulty",
        approachStart)
    let approachEnd = raw.length
    if (nextLangBlock !== -1) {
        approachEnd = Math.min(approachEnd,
            nextLangBlock)
    }
    if (difficultyHeading !== -1) {
        approachEnd = Math.min(approachEnd,
            difficultyHeading)
    }

    return {
        outcome: parseCriteriaSection(raw.slice(outcomeStart,
            approachStart)),
        approach: parseCriteriaSection(raw.slice(approachStart,
            approachEnd)),
    }
}

/** Pull the bolded lead-in out of a real criterion body for a short legacy-style display `text`. */
const shortText = (body: string): string => {
    const bold = body.match(/\*\*(.*?)\*\*/)
    return (bold?.[1] ?? body.slice(0,
        80)).trim()
}

/** Params for the local `buildV2TaskFixture` helper. */
interface BuildV2TaskFixtureParams {
    id: string
    relDir: string
    lang: string
}

/**
 * Build a SCHEMA V2 `MilestoneTaskEntity`-shaped fixture from a REAL task mount: `title` +
 * `maxScore` come straight off `readVolumeDoc`'s flat fields, `verified` is the REAL date (so
 * the SUT takes the outcome/approach rubric path), and `outcomeCriteria`/`approachCriteria`
 * carry the REAL per-criterion body/score/critical read by {@link readRealTaskCriteria}.
 */
const buildV2TaskFixture = (
    {
        id,
        relDir,
        lang,
    }: BuildV2TaskFixtureParams,
) => {
    const doc = readVolumeDoc(relDir)
    const real = readRealTaskCriteria(relDir,
        lang)
    return {
        id,
        title: doc.fields.title,
        verified: new Date(doc.fields.verified),
        maxScore: Number(doc.fields.maxScore),
        criterias: [],
        outcomeCriteria: real.outcome.map((criterion, orderIndex) => ({
            orderIndex,
            score: criterion.score,
            critical: criterion.critical,
            langs: [
                {
                    lang,
                    body: criterion.body,
                },
            ],
        })),
        approachCriteria: real.approach.map((criterion, orderIndex) => ({
            orderIndex,
            score: criterion.score,
            critical: criterion.critical,
            langs: [
                {
                    lang,
                    body: criterion.body,
                },
            ],
        })),
    }
}

/** Params for the local `buildLegacyTaskFixture` helper. */
interface BuildLegacyTaskFixtureParams {
    id: string
    relDir: string
    lang: string
}

/**
 * Build a LEGACY (`verified: null`) `MilestoneTaskEntity`-shaped fixture from the SAME real
 * task mount, reshaping its real outcome+approach criteria into the legacy `criterias`
 * (`text`/`promptText`/`score`) schema. No task in `.volume` is actually legacy -- every mount
 * doc under `courses/*\/milestones/*\/tasks/*` carries `# verified` (confirmed by grepping all
 * 300 fullstack/system-design/devops task docs) -- so this is how the SCHEMA V1 (legacy) path
 * gets exercised against real rubric prose instead of a fabricated one: same real criteria
 * text, reshaped into the older schema the grade step still supports.
 */
const buildLegacyTaskFixture = (
    {
        id,
        relDir,
        lang,
    }: BuildLegacyTaskFixtureParams,
) => {
    const doc = readVolumeDoc(relDir)
    const real = readRealTaskCriteria(relDir,
        lang)
    const flattened = [
        ...real.outcome,
        ...real.approach,
    ]
    return {
        id,
        title: doc.fields.title,
        verified: null,
        maxScore: Number(doc.fields.maxScore),
        outcomeCriteria: [],
        approachCriteria: [],
        criterias: flattened.map((criterion, orderIndex) => ({
            id: `${id}-criterion-${orderIndex}`,
            orderIndex,
            text: shortText(criterion.body),
            promptText: criterion.body,
            score: criterion.score,
        })),
    }
}

/** Real capstone task mount paths this harness grounds its cases in. */
const TASK_A_DIR = "courses/0-fullstack-mastery/milestones/0-project-foundation/tasks/0-clean-architecture-and-health"
const TASK_B_DIR = "courses/0-fullstack-mastery/milestones/2-authentication-and-authorization/tasks/1-jwt-register-and-login"
const LANG = "typescript"

/** Skip the whole suite (with a clear message) when the SSOT mount is absent. */
const HAVE_VOLUME = volumeExists(TASK_A_DIR) && volumeExists(TASK_B_DIR)
const describeOrSkip = HAVE_VOLUME
    ? describe
    : describe.skip

/** Render `{ path, content }` submission files into the `Document` shape `GithubRepoLoader` "loads". */
const toDocuments = (
    files: Array<{ path: string; content: string }>,
): Array<Document> =>
    files.map((file) => ({
        pageContent: file.content,
        metadata: {
            source: file.path,
        },
        id: file.path,
    } as Document))

/** Render the documents `GithubRepoLoader` "loaded" back into a plain excerpt string,
 * the same shape `GradingRetrievalService.retrieveGradingExcerpt` hands to the prompt.
 * This keeps the REAL per-case submitted code flowing into the grading prompt even
 * though the chunk/embed/retrieve infra itself is mocked out. */
const excerptFromDocuments = (documents: Array<Document>): string =>
    documents
        .map((doc) => `# ${String(doc.metadata?.source ?? doc.id)}\n${doc.pageContent}`)
        .join("\n\n")

// ─────────────────────────────────────────────────────────────────────────────
// TASK A submissions -- real task: "Scaffold StarCi Shop Backend + Health Endpoint"
// (three-layer http->domain->data architecture + a real GET /health liveness probe).
// ─────────────────────────────────────────────────────────────────────────────

/** MEETS the real brief: correct layering, working /health, env-driven port, README evidence. */
const TASK_A_MEETS_FILES = [
    {
        path: "src/data/db.repository.ts",
        content: [
            "import { Injectable } from \"@nestjs/common\"",
            "import { DataSource } from \"typeorm\"",
            "",
            "@Injectable()",
            "export class DbRepository {",
            "  constructor(private readonly dataSource: DataSource) {}",
            "",
            "  async ping(): Promise<boolean> {",
            "    await this.dataSource.query(\"SELECT 1\")",
            "    return true",
            "  }",
            "}",
        ].join("\n"),
    },
    {
        path: "src/domain/health.service.ts",
        content: [
            "import { Injectable } from \"@nestjs/common\"",
            "import { DbRepository } from \"../data/db.repository\"",
            "",
            "@Injectable()",
            "export class HealthService {",
            "  constructor(private readonly repo: DbRepository) {}",
            "",
            "  async check(): Promise<{ status: string }> {",
            "    await this.repo.ping()",
            "    return { status: \"ok\" }",
            "  }",
            "}",
        ].join("\n"),
    },
    {
        path: "src/http/health.controller.ts",
        content: [
            "import { Controller, Get } from \"@nestjs/common\"",
            "import { HealthService } from \"../domain/health.service\"",
            "",
            "@Controller(\"health\")",
            "export class HealthController {",
            "  constructor(private readonly service: HealthService) {}",
            "",
            "  @Get()",
            "  check() {",
            "    return this.service.check()",
            "  }",
            "}",
        ].join("\n"),
    },
    {
        path: "src/main.ts",
        content: [
            "import { NestFactory } from \"@nestjs/core\"",
            "import { AppModule } from \"./app.module\"",
            "",
            "async function bootstrap() {",
            "  const app = await NestFactory.create(AppModule)",
            "  app.enableShutdownHooks()",
            "  const port = Number(process.env.PORT ?? 3000)",
            "  await app.listen(port)",
            "}",
            "bootstrap()",
        ].join("\n"),
    },
    {
        path: "README.md",
        content: [
            "# StarCi Shop Backend",
            "",
            "## Run",
            "npm install && npm run start",
            "",
            "## Smoke test",
            "$ curl -i localhost:3000/health",
            "HTTP/1.1 200 OK",
            "Content-Type: application/json",
            "",
            "{\"status\":\"ok\"}",
        ].join("\n"),
    },
]

/** PARTIAL: meets BOTH critical criteria (layering + a working /health) but fails three
 * non-critical ones -- hard-coded port, no graceful shutdown, no README evidence. */
const TASK_A_PARTIAL_FILES = [
    TASK_A_MEETS_FILES[0],
    TASK_A_MEETS_FILES[1],
    TASK_A_MEETS_FILES[2],
    {
        path: "src/main.ts",
        content: [
            "import { NestFactory } from \"@nestjs/core\"",
            "import { AppModule } from \"./app.module\"",
            "",
            "async function bootstrap() {",
            "  const app = await NestFactory.create(AppModule)",
            "  // hard-coded — ignores the PORT env var; no enableShutdownHooks()",
            "  await app.listen(3000)",
            "}",
            "bootstrap()",
        ].join("\n"),
    },
]

/** MISSES the real brief entirely: no layering, no /health route, hard-coded port, no README. */
const TASK_A_MISSES_FILES = [
    {
        path: "src/index.ts",
        content: [
            "// everything in one file — no http/domain/data separation",
            "import express from \"express\"",
            "const app = express()",
            "",
            "app.get(\"/\", (req, res) => {",
            "  res.send(\"StarCi Shop backend is running\")",
            "})",
            "",
            "// TODO: add a real /health endpoint",
            "app.listen(3000)",
        ].join("\n"),
    },
]

interface GradeCase {
    /** jest row label. */
    name: string
    /** tier the grading model runs at. */
    tier: HarnessTierName
    /** the "loaded" GitHub repo files for this submission. */
    files: Array<{ path: string; content: string }>
    /** what a good grade for this submission must satisfy. */
    rubric: string
}

const TASK_A_CASES: Array<GradeCase> = [
    {
        name: "submission MEETS the real brief → plausibly-high score, grounded feedback, passed trends true",
        tier: "high",
        files: TASK_A_MEETS_FILES,
        rubric: [
            "The output is a grading evaluation of a submission that correctly implements the REAL",
            "capstone task \"Scaffold StarCi Shop Backend + Health Endpoint\": `GET /health` returns",
            "`200` with JSON `{\"status\":\"ok\"}`, the code is split into three layers (an http",
            "controller → a domain service → a data repository) with dependencies pointing inward",
            "only, the port is read from `process.env.PORT`, `app.enableShutdownHooks()` is called for",
            "graceful shutdown, and a README documents a real `curl -i` smoke test showing the `200`",
            "and the JSON body. A good evaluation gives it a plausibly HIGH score (roughly 65-100 on a",
            "0-100 scale) AND feedback that references CONCRETE evidence from the submission (the",
            "three files/folders, the `/health` response, the env-driven port, the README's curl",
            "output), not generic boilerplate. `passed` should read as `true`. Pass if the score is",
            "plausibly high, the feedback is grounded in the real criteria, and passed is true.",
        ].join(" "),
    },
    {
        name: "submission MISSES the real brief → plausibly-low score, feedback names concrete gaps",
        tier: "mid",
        files: TASK_A_MISSES_FILES,
        rubric: [
            "The output is a grading evaluation of a submission that does NOT meet the REAL capstone",
            "task's brief: everything lives in one file with no http/domain/data separation, there is",
            "no working `/health` endpoint, the port is hard-coded, and there is no README evidence.",
            "A good evaluation gives it a plausibly LOW score (roughly 0-30 on a 0-100 scale) AND",
            "feedback that names CONCRETE missing pieces tied to the REAL criteria (missing `/health`",
            "route returning JSON, no layered http/domain/data architecture, no env-driven port, no",
            "documented smoke test) rather than vague platitudes. `passed` should read as `false`.",
            "Pass if the score is plausibly low for this off-brief submission and the feedback names",
            "concrete real gaps.",
        ].join(" "),
    },
    {
        name: "submission PARTIALLY meets the real brief (criticals pass, 3 non-criticals fail) → mid score, feedback distinguishes pass vs fail",
        tier: "mid",
        files: TASK_A_PARTIAL_FILES,
        rubric: [
            "The output is a grading evaluation of a submission that MEETS the two CRITICAL criteria",
            "of the REAL task (a real three-layer http→domain→data architecture with correct inward",
            "dependencies, AND `GET /health` returning `200` JSON) but FAILS three non-critical",
            "criteria: the port is hard-coded rather than read from the environment, there is no",
            "graceful-shutdown hook (`enableShutdownHooks`), and there is no README with a real",
            "smoke-test transcript. A good evaluation reflects the critical items being met (the total",
            "should NOT be zeroed out the way it would be for a failed critical) while still marking",
            "the hard-coded port, missing shutdown hook, and missing README as unmet, landing on a MID",
            "score (roughly 35-75 on a 0-100 scale, clearly not near-zero and not near-max) with",
            "feedback that explicitly distinguishes what passed (the layering, the `/health` endpoint)",
            "from what failed (hard-coded port, no shutdown hook, no README). Pass if the score is",
            "plausibly mid-range and the feedback clearly distinguishes passed vs failed criteria.",
        ].join(" "),
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// TASK B submission -- real task: "Let Shoppers Sign Up & Sign In (JWT)"
// (bcrypt hash -> compare-before-sign -> short-lived signed JWT). ONE solid submission,
// graded twice: once through the REAL SCHEMA V2 (verified) path, once through the
// LEGACY (verified: null) path built from the SAME real criteria text (see
// `buildLegacyTaskFixture`) -- proving both schema paths parse and grade sensibly.
// ─────────────────────────────────────────────────────────────────────────────

const TASK_B_FILES = [
    {
        path: "src/auth/user.entity.ts",
        content: [
            "import { Entity, PrimaryGeneratedColumn, Column } from \"typeorm\"",
            "",
            "@Entity()",
            "export class User {",
            "  @PrimaryGeneratedColumn(\"uuid\") id: string",
            "  @Column({ unique: true }) email: string",
            "  @Column() passwordHash: string",
            "}",
        ].join("\n"),
    },
    {
        path: "src/auth/auth.service.ts",
        content: [
            "import { Injectable, UnauthorizedException } from \"@nestjs/common\"",
            "import * as bcrypt from \"bcrypt\"",
            "import { JwtService } from \"@nestjs/jwt\"",
            "import { UsersRepository } from \"./users.repository\"",
            "",
            "@Injectable()",
            "export class AuthService {",
            "  constructor(",
            "    private readonly users: UsersRepository,",
            "    private readonly jwt: JwtService,",
            "  ) {}",
            "",
            "  async register(email: string, password: string) {",
            "    const passwordHash = await bcrypt.hash(password, 10)",
            "    const user = await this.users.create({ email, passwordHash })",
            "    return { id: user.id, email: user.email }",
            "  }",
            "",
            "  async login(email: string, password: string) {",
            "    const user = await this.users.findByEmail(email)",
            "    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {",
            "      throw new UnauthorizedException(\"invalid credentials\")",
            "    }",
            "    const accessToken = await this.jwt.signAsync(",
            "      { sub: user.id },",
            "      { expiresIn: \"15m\" },",
            "    )",
            "    return { accessToken }",
            "  }",
            "}",
        ].join("\n"),
    },
    {
        path: "src/auth/auth.controller.ts",
        content: [
            "import { Body, Controller, Post } from \"@nestjs/common\"",
            "import { AuthService } from \"./auth.service\"",
            "",
            "@Controller(\"auth\")",
            "export class AuthController {",
            "  constructor(private readonly authService: AuthService) {}",
            "",
            "  @Post(\"register\")",
            "  register(@Body() body: { email: string; password: string }) {",
            "    return this.authService.register(body.email, body.password)",
            "  }",
            "",
            "  @Post(\"login\")",
            "  login(@Body() body: { email: string; password: string }) {",
            "    return this.authService.login(body.email, body.password)",
            "  }",
            "}",
        ].join("\n"),
    },
    {
        path: "src/auth/jwt.strategy.ts",
        content: [
            "import { Injectable } from \"@nestjs/common\"",
            "import { PassportStrategy } from \"@nestjs/passport\"",
            "import { ExtractJwt, Strategy } from \"passport-jwt\"",
            "",
            "@Injectable()",
            "export class JwtStrategy extends PassportStrategy(Strategy) {",
            "  constructor() {",
            "    super({",
            "      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),",
            "      ignoreExpiration: false,",
            "      secretOrKey: process.env.JWT_SECRET,",
            "    })",
            "  }",
            "",
            "  async validate(payload: { sub: string }) {",
            "    return { userId: payload.sub }",
            "  }",
            "}",
        ].join("\n"),
    },
    {
        path: "README.md",
        content: [
            "# Auth",
            "",
            "## Smoke test",
            "$ curl -s -X POST localhost:3000/auth/register -d '{\"email\":\"a@x.com\",\"password\":\"secret123\"}'",
            "{\"id\":\"...\",\"email\":\"a@x.com\"}",
            "",
            "$ curl -i -X POST localhost:3000/auth/login -d '{\"email\":\"a@x.com\",\"password\":\"secret123\"}'",
            "HTTP/1.1 200 OK",
            "{\"accessToken\":\"eyJhbGciOi...\"}",
            "",
            "$ curl -i -X POST localhost:3000/auth/login -d '{\"email\":\"a@x.com\",\"password\":\"WRONG\"}'",
            "HTTP/1.1 401 Unauthorized",
            "{\"message\":\"invalid credentials\"}",
        ].join("\n"),
    },
]

const TASK_B_SUBMISSION_RUBRIC = [
    "The output is a grading evaluation for a submission that correctly implements the REAL",
    "capstone task \"Let Shoppers Sign Up & Sign In (JWT)\": register hashes the password with",
    "bcrypt, login calls `bcrypt.compare` BEFORE signing anything and throws an unauthorized",
    "error (401) on a mismatch, a valid login returns a signed JWT with a short `expiresIn`, a",
    "`JwtStrategy` verifies the token signature on protected routes, the email column is unique,",
    "and a README documents a real register → login(200) → wrong-password(401) transcript. A",
    "good evaluation gives it a plausibly HIGH score (roughly 60-100 on a 0-100 scale) with",
    "feedback grounded in the actual submitted code (the compare-then-sign order, the bcrypt",
    "hash, the JwtStrategy, the README transcript), not generic praise. Pass if the score is",
    "plausibly high for a submission that meets the brief and the feedback is concrete.",
].join(" ")

interface SchemaCase {
    /** jest row label. */
    name: string
    /** tier the grading model runs at. */
    tier: HarnessTierName
    /** builds the `verified` (V2) or `verified: null` (legacy) fixture for this row. */
    buildFixture: () => unknown
    /** what a good grade for the shared submission must satisfy under THIS schema path. */
    rubric: string
}

const TASK_B_SCHEMA_CASES: Array<SchemaCase> = [
    {
        name: "SCHEMA V2 (real, verified) task parses via the outcome/approach rubric and grades sensibly",
        tier: "high",
        buildFixture: () => buildV2TaskFixture({
            id: "task-jwt-auth-v2",
            relDir: TASK_B_DIR,
            lang: LANG,
        }),
        rubric: TASK_B_SUBMISSION_RUBRIC,
    },
    {
        name: "LEGACY (verified: null, same real criteria reshaped) task parses via the criterias rubric and grades sensibly",
        tier: "mid",
        buildFixture: () => buildLegacyTaskFixture({
            id: "task-jwt-auth-legacy",
            relDir: TASK_B_DIR,
            lang: LANG,
        }),
        rubric: TASK_B_SUBMISSION_RUBRIC,
    },
]

/** Minimal job + payload context the grade step reads; `taskId` follows `currentTaskFixture`. */
const makeContext = () => ({
    job: {
        id: "job-milestone-harness",
        fencingToken: 1,
    },
    queueName: "review-milestone-task",
    payload: {
        taskId: (currentTaskFixture as { id: string }).id,
        enrollmentId: ENROLLMENT_ID,
        githubUrl: "https://github.com/harness/starci-shop",
        branch: "main",
        locale: Locale.En,
        lang: LANG,
        ai: {
        },
    },
}) as never

/**
 * LLM-eval harness for milestone / capstone-task review grading, grounded in REAL `.volume`
 * capstone tasks. Boots the REAL {@link ReviewMilestoneTaskGradeStepService} (V2 outcome/approach
 * rubric prompt, or the legacy `criterias` rubric) + {@link ProjectEvaluationParseService}
 * (STRICT-JSON parser), swaps only {@link AiInvokeService} for the tiered harness model
 * ({@link createHarnessInvoke}, `.secrets` auth), and judges the produced {@link ProjectEvaluation}.
 *
 * Grounds two REAL capstone tasks read straight from `.volume/data/courses/0-fullstack-mastery/`:
 * - `milestones/0-project-foundation/tasks/0-clean-architecture-and-health` ("Scaffold StarCi
 *   Shop Backend + Health Endpoint") -- MEETS / MISSES / PARTIAL / DISCRIMINATION cases, all
 *   SCHEMA V2 (real `verified` date).
 * - `milestones/2-authentication-and-authorization/tasks/1-jwt-register-and-login` ("Let
 *   Shoppers Sign Up & Sign In (JWT)") -- the SAME real criteria text graded once via the REAL
 *   SCHEMA V2 path and once via a LEGACY (`verified: null`) reshaping of that same text (no
 *   `.volume` task is actually legacy -- every mount doc sets `# verified` -- so this is how the
 *   older schema path gets exercised against real rubric prose).
 *
 * The step SAVES its result via `JobActionService.saveExecutionResult` rather than
 * returning it, so `JobActionService` is mocked and the `{ evaluation, passed, aiUsage }`
 * argument (`ReviewMilestoneTaskGradeResult`) is captured off that mock call.
 *
 * DB choice: mirrors `review-milestone-task-grade-step.service.spec.ts` -- a mocked
 * `EntityManager` (`makeEntityManagerMock`) resolving `currentTaskFixture`, no Testcontainers
 * Postgres.
 *
 * MOCKED: `GradingRetrievalService` (real chunk/embed/Qdrant retrieval is infra, not the
 * biz under judgement -- its mock still forwards the REAL per-case document content into
 * the grading prompt via {@link excerptFromDocuments}), `MountStorageService` (github
 * token + `passThreshold`), `EncryptionService`, `AiEntitlementService.assertNotOverQuota`
 * (this step does NOT `consume`), `JobActionService` (captured), `WinstonService`,
 * `GithubRepoLoader` (network), `@langchain/qdrant` (transitive import only).
 *
 * REAL: the SUT, `ProjectEvaluationParseService`, `DayjsService` (no deps), and the model
 * answer (a real Claude call at the per-case tier) under judgement.
 *
 * Requires the `.volume` mount + a Claude Code OAuth token
 * (`.secrets/claude-code-token.txt` / `CLAUDE_CODE_OAUTH_TOKEN`) + live API.
 */
describeOrSkip("Milestone task grading — real grade flow judged (harness)",
    () => {
        let service: ReviewMilestoneTaskGradeStepService
        let entityManager: EntityManagerMock
        let judgeService: JudgeService

        const gradingRetrievalServiceMock = {
            retrieveGradingExcerpt: jest.fn(),
        }
        const mountStorageServiceMock = {
            githubAccessToken: "ORG-TOKEN",
            appConfig: {
                systemConfig: {
                    task: {
                        passThreshold: 0.5,
                    },
                },
            },
        }
        const encryptionServiceMock = {
            decrypt: jest.fn(),
        }
        const aiEntitlementServiceMock = {
            assertNotOverQuota: jest.fn(),
        }
        const jobActionServiceMock = {
            increaseJob: jest.fn(),
            saveExecutionResult: jest.fn(),
            failJob: jest.fn(),
        }
        const winstonServiceMock = {
            log: jest.fn(),
        }

        beforeAll(async () => {
            entityManager = makeEntityManagerMock()

            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                ],
                providers: [
                    ReviewMilestoneTaskGradeStepService,
                    ProjectEvaluationParseService,
                    DayjsService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: AiInvokeService,
                        useFactory: (
                            harnessInvoke: HarnessInvokeService,
                        ) => harnessInvoke.create(() => currentTier),
                        inject: [
                            HarnessInvokeService,
                        ],
                    },
                    {
                        provide: GradingRetrievalService,
                        useValue: gradingRetrievalServiceMock,
                    },
                    {
                        provide: MountStorageService,
                        useValue: mountStorageServiceMock,
                    },
                    {
                        provide: EncryptionService,
                        useValue: encryptionServiceMock,
                    },
                    {
                        provide: AiEntitlementService,
                        useValue: aiEntitlementServiceMock,
                    },
                    {
                        provide: JobActionService,
                        useValue: jobActionServiceMock,
                    },
                    {
                        provide: WinstonService,
                        useValue: winstonServiceMock,
                    },
                ],
            }).compile()

            service = moduleRef.get(ReviewMilestoneTaskGradeStepService)
            judgeService = moduleRef.get(JudgeService)
        })

        beforeEach(() => {
            jest.clearAllMocks()
            currentTier = "high"

            entityManager.findOne.mockResolvedValue(null)
            entityManager.findOneOrFail.mockImplementation(
                (entity: unknown) => {
                    if (entity === MilestoneTaskEntity) {
                        return Promise.resolve(currentTaskFixture)
                    }
                    if (entity === EnrollmentEntity) {
                        return Promise.resolve({
                            id: ENROLLMENT_ID,
                            userId: USER_ID,
                        })
                    }
                    return Promise.resolve(null)
                },
            )

            aiEntitlementServiceMock.assertNotOverQuota.mockResolvedValue(undefined)
            gradingRetrievalServiceMock.retrieveGradingExcerpt.mockImplementation(
                async ({ documents }: RetrieveGradingExcerptParams) => ({
                    excerpt: excerptFromDocuments(documents),
                }),
            )
        })

        /** Run one grading pass and return the captured `{ evaluation, passed }`. */
        const runGrade = async (
            taskFixture: unknown,
            tier: HarnessTierName,
            files: Array<{ path: string; content: string }>,
        ): Promise<ReviewMilestoneTaskGradeResult> => {
            currentTier = tier
            currentTaskFixture = taskFixture
            loaderLoadMock.mockResolvedValue(toDocuments(files))

            await service.process(makeContext())

            expect(jobActionServiceMock.saveExecutionResult).toHaveBeenCalledTimes(1)
            const saveArg = jobActionServiceMock.saveExecutionResult.mock.calls[0][0] as {
                executionResult: ReviewMilestoneTaskGradeResult
            }
            return saveArg.executionResult
        }

        describe("task: Scaffold StarCi Shop Backend + Health Endpoint (real .volume SCHEMA V2 task)",
            () => {
                it.each(TASK_A_CASES)(
                    "$name (tier=$tier)",
                    async ({
                        tier,
                        files,
                        rubric,
                    }) => {
                        const taskFixture = buildV2TaskFixture({
                            id: "task-health-endpoint",
                            relDir: TASK_A_DIR,
                            lang: LANG,
                        })
                        const {
                            evaluation, passed,
                        } = await runGrade(taskFixture,
                            tier,
                            files)

                        // the parser produced a valid, non-empty evaluation
                        expect(typeof evaluation.score).toBe("number")
                        expect(evaluation.score).toBeGreaterThanOrEqual(0)
                        expect(evaluation.shortFeedback.trim().length).toBeGreaterThan(0)
                        expect(typeof passed).toBe("boolean")

                        // the evaluation itself is sensible for THIS submission against the REAL criteria
                        const verdict = await judgeService.judge(rubric,
                            JSON.stringify({
                                evaluation,
                                passed,
                            } satisfies {
                                evaluation: ProjectEvaluation
                                passed: boolean
                            }))

                        expect(verdict.pass).toBe(true)
                        expect(verdict.score).toBeGreaterThanOrEqual(PASS_SCORE)
                    },
                )

                // ── discrimination: same REAL task, meets-submission must outrank a misses-submission ──
                it("ranks the MEETS submission strictly above the MISSES submission for the SAME real task",
                    async () => {
                        const taskFixture = buildV2TaskFixture({
                            id: "task-health-endpoint",
                            relDir: TASK_A_DIR,
                            lang: LANG,
                        })

                        const meets = await runGrade(taskFixture,
                            "high",
                            TASK_A_MEETS_FILES)
                        jest.clearAllMocks()
                        aiEntitlementServiceMock.assertNotOverQuota.mockResolvedValue(undefined)
                        gradingRetrievalServiceMock.retrieveGradingExcerpt.mockImplementation(
                            async ({ documents }: RetrieveGradingExcerptParams) => ({
                                excerpt: excerptFromDocuments(documents),
                            }),
                        )
                        entityManager.findOne.mockResolvedValue(null)
                        entityManager.findOneOrFail.mockImplementation(
                            (entity: unknown) => {
                                if (entity === MilestoneTaskEntity) {
                                    return Promise.resolve(currentTaskFixture)
                                }
                                if (entity === EnrollmentEntity) {
                                    return Promise.resolve({
                                        id: ENROLLMENT_ID,
                                        userId: USER_ID,
                                    })
                                }
                                return Promise.resolve(null)
                            },
                        )

                        const misses = await runGrade(taskFixture,
                            "mid",
                            TASK_A_MISSES_FILES)

                        expect(meets.evaluation.score).toBeGreaterThan(misses.evaluation.score)
                    })
            })

        describe("task: Let Shoppers Sign Up & Sign In (JWT) — SCHEMA V2 vs LEGACY (real .volume task)",
            () => {
                it.each(TASK_B_SCHEMA_CASES)(
                    "$name (tier=$tier)",
                    async ({
                        tier,
                        buildFixture,
                        rubric,
                    }) => {
                        const taskFixture = buildFixture()
                        const {
                            evaluation, passed,
                        } = await runGrade(taskFixture,
                            tier,
                            TASK_B_FILES)

                        // both schema paths PARSE into a valid, non-empty evaluation
                        expect(typeof evaluation.score).toBe("number")
                        expect(evaluation.score).toBeGreaterThanOrEqual(0)
                        expect(evaluation.shortFeedback.trim().length).toBeGreaterThan(0)
                        expect(typeof passed).toBe("boolean")

                        // and both schema paths JUDGE as sensible for the same real submission
                        const verdict = await judgeService.judge(rubric,
                            JSON.stringify({
                                evaluation,
                                passed,
                            } satisfies {
                                evaluation: ProjectEvaluation
                                passed: boolean
                            }))

                        expect(verdict.pass).toBe(true)
                        expect(verdict.score).toBeGreaterThanOrEqual(PASS_SCORE)
                    },
                )
            })
    })
