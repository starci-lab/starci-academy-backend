import {
    randomInt,
} from "node:crypto"
import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MockInterviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    MockInterviewEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    UserContentEntity,
} from "@modules/databases/postgresql/primary/entities/user-content.entity"
import {
    ChallengeDifficulty,
} from "@modules/databases/postgresql/primary/enums/challenge-difficulty"
import {
    FlashcardLevel,
} from "@modules/databases/postgresql/primary/enums/flashcard-level"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MockInterviewKind,
    MOCK_INTERVIEW_QNA_KINDS,
} from "@modules/databases/postgresql/primary/enums/mock-interview-kind"
import {
    MockInterviewMode,
    normalizeMockInterviewMode,
} from "@modules/databases/postgresql/primary/enums/mock-interview-mode"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    FlashcardDeckReadService,
} from "@modules/bussiness/flashcard/flashcard-deck.service"
import {
    PersonalProjectProgressService,
} from "@modules/bussiness/progress/personal-project.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    CourseRagRetrievalService,
} from "@modules/integrations/rag/course-rag-retrieval.service"
import {
    MOCK_INTERVIEW_CLASSIC_PROMPTS,
} from "../../../queries/flashcard-decks/mock-interview-prompts/constants/classic-prompts"
import type {
    MockInterviewClassicPrompt,
} from "../../../queries/flashcard-decks/mock-interview-prompts/types/mock-interview-prompts"
import {
    MockInterviewNoSeedCardsException,
} from "@modules/platform/exceptions/errors/ai/mock-interview-no-seed-cards"
import type {
    DrawMockInterviewSeedTopic,
    DrawMockInterviewSessionParams,
    DrawMockInterviewSessionResult,
    MockInterviewGivenCodeVariant,
} from "./types/start-mock-interview-session"

/** One candidate prompt in the draw pool, normalized to a common shape regardless of source (mode="design" only). */
interface MockInterviewPromptCandidate {
    id: string
    title: string
    difficulty: ChallengeDifficulty
    source: "capstone" | "classic"
}

/**
 * One candidate seed card in the qna draw pool, normalized to a common shape
 * regardless of source -- `kind`/`givenCodes` are only present when the card
 * came from the interview bank (flashcard-sourced seeds derive their kind
 * instead, and never carry given code).
 */
interface MockInterviewSeedCard {
    id: string
    question: string
    level: FlashcardLevel
    moduleId: string | null
    kind?: string
    givenCodes?: Array<MockInterviewGivenCodeVariant>
}

/**
 * Server-side seniority level literal the client may request. Any other
 * string collapses to {@link MockInterviewLevel.Middle} for pool selection --
 * the level is still echoed back on the persisted session/response as-is.
 */
enum MockInterviewLevel {
    Junior = "junior",
    Middle = "middle",
    Senior = "senior",
}

/** Params for {@link MockInterviewSessionDrawService.drawDesign}. */
interface DrawMockInterviewDesignParams {
    courseId: string
    enrollment: EnrollmentEntity
    level: MockInterviewLevel
    locale: Locale
    countsToReadiness: boolean
    name?: string
}

/** Params for {@link MockInterviewSessionDrawService.drawQna}. */
interface DrawMockInterviewQnaParams {
    courseId: string
    enrollment: EnrollmentEntity
    level: MockInterviewLevel
    lang?: string
    langs?: Array<string>
    locale: Locale
    questionCount?: number
    kinds?: Array<string>
    countsToReadiness: boolean
    name?: string
}

/** Params for {@link MockInterviewSessionDrawService.listReachedModuleIds}. */
interface ListReachedModuleIdsParams {
    courseId: string
    enrollmentId: string
}

/** Params for {@link MockInterviewSessionDrawService.listCourseFlashcardCards}. */
interface ListCourseFlashcardCardsParams {
    courseId: string
    locale: Locale
}

/** Params for {@link MockInterviewSessionDrawService.listCourseInterviewQuestions}. */
interface ListCourseInterviewQuestionsParams {
    courseId: string
    /**
     * The candidate's selected implementation-track languages. A question authored
     * across the 4 tracks (`langs` bodies) is served in a RANDOM member of
     * (this ∩ its authored tracks); a track-authored question whose tracks
     * DON'T intersect this set is DROPPED (excluded from the returned pool, so
     * a different question gets drawn instead of rendering a language the
     * candidate didn't pick). A non-track question (single `givenCode`/`givenLang`
     * like `dockerfile`, or a no-code question) ignores this -- its language is
     * fixed by the question itself, so it is always eligible.
     */
    langs: Array<string>
}

/** Params for {@link MockInterviewSessionDrawService.listReachedCapstonePrompts}. */
interface ListReachedCapstonePromptsParams {
    courseId: string
    enrollmentId: string
    difficultyPool: ReadonlyArray<ChallengeDifficulty>
}

/** Params for {@link MockInterviewSessionDrawService.listClassicPrompts}. */
interface ListClassicPromptsParams {
    difficultyPool: ReadonlyArray<ChallengeDifficulty> | undefined
    locale: Locale
}

/** Params for {@link MockInterviewSessionDrawService.buildQnaPool}. */
interface BuildQnaPoolParams<Type> {
    tiers: ReadonlyArray<Array<Type>>
    minSize: number
}

/** Params for {@link MockInterviewSessionDrawService.persistSession}. */
interface PersistMockInterviewSessionParams {
    enrollment: EnrollmentEntity
    level: MockInterviewLevel
    lang?: string | null
    mode: MockInterviewMode
    promptId: string
    promptTitle: string
    difficulty: ChallengeDifficulty
    source: string
    seedQuestions: Array<DrawMockInterviewSeedTopic> | null
    countsToReadiness: boolean
    name?: string
}

/**
 * Difficulty pool each level draws from -- "senior" intentionally excludes
 * "easy"/"medium" (a senior-level session should never draw a warm-up
 * prompt), while "junior"/"middle" only ever see their own tier (classics only
 * span easy/medium/hard, so this mapping already covers every classic prompt).
 * Used for mode="design" only.
 */
const LEVEL_DIFFICULTY_POOL: Record<MockInterviewLevel, ReadonlyArray<ChallengeDifficulty>> = {
    [MockInterviewLevel.Junior]: [
        ChallengeDifficulty.Easy,
    ],
    [MockInterviewLevel.Middle]: [
        ChallengeDifficulty.Medium,
    ],
    [MockInterviewLevel.Senior]: [
        ChallengeDifficulty.Hard,
        ChallengeDifficulty.Insane,
    ],
}

/**
 * Maps the same 3-tier setup level onto the flashcard domain's 4-value
 * {@link FlashcardLevel} for `mode="qna"`'s seed draw. "senior" widens to
 * BOTH senior + staff (flashcard decks rarely have many "staff" cards per
 * module -- folding staff into the senior tier keeps the pool from going
 * empty for advanced learners) rather than excluding staff outright.
 */
const LEVEL_FLASHCARD_POOL: Record<MockInterviewLevel, ReadonlyArray<FlashcardLevel>> = {
    [MockInterviewLevel.Junior]: [
        FlashcardLevel.Junior,
    ],
    [MockInterviewLevel.Middle]: [
        FlashcardLevel.Middle,
    ],
    [MockInterviewLevel.Senior]: [
        FlashcardLevel.Senior,
        FlashcardLevel.Staff,
    ],
}

/** How many flashcard seed questions a `mode="qna"` session draws by default (the Auto/Auto default, and the Configurable/Configurable fallback for an unrecognized `questionCount`). */
const QNA_SEED_COUNT = 5

/**
 * Every `questionCount` value the Configurable (Configurable) setup screen's
 * question count control may request -- an unrecognized/omitted value falls back to
 * {@link QNA_SEED_COUNT}.
 */
const ALLOWED_QNA_QUESTION_COUNTS: ReadonlySet<number> = new Set([3,
    5,
    10])

/** Max characters of a flashcard question kept as the seed topic's FE-facing preview title. */
const SEED_TITLE_MAX_CHARS = 120

/**
 * Minimum candidate-pool size a `mode="qna"` draw widens up to before giving
 * every retry real odds of drawing something different. A pool this small (or
 * smaller) still shuffles, but with so few candidates a retry keeps landing
 * back on the same 1-2 cards -- indistinguishable from a hard-coded question.
 */
const MIN_QNA_POOL_SIZE = 3

@Injectable()
/**
 * Draws ONE mock-interview session for a course + level + mode, server-side --
 * the Pha 2 integrity fix that replaces the FE's client-side `drawRandomPrompt`
 * random pick, EXTENDED (mode split, 2026-07-06) with a second draw path:
 *
 * - mode="design" -- UNCHANGED: capstone milestone-tasks the learner has
 *   actually REACHED are tried first, falling back to the course-agnostic
 *   curated classics of the same difficulty pool, then to ANY classic (the
 *   14-prompt bank spans easy/medium/hard) so the draw can never come back empty.
 * - mode="qna" -- draws {@link QNA_SEED_COUNT} flashcard-card topics from
 *   REACHED modules at the requested level, widening the pool (any level,
 *   then any module) rather than ever dead-ending, and assigns EACH drawn
 *   question its own cognitive frame (theory/reasoning/scenario) via a
 *   DETERMINISTIC per-seed hash -- see {@link deriveSeedKind}.
 */
export class MockInterviewSessionDrawService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly personalProjectProgressService: PersonalProjectProgressService,
        private readonly userService: UserService,
        private readonly flashcardDeckReadService: FlashcardDeckReadService,
        private readonly contentRagRetrievalService: CourseRagRetrievalService,
    ) {}

    /**
     * Draw + persist one mock-interview session for a course + level + mode.
     *
     * @param params - {@link DrawMockInterviewSessionParams}
     * @returns the drawn session's identity (id + prompt/seeds + difficulty + source + level + mode).
     */
    async draw(
        params: DrawMockInterviewSessionParams,
    ): Promise<DrawMockInterviewSessionResult> {
        const {
            userId,
            courseId,
            level,
            mode,
            lang,
            langs,
            locale,
            questionCount,
            kinds,
            countsToReadiness,
            name,
        } = params

        const normalizedLevel = this.normalizeLevel(level)
        const normalizedMode = normalizeMockInterviewMode(mode)
        // "design" has no configurable options at all -- it always counts
        // towards job-readiness regardless of what the caller sends.
        const resolvedCountsToReadiness = normalizedMode === MockInterviewMode.Design
            ? true
            : countsToReadiness ?? true

        // resolve/create the trial enrollment ONCE -- every downstream lookup
        // (progress, reached modules, the persisted session draw) is anchored to
        // the same enrollment, consistent with every other mock-interview surface
        // (grading, prompt listing).
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            courseId,
        )

        return normalizedMode === MockInterviewMode.Design
            ? this.drawDesign({
                courseId,
                enrollment,
                level: normalizedLevel,
                locale,
                countsToReadiness: resolvedCountsToReadiness,
                name,
            })
            : this.drawQna({
                courseId,
                enrollment,
                level: normalizedLevel,
                lang,
                langs,
                locale,
                questionCount,
                kinds,
                countsToReadiness: resolvedCountsToReadiness,
                name,
            })
    }

    /**
     * Normalize a raw `questionCount` request value to a known
     * {@link ALLOWED_QNA_QUESTION_COUNTS} member, falling back to
     * {@link QNA_SEED_COUNT} for anything unrecognized/omitted (never throws
     * -- an unknown FE value must not break the draw).
     *
     * @param value - The raw `questionCount` field from the request.
     * @returns A known question count.
     */
    private normalizeQuestionCount(
        value: number | undefined,
    ): number {
        if (value === undefined) {
            return QNA_SEED_COUNT
        }
        return ALLOWED_QNA_QUESTION_COUNTS.has(value)
            ? value
            : QNA_SEED_COUNT
    }

    /**
     * Normalize a raw `kinds` request value to a non-empty subset of
     * {@link MOCK_INTERVIEW_QNA_KINDS} -- an omitted/empty array, or one whose
     * every entry is unrecognized, falls back to ALL 3 kinds (the All/
     * Auto behavior), matching the request field's own doc.
     *
     * @param value - The raw `kinds` field from the request.
     * @returns A non-empty array of known kinds to restrict the per-question draw to.
     */
    private normalizeKinds(
        value: Array<string> | undefined,
    ): ReadonlyArray<MockInterviewKind> {
        if (!value || value.length === 0) {
            return MOCK_INTERVIEW_QNA_KINDS
        }
        const normalized = value
            .map((raw) => raw.trim().toLowerCase())
            .filter((candidate): candidate is MockInterviewKind => MOCK_INTERVIEW_QNA_KINDS.includes(candidate as MockInterviewKind))
        // dedupe while preserving MOCK_INTERVIEW_QNA_KINDS' own fixed order, so
        // deriveSeedKind's modulo bucketing stays stable regardless of the
        // caller's array order
        const asSet = new Set(normalized)
        const ordered = MOCK_INTERVIEW_QNA_KINDS.filter((kind) => asSet.has(kind))
        return ordered.length > 0
            ? ordered
            : MOCK_INTERVIEW_QNA_KINDS
    }

    /**
     * Coerce a raw level string to a known {@link MockInterviewLevel}, falling
     * back to "middle" for anything unrecognized (never throws -- an unknown
     * FE tier label must not break the draw).
     *
     * @param value - The raw `level` field from the request.
     * @returns A known level literal.
     */
    private normalizeLevel(
        value: string,
    ): MockInterviewLevel {
        const candidate = value.trim().toLowerCase()
        const match = Object.values(MockInterviewLevel).find(
            (level) => level === candidate,
        )
        return match ?? MockInterviewLevel.Middle
    }

    /**
     * Coerce a raw language string (session-start picker) to one of the four
     * authored body languages, falling back to "typescript" for anything
     * unrecognized/omitted (never throws -- an unknown label must not break the
     * draw; a question with no matching body then uses its agnostic root).
     *
     * @param value - The raw `lang` field from the request.
     * @returns A known language literal ("typescript" | "java" | "csharp" | "go").
     */
    private normalizeLang(
        value: string | undefined,
    ): string {
        const known = new Set(["typescript",
            "java",
            "csharp",
            "go"])
        const candidate = (value ?? "").trim().toLowerCase()
        return known.has(candidate) ? candidate : "typescript"
    }

    /**
     * Resolve the SET of implementation-track languages a qna draw should serve
     * code questions in -- the multi-select language picker (2026-07-17). Keeps only
     * the 4 known tracks (deduped, preserving `DEFAULT_PROGRAMMING_LANGUAGES`
     * order); an empty result falls back to the deprecated single {@link lang}
     * (one-element set) and, failing that, to ALL FOUR tracks (widest draw -- a
     * missing/garbage selection must never exclude every code question). Callers
     * intersect this per-question against each question's authored tracks: a
     * 4-track question is served in a RANDOM member of the intersection, and one
     * with an EMPTY intersection is dropped from the pool entirely.
     *
     * @param langs - Raw language set from the request (may be undefined/empty/garbage).
     * @param fallbackSingle - The deprecated single-language field, used only when `langs` yields nothing.
     * @returns A non-empty, order-stable set of known track languages.
     */
    private normalizeLangs(
        langs: Array<string> | undefined,
        fallbackSingle: string | undefined,
    ): Array<string> {
        const order = ["typescript",
            "java",
            "csharp",
            "go"]
        const known = new Set(order)
        const picked = new Set(
            (langs ?? [])
                .map((value) => value.trim().toLowerCase())
                .filter((value) => known.has(value)),
        )
        if (picked.size > 0) {
            return order.filter((lang) => picked.has(lang))
        }
        const single = (fallbackSingle ?? "").trim().toLowerCase()
        if (known.has(single)) {
            return [single]
        }
        return [...order]
    }

    /**
     * Pick one element uniformly at random from a non-empty list (generic sibling
     * of {@link pickRandom}, which is typed to prompt candidates). Used to assign a
     * 4-track code question its ONE served language from the intersection of the
     * candidate's selected languages and the question's authored tracks.
     *
     * Uses `node:crypto`'s CSPRNG (not `Math.random`) -- which language a code
     * question is served in is itself part of the graded mock-interview score
     * (`mock_interview_attempts.overall_score`), which feeds the rolling
     * job-readiness interview average ({@link import("@modules/api/core/graphql/queries/users/job-readiness/job-readiness.service").JobReadinessService})
     * and the recruiter-facing talent ranking
     * ({@link import("@modules/api/core/graphql/queries/users/talent-candidates/talent-candidates.service").TalentCandidatesService}) --
     * a predictable draw would let a candidate pre-select the exact prepared
     * language/prompt for a real scored outcome instead of drawing it blind.
     *
     * @param items - The candidate list (caller guarantees non-empty).
     * @returns One randomly chosen element.
     */
    private pickRandomFrom<Type>(
        items: Array<Type>,
    ): Type {
        return items[randomInt(items.length)]
    }

    /**
     * mode="design" draw path -- UNCHANGED from before the mode split:
     * capstone-first (grounded in what THIS course teaches + already reached),
     * then same-difficulty classics, then -- so the draw is NEVER empty -- any
     * classic at all (the 14-prompt bank spans easy/medium/hard).
     *
     * @param params - Course, resolved enrollment, level, locale.
     * @returns the drawn (and persisted) design-mode session result.
     */
    private async drawDesign(
        params: DrawMockInterviewDesignParams,
    ): Promise<DrawMockInterviewSessionResult> {
        const {
            courseId,
            enrollment,
            level,
            locale,
            countsToReadiness,
            name,
        } = params
        const difficultyPool = LEVEL_DIFFICULTY_POOL[level]

        const reachedCapstonePrompts = await this.listReachedCapstonePrompts({
            courseId,
            enrollmentId: enrollment.id,
            difficultyPool,
        })
        const classicPrompts = this.listClassicPrompts({
            difficultyPool,
            locale,
        })

        let pool: Array<MockInterviewPromptCandidate>
        if (reachedCapstonePrompts.length > 0) {
            pool = reachedCapstonePrompts
        } else if (classicPrompts.length > 0) {
            pool = classicPrompts
        } else {
            pool = this.listClassicPrompts({
                difficultyPool: undefined,
                locale,
            })
        }

        const drawn = this.pickRandom(pool)

        const session = await this.persistSession({
            enrollment,
            level,
            mode: MockInterviewMode.Design,
            promptId: drawn.id,
            promptTitle: drawn.title,
            difficulty: drawn.difficulty,
            source: drawn.source,
            seedQuestions: null,
            countsToReadiness,
            name,
        })

        return {
            sessionId: session.id,
            promptId: drawn.id,
            promptTitle: drawn.title,
            difficulty: drawn.difficulty,
            source: drawn.source,
            level,
            mode: MockInterviewMode.Design,
            seedTopics: [],
            createdAt: session.createdAt,
        }
    }

    /**
     * mode="qna" draw path -- draws {@link QNA_SEED_COUNT} flashcard-card seed
     * questions from REACHED modules at the requested level. Widens the pool
     * (never dead-ends): reached modules at the requested level -> reached
     * modules at ANY level -> ANY module at ANY level. Throws
     * {@link MockInterviewNoSeedCardsException} only when the course has ZERO
     * flashcard cards at all (a course with no flashcard decks seeded yet
     * cannot run a Q&A session). EACH drawn question is assigned its own
     * cognitive frame (theory/reasoning/scenario) via a DETERMINISTIC per-seed
     * hash ({@link deriveSeedKind}) so the session mixes question styles
     * without depending on `Math.random`.
     *
     * @param params - Course, resolved enrollment, level, locale.
     * @returns the drawn (and persisted) qna-mode session result.
     */
    private async drawQna(
        params: DrawMockInterviewQnaParams,
    ): Promise<DrawMockInterviewSessionResult> {
        const {
            courseId,
            enrollment,
            level,
            locale,
            countsToReadiness,
            name,
        } = params
        const levelPool = LEVEL_FLASHCARD_POOL[level]
        const resolvedQuestionCount = this.normalizeQuestionCount(params.questionCount)
        const resolvedKinds = this.normalizeKinds(params.kinds)
        // languages the candidate selected at setup -- each 4-track code question is
        // served in a RANDOM member of (this ∩ its authored tracks); a code question
        // authored in none of these is dropped from the pool (see listCourseInterviewQuestions)
        const resolvedLangs = this.normalizeLangs(params.langs,
            params.lang)

        const reachedModuleIds = await this.listReachedModuleIds({
            courseId,
            enrollmentId: enrollment.id,
        })

        // widen in 3 steps so a draw NEVER dead-ends: (1) reached modules at the
        // requested level, (2) reached modules at ANY level (a module with only
        // e.g. senior cards for a junior-level learner), (3) ANY module at ANY
        // level (a brand-new learner with zero read progress yet, or a module
        // set that predates progress tracking)
        // PRIMARY source = the authored interview bank (technical questions for
        // this course); fall back to flashcard-seed for courses that have no
        // interview bank authored yet (non-breaking).
        const bankCards = await this.listCourseInterviewQuestions({
            courseId,
            langs: resolvedLangs,
        })
        const useBank = bankCards.length > 0
        const allCards: Array<MockInterviewSeedCard> = useBank
            ? bankCards
            : await this.listCourseFlashcardCards({
                courseId,
                locale,
            })
        const source = useBank ? "interview-bank" : "flashcard"
        if (allCards.length === 0) {
            throw new MockInterviewNoSeedCardsException({
                courseId,
            })
        }

        const reachedAtLevel = allCards.filter(
            (card) => Boolean(card.moduleId) && reachedModuleIds.has(card.moduleId as string) && levelPool.includes(card.level),
        )
        const reachedAnyLevel = allCards.filter(
            (card) => Boolean(card.moduleId) && reachedModuleIds.has(card.moduleId as string),
        )
        // widen PROGRESSIVELY until the pool is big enough for real variety --
        // "has at least 1 candidate" used to be the bar, which let an early
        // module with a single authored middle-level card lock every retry
        // onto that SAME card forever (a 1-card pool shuffles to itself every
        // time). Merging tiers (deduped) until the pool clears
        // `MIN_QNA_POOL_SIZE` keeps the higher-priority tier's cards first --
        // a module that already has plenty of reached-at-level cards never
        // widens at all -- but tops up thin pools from the next tier so a
        // retry has real odds of drawing something different.
        const pool = this.buildQnaPool({
            tiers: [reachedAtLevel,
                reachedAnyLevel,
                allCards],
            minSize: Math.max(resolvedQuestionCount,
                MIN_QNA_POOL_SIZE),
        })

        const drawnCards = this.pickRandomMany(pool,
            resolvedQuestionCount)
        // each drawn card's own cognitive frame -- DETERMINISTIC (not
        // Math.random), derived from the card's own id + its position in the
        // draw, restricted to the requested kinds subset (all 3 for Auto/omitted), so the same card asked twice in different
        // positions can still land on a different kind while staying
        // reproducible for a given draw
        const seedTopics: Array<DrawMockInterviewSeedTopic> = drawnCards.map((card,
            index) => ({
            cardId: card.id,
            // bank questions carry their AUTHORED kind; flashcard seeds derive one
            kind: useBank && card.kind ? card.kind : this.deriveSeedKind(card.id,
                index,
                resolvedKinds),
            // bank questions are delivered VERBATIM by the interviewer -> carry the
            // composed prompt (+ folded diagram); flashcard seeds keep a short title
            title: useBank ? card.question : this.truncateTitle(card.question),
            // editor (debug/review/optimize), one variant per authored language --
            // empty for flashcard seeds
            givenCodes: useBank
                ? (card.givenCodes ?? []).map((variant) => ({
                    lang: variant.lang,
                    code: this.stripCodeFence(variant.code) ?? variant.code,
                }))
                : [],
        }))

        // Bookend the technical block with TWO behavioral/EQ questions (from the
        // GLOBAL bank), mirroring a real interview loop: a light culture/motivation
        // question OPENS (recruiter-screen warm-up -- also lowers anxiety), and a
        // deep behavioral/situational STAR question CLOSES (the hiring-manager
        // behavioral round near the end). Bank sessions only (flashcard-fallback
        // courses have no EQ concept). Either draw may be null (bank not seeded) --
        // the session still works, just without that bookend.
        if (useBank) {
            const eqOpener = await this.drawEqQuestion(level,
                ["culture"])
            const eqCloser = await this.drawEqQuestion(level,
                ["behavioral",
                    "situational"],
                eqOpener?.cardId)
            if (eqCloser) {
                seedTopics.push(eqCloser)
            }
            if (eqOpener) {
                seedTopics.unshift(eqOpener)
            }
        }

        // synthetic prompt identity for a qna-mode session -- there is no single
        // "prompt", so promptId/promptTitle summarize the draw instead
        const promptId = `qna-${enrollment.id}-${Date.now()}`
        const promptTitle = `${seedTopics.length} câu · Ngẫu nhiên` // vn-ok: localized QnA session title emitted to clients
        const difficulty = this.levelToDifficulty(level)

        const session = await this.persistSession({
            enrollment,
            level,
            // representative session language (per-question served languages now live
            // on each seedQuestion's own givenCodes[0].lang, snapshotted below) -- kept
            // for back-compat with the session row's `lang` column + older readers
            lang: resolvedLangs[0],
            mode: MockInterviewMode.Qna,
            promptId,
            promptTitle,
            difficulty,
            source,
            seedQuestions: seedTopics.map((topic) => ({
                cardId: topic.cardId,
                kind: topic.kind,
                title: topic.title,
                // snapshotted so a resumed session re-seeds the SAME given code into
                // the workspace it was first delivered with (previously dropped here,
                // which left a debug/review/optimize question's code editor empty on
                // resume even though the question text still asked to read it).
                givenCodes: topic.givenCodes ?? [],
            })),
            countsToReadiness,
            name,
        })

        return {
            sessionId: session.id,
            promptId,
            promptTitle,
            difficulty,
            source,
            level,
            mode: MockInterviewMode.Qna,
            seedTopics,
            createdAt: session.createdAt,
        }
    }

    /**
     * Deterministically derive ONE seed question's cognitive frame from its
     * card id + its position in the draw, restricted to `allowedKinds` (the
     * Configurable/Configurable question kind multi-select subset -- all 3 for
     * Auto/omitted) -- NOT `Math.random` (the workflow this draw runs
     * under forbids it for per-seed assignment), yet still varied per card: a
     * stable string hash of `${cardId}:${index}` is reduced modulo the
     * ALLOWED kinds' length. Because the hash includes `index`, the SAME card
     * drawn at a different position (or alongside different sibling cards)
     * can still land on a different kind, while a given draw's assignment
     * stays reproducible.
     *
     * @param cardId - The seed's `flashcard_cards.id`.
     * @param index - The 0-based position of this seed within the draw.
     * @param allowedKinds - The (non-empty) kinds subset to restrict the draw to.
     * @returns The deterministically-assigned {@link MockInterviewKind}, one of `allowedKinds`.
     */
    private deriveSeedKind(
        cardId: string,
        index: number,
        allowedKinds: ReadonlyArray<MockInterviewKind>,
    ): MockInterviewKind {
        const input = `${cardId}:${index}`
        // simple, fast, dependency-free string hash (djb2 variant) -- only needs
        // to spread inputs roughly evenly across the allowed kinds, not
        // cryptographic strength
        // `| 0` here is NOT a `Math.trunc` stand-in -- it deliberately wraps the
        // running hash to a 32-bit signed int on every step (the classic djb2
        // overflow-mixing behavior). `Math.trunc` would let `hash` grow as an
        // unbounded double instead, wrecking the distribution.
        let hash = 5381
        for (let charIndex = 0; charIndex < input.length; charIndex += 1) {
            hash = (hash * 33 + (input.codePointAt(charIndex) ?? 0)) | 0
        }
        const bucket = Math.abs(hash) % allowedKinds.length
        return allowedKinds[bucket]
    }

    /**
     * List the ids of modules the learner has actually REACHED in this course
     * -- a module counts as reached when it has at least one READ lesson
     * (content), OR it is the first module (in sort order) that still has an
     * unread lesson (i.e. the module the learner is CURRENTLY in, mirroring
     * `myCourseOutline`'s `resolveNextContentTask` at module granularity
     * instead of lesson granularity). A brand-new learner (zero read lessons)
     * reaches only the very first module -- the draw's own pool-widening then
     * falls through to "any module" rather than treating that as an error.
     *
     * @param params - Course + enrollment to scope the read-flag lookup to.
     * @returns the set of reached module ids, in no particular order.
     */
    private async listReachedModuleIds(
        params: ListReachedModuleIdsParams,
    ): Promise<Set<string>> {
        const {
            courseId,
            enrollmentId,
        } = params

        const modules = await this.entityManager.find(
            ModuleEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                },
                relations: {
                    contents: true,
                },
                order: {
                    sortIndex: "ASC",
                },
            },
        )
        if (modules.length === 0) {
            return new Set()
        }

        const contentIds = modules.flatMap(
            (module) => (module.contents ?? []).map((content) => content.id),
        )
        const readContentIds = contentIds.length > 0
            ? new Set(
                (
                    await this.entityManager.find(
                        UserContentEntity,
                        {
                            where: {
                                enrollment: {
                                    id: enrollmentId,
                                },
                                contentId: In(contentIds),
                                isRead: true,
                            },
                            select: {
                                contentId: true,
                            },
                        },
                    )
                ).map((userContent) => userContent.contentId),
            )
            : new Set<string>()

        const reached = new Set<string>()
        let currentModuleClaimed = false
        for (const module of modules) {
            const moduleContentIds = (module.contents ?? []).map((content) => content.id)
            const hasReadLesson = moduleContentIds.some((contentId) => readContentIds.has(contentId))
            const hasUnreadLesson = moduleContentIds.some((contentId) => !readContentIds.has(contentId))
            if (hasReadLesson) {
                reached.add(module.id)
            }
            // the first module (in order) with an unread lesson is the learner's
            // CURRENT module (already-unlocked, not yet finished) -- reached, but
            // stop granting "current module" status to any module after it
            if (!currentModuleClaimed && hasUnreadLesson) {
                reached.add(module.id)
                currentModuleClaimed = true
            }
        }
        return reached
    }

    /**
     * Load every flashcard card seeded under a course, fully localized --
     * flattened from every deck (deck->course, `FlashcardDeckReadService`
     * already loads + localizes the full cards graph).
     *
     * @param params - Course to scope decks to, and locale to localize into.
     * @returns a flat array of every card in the course, each carrying its
     *   owning `moduleId` -- resolved per deck via {@link resolveDeckModuleIdViaRag}
     *   (the deck->module relation was removed; this is the single best-matching
     *   module, not a pick-first-of-many, so there is no multi-module ambiguity
     *   to resolve here).
     */
    private async listCourseFlashcardCards(
        params: ListCourseFlashcardCardsParams,
    ): Promise<Array<MockInterviewSeedCard>> {
        const {
            courseId,
            locale,
        } = params
        const decks = await this.flashcardDeckReadService.listByCourse(
            courseId,
            locale,
        )
        // moduleId per deck is now derived via RAG (the deck->module relation was
        // removed): semantic-search the course for the deck's topic and take the
        // best-matching lesson's owning module. One retrieval per deck, tagged onto
        // every card of that deck.
        const perDeck = await Promise.all(decks.map(async (deck) => {
            const moduleId = await this.resolveDeckModuleIdViaRag(
                courseId,
                deck.title,
            )
            return (deck.cards ?? []).map((card) => ({
                id: card.id,
                question: card.question,
                // level is nullable on the entity (legacy cards) -- fall back to
                // middle so an unset card can still be drawn at the middle tier
                level: card.level ?? FlashcardLevel.Middle,
                moduleId,
            }))
        }))
        return perDeck.flat()
    }

    /**
     * Resolve the module a flashcard deck belongs to via RAG -- semantic-search the
     * course's indexed content for the deck's topic and return the best-matching
     * lesson's owning module id. Replaces the removed deck->module relation: the
     * association is derived from what the course actually teaches, not stored.
     * Null when the topic is blank, retrieval misses, or the content row is gone.
     *
     * @param courseId - the course to search within.
     * @param query - the deck's topic (its title).
     * @returns the resolved module id, or null when nothing relevant resolves.
     */
    private async resolveDeckModuleIdViaRag(
        courseId: string,
        query: string,
    ): Promise<string | null> {
        const trimmed = query.trim()
        if (!trimmed) {
            return null
        }
        const { hits } = await this.contentRagRetrievalService.searchCourse({
            courseId,
            query: trimmed,
        })
        const lessonHit = hits.find(
            (hit) => hit.kind === "content" || hit.kind === "code",
        )
        if (!lessonHit) {
            return null
        }
        const content = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id: lessonHit.contentId,
                },
                select: {
                    id: true,
                    moduleId: true,
                },
            },
        )
        return content?.moduleId ?? null
    }

    /**
     * Draw ONE behavioral/EQ question from the GLOBAL bank (not course-scoped --
     * EQ competencies are universal), restricted to the given `# kind`(s), and
     * preferring the session's tier (widening to any tier if none match).
     * `excludeId` skips an already-drawn question (so the opener and closer are
     * never the same row). Returned as a seed topic (delivered + graded the same
     * way as technical seeds). Null when no matching EQ question is seeded yet.
     *
     * @param tier - Preferred tier ("junior"|"middle"|"senior").
     * @param kinds - EQ kinds to draw from (`culture` for the opener; `behavioral`/`situational` for the closer).
     * @param excludeId - Optional question id to exclude (the other bookend).
     */
    private async drawEqQuestion(
        tier: string,
        kinds: Array<string>,
        excludeId?: string,
    ): Promise<DrawMockInterviewSeedTopic | null> {
        const rows = await this.entityManager.find(MockInterviewEntity,
            {
                where: {
                    family: "behavioral",
                    kind: In(kinds),
                },
            })
        const pool = rows.filter((row) => row.id !== excludeId)
        if (pool.length === 0) {
            return null
        }
        const atTier = pool.filter((row) => row.tier === tier)
        const picked = this.pickRandomMany(atTier.length > 0 ? atTier : pool,
            1)[0]
        if (!picked) {
            return null
        }
        return {
            cardId: picked.id,
            kind: picked.kind,
            title: picked.prompt,
        }
    }

    /** Map an authored interview `tier` (junior/middle/senior) to the FlashcardLevel the qna pool logic filters on. */
    private tierToFlashcardLevel(
        tier: string | null,
    ): FlashcardLevel {
        if (tier === "junior") {
            return FlashcardLevel.Junior
        }
        if (tier === "senior") {
            return FlashcardLevel.Senior
        }
        return FlashcardLevel.Middle
    }

    /**
     * List a course's TECHNICAL interview-bank questions in the SAME shape the
     * qna pool logic expects -- but sourced from `mock_interviews` (authored
     * prompts) instead of flashcards. `question` is the FULL composed prompt
     * (authored `prompt` + any given diagram/code folded in as Markdown so the
     * room renders them inline) that the interviewer delivers VERBATIM; `kind`
     * is the AUTHORED kind (not derived), so each seed keeps its designed frame.
     * Empty when the course has no interview bank yet -> caller falls back to
     * flashcard-seed (non-breaking for un-authored courses).
     */
    private async listCourseInterviewQuestions(
        params: ListCourseInterviewQuestionsParams,
    ): Promise<Array<MockInterviewSeedCard>> {
        const questions = await this.entityManager.find(MockInterviewEntity,
            {
                where: {
                    courseId: params.courseId,
                    family: "technical",
                },
                relations: {
                    langs: true,
                },
            })
        // flatMap so a track-authored question with NO selected-language overlap can
        // return [] (dropped from the pool) -- the candidate is never handed a code
        // question in a language they didn't pick; the draw simply fills from others.
        return questions.flatMap((question) => {
            // fold the prose prompt + any GIVEN diagram into the delivered `question`
            // (the diagram is CONTEXT the candidate reasons over -- it stays inline in
            // the chat bubble), but keep the GIVEN CODE SEPARATE so the FE can seed it
            // into an editable code editor for the candidate to FIX in place, instead
            // of rendering it read-only alongside the question (`debug`/`review`/
            // `optimize` questions). See the mock-interview WORKSPACE-ARTIFACT-SEED brainstorm.
            const bodies = [...(question.langs ?? [])]
                .sort((left, right) => left.sortIndex - right.sortIndex)
            // TRACK-authored code question (per-language `bodies/`): serve it in a
            // RANDOM one of the candidate's selected languages that this question is
            // actually authored in. No overlap -> drop the whole question (return []).
            //
            // A SINGLE authored body means the question's language is fixed by the question
            // itself, not chosen by the candidate -- `agnostic` prose, or a `hcl`/`yaml`/
            // `dockerfile` (and even `typescript`) snippet that only makes sense in that one
            // language. Those are always eligible, exactly like the root-authored non-track
            // branch below. Gating them on the candidate's track selection would silently
            // drop them for anyone who picked a different track; the body count, not the
            // language label, is what distinguishes "authored per track" from "fixed".
            if (bodies.length > 0) {
                const eligible = bodies.length === 1
                    ? bodies
                    : bodies.filter((body) => params.langs.includes(body.lang))
                if (eligible.length === 0) {
                    return []
                }
                const chosenBody = this.pickRandomFrom(eligible)
                // body prompt (per-language) wins; root prompt is the agnostic fallback
                // (empty for a full-4-body code question)
                const promptText = (chosenBody.prompt ?? question.prompt) ?? ""
                const parts = [promptText]
                if (question.diagram) {
                    parts.push(question.diagram)
                }
                return [{
                    id: question.id,
                    question: parts.join("\n\n"),
                    level: this.tierToFlashcardLevel(question.tier),
                    moduleId: question.moduleId,
                    kind: question.kind,
                    // deliver ONLY the randomly-chosen language's given code -- snapshotted
                    // per-question so grade time re-resolves THIS body (not session.lang)
                    givenCodes: [{
                        lang: chosenBody.lang, code: chosenBody.givenCode 
                    }],
                }]
            }
            // NON-track question -- a legacy/agnostic single `givenCode` (e.g. a
            // `dockerfile` debug question, whose language is fixed by the question,
            // not chosen by the candidate) or a no-code question. Always eligible.
            const promptText = question.prompt ?? ""
            const parts = [promptText]
            if (question.diagram) {
                parts.push(question.diagram)
            }
            const langVariants: Array<MockInterviewGivenCodeVariant> = question.givenCode
                ? [{
                    lang: question.givenLang ?? "agnostic", code: question.givenCode 
                }]
                : []
            return [{
                id: question.id,
                question: parts.join("\n\n"),
                level: this.tierToFlashcardLevel(question.tier),
                moduleId: question.moduleId,
                kind: question.kind,
                givenCodes: langVariants,
            }]
        })
    }

    /**
     * Truncate a flashcard question down to a short FE-facing preview title.
     *
     * @param question - The card's full (possibly Markdown, possibly long) question text.
     * @returns the truncated title.
     */
    private truncateTitle(
        question: string,
    ): string {
        const trimmed = question.trim()
        return trimmed.length > SEED_TITLE_MAX_CHARS
            ? `${trimmed.slice(0,
                SEED_TITLE_MAX_CHARS)}…`
            : trimmed
    }

    /**
     * Strips a wrapping Markdown code fence (```lang\n...\n```) off an authored
     * `given_code` value -- `interview_questions.given_code` is a PLAIN editor
     * buffer (seeded verbatim into the FE's Monaco tab), not Markdown, but at
     * least one authored row was pasted in straight from a Markdown draft with
     * the fence left on, so it leaked into the editor as literal text. Only
     * strips when the WHOLE string is one fence (first line is the opener,
     * last line is a bare closer) -- never touches legitimate ``` occurring
     * inside the code itself.
     *
     * @param code - Raw `given_code` value, or null.
     * @returns `code` with its wrapping fence removed, or unchanged if unfenced.
     */
    private stripCodeFence(code: string | null): string | null {
        if (!code) {
            return code
        }
        const trimmed = code.trim()
        const match = /^```[ \t]*\w*[ \t]*\r?\n([\s\S]*?)\r?\n```$/.exec(trimmed)
        return match ? match[1] : code
    }

    /**
     * Map a 3-tier setup level to the difficulty tier echoed back on a
     * qna-mode session (there is no single prompt's own difficulty to report
     * -- this is the pool's difficulty).
     *
     * @param level - The normalized setup level.
     * @returns the corresponding difficulty tier.
     */
    private levelToDifficulty(
        level: MockInterviewLevel,
    ): ChallengeDifficulty {
        switch (level) {
        case MockInterviewLevel.Junior:
            return ChallengeDifficulty.Easy
        case MockInterviewLevel.Senior:
            return ChallengeDifficulty.Hard
        case MockInterviewLevel.Middle:
        default:
            return ChallengeDifficulty.Medium
        }
    }

    /**
     * Merge candidate tiers (highest-priority first) until the pool reaches
     * `minSize`, deduping by id -- a tier only gets pulled in when the tiers
     * before it didn't already clear the bar, so a module with plenty of
     * reached-at-level cards never widens at all; a thin pool tops up from the
     * next tier instead of being replaced outright, so the in-priority cards
     * are still drawn most often, just no longer the ONLY thing ever drawn.
     *
     * @param params - The tiers to merge (in priority order) + the target minimum pool size.
     * @returns the merged, deduped pool -- at least `minSize` long when enough distinct candidates exist across every tier combined.
     */
    private buildQnaPool<Type extends { id: string }>(
        params: BuildQnaPoolParams<Type>,
    ): Array<Type> {
        const { tiers, minSize } = params
        const merged = new Map<string, Type>()
        for (const tier of tiers) {
            for (const card of tier) {
                merged.set(card.id,
                    card)
            }
            if (merged.size >= minSize) {
                break
            }
        }
        return [...merged.values()]
    }

    /**
     * Pick up to `count` candidates uniformly at random WITHOUT repeats from a
     * pool (fewer than `count` available -> returns every candidate, shuffled).
     *
     * Uses a `node:crypto`-backed Fisher-Yates (not `Math.random`) -- the drawn
     * seed questions are what the candidate is graded against
     * (`mock_interview_attempts.overall_score`), which rolls into the
     * job-readiness interview average and the recruiter-facing talent ranking
     * (see {@link pickRandomFrom}'s doc for the full downstream chain). A
     * predictable shuffle would let a candidate anticipate (and prep answers
     * for) the exact question set instead of drawing it blind.
     *
     * @param pool - The candidate pool (may contain fewer than `count` items).
     * @param count - How many to draw.
     * @returns the drawn candidates, shuffled, capped at `count`.
     */
    private pickRandomMany<Type>(
        pool: Array<Type>,
        count: number,
    ): Array<Type> {
        // Fisher-Yates shuffle a shallow copy, then take the first `count`
        const shuffled = [...pool]
        for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const swapIndex = randomInt(index + 1)
            const temp = shuffled[index]
            shuffled[index] = shuffled[swapIndex]
            shuffled[swapIndex] = temp
        }
        return shuffled.slice(0,
            count)
    }

    /**
     * List the course's capstone milestone-tasks the learner has actually
     * REACHED, filtered to the requested difficulty pool. "Reached" reuses the
     * existing per-task progress signal from
     * {@link PersonalProjectProgressService.getProgress} (already computed for
     * the personal-project dashboard / `myCourseOutline` -- no new projection
     * needed): a task is reached when it has been attempted at least once
     * (`numAttempts > 0`), is already completed, OR is the learner's current
     * (first-uncompleted) task -- i.e. the task the learner has unlocked/is
     * working on right now, not one still locked further down the curriculum.
     * A learner with zero progress (no attempts, no completions) draws an
     * empty set here -> the caller falls back to classics only, which reads as
     * "study to unlock the capstone prompts".
     *
     * @param params - Course, enrollment, and the level's difficulty pool.
     * @returns the reached capstone prompts, in curriculum (sortIndex) order.
     */
    private async listReachedCapstonePrompts(
        params: ListReachedCapstonePromptsParams,
    ): Promise<Array<MockInterviewPromptCandidate>> {
        const {
            courseId,
            enrollmentId,
            difficultyPool,
        } = params

        const tasks = await this.entityManager.find(
            MilestoneTaskEntity,
            {
                where: {
                    milestone: {
                        course: {
                            id: courseId,
                        },
                    },
                },
                order: {
                    sortIndex: "ASC",
                },
            },
        )
        if (tasks.length === 0) {
            return []
        }

        const { completionTasks, currentTask } = await this.personalProjectProgressService.getProgress({
            enrollmentId,
            courseId,
        })
        const progressById = new Map(
            completionTasks.map((task) => [task.id,
                task]),
        )

        return tasks
            .filter((task) => {
                // difficulty is nullable on the entity -- fall back to medium so an
                // unset task can still be drawn, matching mockInterviewPrompts' own
                // fallback for consistency between listing and drawing
                const difficulty = task.difficulty ?? ChallengeDifficulty.Medium
                if (!difficultyPool.includes(difficulty)) {
                    return false
                }
                const progress = progressById.get(task.id)
                const reached = Boolean(progress?.completed)
                    || Boolean(progress && progress.numAttempts > 0)
                    || currentTask?.id === task.id
                return reached
            })
            .map((task) => ({
                id: task.id,
                title: task.title,
                difficulty: task.difficulty ?? ChallengeDifficulty.Medium,
                source: "capstone" as const,
            }))
    }

    /**
     * List the curated "classic" prompts, optionally filtered to a difficulty
     * pool (omit the filter to fall back to ANY classic -- the last-resort pool
     * so a draw can never come back empty).
     *
     * @param params - The difficulty pool to filter to (undefined = no filter), and the locale to render titles in.
     * @returns the matching classic prompts.
     */
    private listClassicPrompts(
        params: ListClassicPromptsParams,
    ): Array<MockInterviewPromptCandidate> {
        const {
            difficultyPool,
            locale,
        } = params
        return MOCK_INTERVIEW_CLASSIC_PROMPTS
            .filter((prompt: MockInterviewClassicPrompt) => !difficultyPool || difficultyPool.includes(prompt.difficulty as ChallengeDifficulty))
            .map((prompt) => ({
                id: prompt.id,
                title: prompt.title[locale],
                difficulty: prompt.difficulty as ChallengeDifficulty,
                source: "classic" as const,
            }))
    }

    /**
     * Pick one candidate uniformly at random from a non-empty pool.
     *
     * Uses `node:crypto`'s CSPRNG (not `Math.random`) -- the drawn capstone/
     * classic prompt is what the "design" session is graded against (see
     * {@link pickRandomFrom}'s doc for the full downstream chain into
     * job-readiness + the recruiter-facing talent ranking). A predictable draw
     * would let a candidate pre-select a prompt they already rehearsed instead
     * of drawing one blind.
     *
     * @param pool - The candidate pool (guaranteed non-empty by the caller -- classics always supply at least one).
     * @returns the drawn candidate.
     */
    private pickRandom(
        pool: Array<MockInterviewPromptCandidate>,
    ): MockInterviewPromptCandidate {
        const index = randomInt(pool.length)
        return pool[index]
    }

    /**
     * Persist the drawn session so `gradeMockInterviewSession` can look it back
     * up by id + enrollment and grade against the server-drawn prompt/level/mode.
     *
     * @param params - The already-resolved enrollment + level + mode + drawn identity + optional seed questions.
     * @returns the saved {@link MockInterviewSessionEntity} row.
     */
    private async persistSession(
        params: PersistMockInterviewSessionParams,
    ): Promise<MockInterviewSessionEntity> {
        const {
            enrollment,
            level,
            mode,
            promptId,
            promptTitle,
            difficulty,
            source,
            seedQuestions,
            countsToReadiness,
            name,
        } = params

        // retire the enrollment's previous in-flight draw (if any) BEFORE
        // persisting the new one, so resume-lookup never has two candidates --
        // "resume mock interview session" (2026-07-08).
        await this.entityManager.update(
            MockInterviewSessionEntity,
            {
                enrollment: {
                    id: enrollment.id,
                },
                status: "in_progress",
            },
            {
                status: "abandoned",
            },
        )

        return this.entityManager.save(
            MockInterviewSessionEntity,
            {
                enrollment,
                promptId,
                promptTitle,
                level,
                lang: params.lang ?? null,
                mode,
                difficulty,
                source,
                seedQuestions,
                countsToReadiness,
                status: "in_progress",
                turns: null,
                questionIndex: 0,
                phaseIndex: 0,
                // stored verbatim -- omitted/blank stays null, never
                // server-generated (the FE renders a time-based fallback)
                name: name?.trim() || null,
            },
        )
    }
}
