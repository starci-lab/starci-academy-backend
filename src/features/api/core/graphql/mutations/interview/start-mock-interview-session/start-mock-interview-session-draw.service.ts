import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    ChallengeDifficulty,
    ContentEntity,
    EnrollmentEntity,
    FlashcardLevel,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    MilestoneTaskEntity,
    ModuleEntity,
    MockInterviewEntity,
    MockInterviewKind,
    MockInterviewMode,
    MockInterviewSessionEntity,
    MOCK_INTERVIEW_QNA_KINDS,
    normalizeMockInterviewMode,
    UserContentEntity,
} from "@modules/databases"
import {
    FlashcardDeckReadService,
    PersonalProjectProgressService,
    UserService,
} from "@modules/bussiness"
import {
    ContentRagRetrievalService,
} from "@modules/rag"
import {
    MOCK_INTERVIEW_CLASSIC_PROMPTS,
} from "../../../queries/flashcard-decks/mock-interview-prompts/constants"
import type {
    MockInterviewClassicPrompt,
} from "../../../queries/flashcard-decks/mock-interview-prompts/types"
import {
    MockInterviewNoSeedCardsException,
} from "@modules/exceptions"
import type {
    DrawMockInterviewSeedTopic,
    DrawMockInterviewSessionParams,
    DrawMockInterviewSessionResult,
    MockInterviewGivenCodeVariant,
} from "./types"

/** One candidate prompt in the draw pool, normalized to a common shape regardless of source (mode="design" only). */
interface MockInterviewPromptCandidate {
    id: string
    title: string
    difficulty: ChallengeDifficulty
    source: "capstone" | "classic"
}

/**
 * Server-side seniority level literal the client may request. Any other
 * string collapses to {@link MockInterviewLevel.Middle} for pool selection —
 * the level is still echoed back on the persisted session/response as-is.
 */
enum MockInterviewLevel {
    Junior = "junior",
    Middle = "middle",
    Senior = "senior",
}

/**
 * Difficulty pool each level draws from — "senior" intentionally excludes
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
 * module — folding staff into the senior tier keeps the pool from going
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

/** How many flashcard seed questions a `mode="qna"` session draws by default (the "Tự động"/Auto default, and the "Tùy chỉnh"/Configurable fallback for an unrecognized `questionCount`). */
const QNA_SEED_COUNT = 5

/**
 * Every `questionCount` value the "Tùy chỉnh" (Configurable) setup screen's
 * "Số câu" control may request — an unrecognized/omitted value falls back to
 * {@link QNA_SEED_COUNT}.
 */
const ALLOWED_QNA_QUESTION_COUNTS: ReadonlyArray<number> = [3,
    5,
    10]

/** Max characters of a flashcard question kept as the seed topic's FE-facing preview title. */
const SEED_TITLE_MAX_CHARS = 120

/**
 * Minimum candidate-pool size a `mode="qna"` draw widens up to before giving
 * every retry real odds of drawing something different. A pool this small (or
 * smaller) still shuffles, but with so few candidates a retry keeps landing
 * back on the same 1-2 cards — indistinguishable from a hard-coded question.
 */
const MIN_QNA_POOL_SIZE = 3

/**
 * Draws ONE mock-interview session for a course + level + mode, server-side —
 * the Pha 2 integrity fix that replaces the FE's client-side `drawRandomPrompt`
 * random pick, EXTENDED (mode split, 2026-07-06) with a second draw path:
 *
 * - mode="design" — UNCHANGED: capstone milestone-tasks the learner has
 *   actually REACHED are tried first, falling back to the course-agnostic
 *   curated classics of the same difficulty pool, then to ANY classic (the
 *   14-prompt bank spans easy/medium/hard) so the draw can never come back empty.
 * - mode="qna" — draws {@link QNA_SEED_COUNT} flashcard-card topics from
 *   REACHED modules at the requested level, widening the pool (any level,
 *   then any module) rather than ever dead-ending, and assigns EACH drawn
 *   question its own cognitive frame (theory/reasoning/scenario) via a
 *   DETERMINISTIC per-seed hash — see {@link deriveSeedKind}.
 */
@Injectable()
export class MockInterviewSessionDrawService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly personalProjectProgressService: PersonalProjectProgressService,
        private readonly userService: UserService,
        private readonly flashcardDeckReadService: FlashcardDeckReadService,
        private readonly contentRagRetrievalService: ContentRagRetrievalService,
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
            locale,
            questionCount,
            kinds,
            countsToReadiness,
        } = params

        const normalizedLevel = this.normalizeLevel(level)
        const normalizedMode = normalizeMockInterviewMode(mode)
        // "design" has no configurable options at all — it always counts
        // towards job-readiness regardless of what the caller sends.
        const resolvedCountsToReadiness = normalizedMode === MockInterviewMode.Design
            ? true
            : countsToReadiness ?? true

        // resolve/create the trial enrollment ONCE — every downstream lookup
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
            })
            : this.drawQna({
                courseId,
                enrollment,
                level: normalizedLevel,
                lang,
                locale,
                questionCount,
                kinds,
                countsToReadiness: resolvedCountsToReadiness,
            })
    }

    /**
     * Normalize a raw `questionCount` request value to a known
     * {@link ALLOWED_QNA_QUESTION_COUNTS} member, falling back to
     * {@link QNA_SEED_COUNT} for anything unrecognized/omitted (never throws
     * — an unknown FE value must not break the draw).
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
        return ALLOWED_QNA_QUESTION_COUNTS.includes(value)
            ? value
            : QNA_SEED_COUNT
    }

    /**
     * Normalize a raw `kinds` request value to a non-empty subset of
     * {@link MOCK_INTERVIEW_QNA_KINDS} — an omitted/empty array, or one whose
     * every entry is unrecognized, falls back to ALL 3 kinds (the "Tất cả"/
     * "Tự động" behavior), matching the request field's own doc.
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
     * back to "middle" for anything unrecognized (never throws — an unknown
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
     * unrecognized/omitted (never throws — an unknown label must not break the
     * draw; a question with no matching body then uses its agnostic root).
     *
     * @param value - The raw `lang` field from the request.
     * @returns A known language literal ("typescript" | "java" | "csharp" | "go").
     */
    private normalizeLang(
        value: string | undefined,
    ): string {
        const known = new Set(["typescript", "java", "csharp", "go"])
        const candidate = (value ?? "").trim().toLowerCase()
        return known.has(candidate) ? candidate : "typescript"
    }

    /**
     * mode="design" draw path — UNCHANGED from before the mode split:
     * capstone-first (grounded in what THIS course teaches + already reached),
     * then same-difficulty classics, then — so the draw is NEVER empty — any
     * classic at all (the 14-prompt bank spans easy/medium/hard).
     *
     * @param params - Course, resolved enrollment, level, locale.
     * @returns the drawn (and persisted) design-mode session result.
     */
    private async drawDesign(
        params: {
            courseId: string
            enrollment: EnrollmentEntity
            level: MockInterviewLevel
            locale: Locale
            countsToReadiness: boolean
        },
    ): Promise<DrawMockInterviewSessionResult> {
        const {
            courseId,
            enrollment,
            level,
            locale,
            countsToReadiness,
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

        const pool = reachedCapstonePrompts.length > 0
            ? reachedCapstonePrompts
            : classicPrompts.length > 0
                ? classicPrompts
                : this.listClassicPrompts({
                    difficultyPool: undefined,
                    locale,
                })

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
     * mode="qna" draw path — draws {@link QNA_SEED_COUNT} flashcard-card seed
     * questions from REACHED modules at the requested level. Widens the pool
     * (never dead-ends): reached modules at the requested level → reached
     * modules at ANY level → ANY module at ANY level. Throws
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
        params: {
            courseId: string
            enrollment: EnrollmentEntity
            level: MockInterviewLevel
            lang?: string
            locale: Locale
            questionCount?: number
            kinds?: Array<string>
            countsToReadiness: boolean
        },
    ): Promise<DrawMockInterviewSessionResult> {
        const {
            courseId,
            enrollment,
            level,
            locale,
            countsToReadiness,
        } = params
        const levelPool = LEVEL_FLASHCARD_POOL[level]
        const resolvedQuestionCount = this.normalizeQuestionCount(params.questionCount)
        const resolvedKinds = this.normalizeKinds(params.kinds)
        // language chosen at session start — code questions render + grade in it
        const resolvedLang = this.normalizeLang(params.lang)

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
            lang: resolvedLang,
        })
        const useBank = bankCards.length > 0
        const allCards: Array<{ id: string, question: string, level: FlashcardLevel, moduleId: string | null, kind?: string, givenCodes?: Array<MockInterviewGivenCodeVariant> }> = useBank
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
        // widen PROGRESSIVELY until the pool is big enough for real variety —
        // "has at least 1 candidate" used to be the bar, which let an early
        // module with a single authored middle-level card lock every retry
        // onto that SAME card forever (a 1-card pool shuffles to itself every
        // time). Merging tiers (deduped) until the pool clears
        // `MIN_QNA_POOL_SIZE` keeps the higher-priority tier's cards first —
        // a module that already has plenty of reached-at-level cards never
        // widens at all — but tops up thin pools from the next tier so a
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
        // each drawn card's own cognitive frame — DETERMINISTIC (not
        // Math.random), derived from the card's own id + its position in the
        // draw, restricted to the requested kinds subset (all 3 for "Tự
        // động"/omitted), so the same card asked twice in different
        // positions can still land on a different kind while staying
        // reproducible for a given draw
        const seedTopics: Array<DrawMockInterviewSeedTopic> = drawnCards.map((card,
            index) => ({
            cardId: card.id,
            // bank questions carry their AUTHORED kind; flashcard seeds derive one
            kind: useBank && card.kind ? card.kind : this.deriveSeedKind(card.id,
                index,
                resolvedKinds),
            // bank questions are delivered VERBATIM by the interviewer → carry the
            // composed prompt (+ folded diagram); flashcard seeds keep a short title
            title: useBank ? card.question : this.truncateTitle(card.question),
            // editor (debug/review/optimize), one variant per authored language —
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
        // question OPENS (recruiter-screen warm-up — also lowers anxiety), and a
        // deep behavioral/situational STAR question CLOSES (the hiring-manager
        // behavioral round near the end). Bank sessions only (flashcard-fallback
        // courses have no EQ concept). Either draw may be null (bank not seeded) —
        // the session still works, just without that bookend.
        if (useBank) {
            const eqOpener = await this.drawEqQuestion(level,
                ["culture"])
            const eqCloser = await this.drawEqQuestion(level,
                ["behavioral", "situational"],
                eqOpener?.cardId)
            if (eqCloser) {
                seedTopics.push(eqCloser)
            }
            if (eqOpener) {
                seedTopics.unshift(eqOpener)
            }
        }

        // synthetic prompt identity for a qna-mode session — there is no single
        // "prompt", so promptId/promptTitle summarize the draw instead
        const promptId = `qna-${enrollment.id}-${Date.now()}`
        const promptTitle = `${seedTopics.length} câu · Ngẫu nhiên`
        const difficulty = this.levelToDifficulty(level)

        const session = await this.persistSession({
            enrollment,
            level,
            lang: resolvedLang,
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
     * "Tùy chỉnh"/Configurable "Kiểu câu" multi-select subset — all 3 for
     * "Tự động"/omitted) — NOT `Math.random` (the workflow this draw runs
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
        // simple, fast, dependency-free string hash (djb2 variant) — only needs
        // to spread inputs roughly evenly across the allowed kinds, not
        // cryptographic strength
        let hash = 5381
        for (let charIndex = 0; charIndex < input.length; charIndex += 1) {
            hash = (hash * 33 + input.charCodeAt(charIndex)) | 0
        }
        const bucket = Math.abs(hash) % allowedKinds.length
        return allowedKinds[bucket]
    }

    /**
     * List the ids of modules the learner has actually REACHED in this course
     * — a module counts as reached when it has at least one READ lesson
     * (content), OR it is the first module (in sort order) that still has an
     * unread lesson (i.e. the module the learner is CURRENTLY in, mirroring
     * `myCourseOutline`'s `resolveNextContentTask` at module granularity
     * instead of lesson granularity). A brand-new learner (zero read lessons)
     * reaches only the very first module — the draw's own pool-widening then
     * falls through to "any module" rather than treating that as an error.
     *
     * @param params - Course + enrollment to scope the read-flag lookup to.
     * @returns the set of reached module ids, in no particular order.
     */
    private async listReachedModuleIds(
        params: {
            courseId: string
            enrollmentId: string
        },
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
            // CURRENT module (already-unlocked, not yet finished) — reached, but
            // stop granting "current module" status to any module after it
            if (!currentModuleClaimed && hasUnreadLesson) {
                reached.add(module.id)
                currentModuleClaimed = true
            }
        }
        return reached
    }

    /**
     * Load every flashcard card seeded under a course, fully localized —
     * flattened from every deck (deck→course, `FlashcardDeckReadService`
     * already loads + localizes the full cards graph).
     *
     * @param params - Course to scope decks to, and locale to localize into.
     * @returns a flat array of every card in the course, each carrying its
     *   owning `moduleId` (resolved from the card's deck's linked modules —
     *   TODO: a deck can reference multiple modules; this takes the FIRST
     *   linked module as the card's module for the reached-module filter,
     *   which is correct for every current deck (one deck per module today)).
     */
    private async listCourseFlashcardCards(
        params: {
            courseId: string
            locale: Locale
        },
    ): Promise<Array<{ id: string, question: string, level: FlashcardLevel, moduleId: string | null }>> {
        const {
            courseId,
            locale,
        } = params
        const decks = await this.flashcardDeckReadService.listByCourse(
            courseId,
            locale,
        )
        // moduleId per deck is now derived via RAG (the deck→module relation was
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
                // level is nullable on the entity (legacy cards) — fall back to
                // middle so an unset card can still be drawn at the middle tier
                level: card.level ?? FlashcardLevel.Middle,
                moduleId,
            }))
        }))
        return perDeck.flat()
    }

    /**
     * Resolve the module a flashcard deck belongs to via RAG — semantic-search the
     * course's indexed content for the deck's topic and return the best-matching
     * lesson's owning module id. Replaces the removed deck→module relation: the
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
     * Draw ONE behavioral/EQ question from the GLOBAL bank (not course-scoped —
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
     * qna pool logic expects — but sourced from `mock_interviews` (authored
     * prompts) instead of flashcards. `question` is the FULL composed prompt
     * (authored `prompt` + any given diagram/code folded in as Markdown so the
     * room renders them inline) that the interviewer delivers VERBATIM; `kind`
     * is the AUTHORED kind (not derived), so each seed keeps its designed frame.
     * Empty when the course has no interview bank yet → caller falls back to
     * flashcard-seed (non-breaking for un-authored courses).
     */
    private async listCourseInterviewQuestions(
        params: {
            courseId: string
            /** Session language — resolves each code question to its `bodies/<lang>` prompt + givenCode (fallback: first body, then agnostic root). */
            lang?: string
        },
    ): Promise<Array<{ id: string, question: string, level: FlashcardLevel, moduleId: string | null, kind: string, givenCodes: Array<MockInterviewGivenCodeVariant> }>> {
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
        return questions.map((question) => {
            // fold the prose prompt + any GIVEN diagram into the delivered `question`
            // (the diagram is CONTEXT the candidate reasons over — it stays inline in
            // the chat bubble), but keep the GIVEN CODE SEPARATE so the FE can seed it
            // into an editable code editor for the candidate to FIX in place, instead
            // of rendering it read-only alongside the question (`debug`/`review`/
            // `optimize` questions). See the mock-interview WORKSPACE-ARTIFACT-SEED brainstorm.
            // Per-language bodies/ carry this stack's OWN prompt + givenCode (+ an
            // idealAnswer used at grade time). Resolve the session language's body;
            // fall back to the first authored body, then to the agnostic root prompt.
            const bodies = [...(question.langs ?? [])]
                .sort((left, right) => left.sortIndex - right.sortIndex)
            const chosenBody = bodies.find((body) => body.lang === params.lang)
                ?? bodies[0]
                ?? null
            // body prompt (per-language) wins; root prompt is the agnostic fallback
            // (empty for a full-4-body code question, populated for legacy/no-code)
            const promptText = (chosenBody?.prompt ?? question.prompt) ?? ""
            const parts = [promptText]
            if (question.diagram) {
                parts.push(question.diagram)
            }
            // deliver ONLY the chosen language's given code (lang was picked at
            // session start) — legacy single-`givenCode` questions fall back to it.
            const langVariants: Array<MockInterviewGivenCodeVariant> = chosenBody
                ? [{
                    lang: chosenBody.lang, code: chosenBody.givenCode,
                }]
                : question.givenCode
                    ? [{
                        lang: question.givenLang ?? "agnostic", code: question.givenCode,
                    }]
                    : []
            return {
                id: question.id,
                question: parts.join("\n\n"),
                level: this.tierToFlashcardLevel(question.tier),
                moduleId: question.moduleId,
                kind: question.kind,
                givenCodes: langVariants,
            }
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
     * Strips a wrapping Markdown code fence (```lang\n…\n```) off an authored
     * `given_code` value — `interview_questions.given_code` is a PLAIN editor
     * buffer (seeded verbatim into the FE's Monaco tab), not Markdown, but at
     * least one authored row was pasted in straight from a Markdown draft with
     * the fence left on, so it leaked into the editor as literal text. Only
     * strips when the WHOLE string is one fence (first line is the opener,
     * last line is a bare closer) — never touches legitimate ``` occurring
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
     * — this is the pool's difficulty).
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
     * `minSize`, deduping by id — a tier only gets pulled in when the tiers
     * before it didn't already clear the bar, so a module with plenty of
     * reached-at-level cards never widens at all; a thin pool tops up from the
     * next tier instead of being replaced outright, so the in-priority cards
     * are still drawn most often, just no longer the ONLY thing ever drawn.
     *
     * @param params - The tiers to merge (in priority order) + the target minimum pool size.
     * @returns the merged, deduped pool — at least `minSize` long when enough distinct candidates exist across every tier combined.
     */
    private buildQnaPool<Type extends { id: string }>(
        params: {
            tiers: ReadonlyArray<Array<Type>>
            minSize: number
        },
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
     * pool (fewer than `count` available → returns every candidate, shuffled).
     *
     * @param pool - The candidate pool (may contain fewer than `count` items).
     * @param count - How many to draw.
     * @returns the drawn candidates, shuffled, capped at `count`.
     */
    private pickRandomMany<Type>(
        pool: Array<Type>,
        count: number,
    ): Array<Type> {
        // Fisher–Yates shuffle a shallow copy, then take the first `count`
        const shuffled = [...pool]
        for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1))
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
     * the personal-project dashboard / `myCourseOutline` — no new projection
     * needed): a task is reached when it has been attempted at least once
     * (`numAttempts > 0`), is already completed, OR is the learner's current
     * (first-uncompleted) task — i.e. the task the learner has unlocked/is
     * working on right now, not one still locked further down the curriculum.
     * A learner with zero progress (no attempts, no completions) draws an
     * empty set here → the caller falls back to classics only, which reads as
     * "study to unlock the capstone prompts".
     *
     * @param params - Course, enrollment, and the level's difficulty pool.
     * @returns the reached capstone prompts, in curriculum (sortIndex) order.
     */
    private async listReachedCapstonePrompts(
        params: {
            courseId: string
            enrollmentId: string
            difficultyPool: ReadonlyArray<ChallengeDifficulty>
        },
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
                // difficulty is nullable on the entity — fall back to medium so an
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
     * pool (omit the filter to fall back to ANY classic — the last-resort pool
     * so a draw can never come back empty).
     *
     * @param params - The difficulty pool to filter to (undefined = no filter), and the locale to render titles in.
     * @returns the matching classic prompts.
     */
    private listClassicPrompts(
        params: {
            difficultyPool: ReadonlyArray<ChallengeDifficulty> | undefined
            locale: Locale
        },
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
     * @param pool - The candidate pool (guaranteed non-empty by the caller — classics always supply at least one).
     * @returns the drawn candidate.
     */
    private pickRandom(
        pool: Array<MockInterviewPromptCandidate>,
    ): MockInterviewPromptCandidate {
        const index = Math.floor(Math.random() * pool.length)
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
        params: {
            enrollment: EnrollmentEntity
            level: MockInterviewLevel
            lang?: string | null
            mode: MockInterviewMode
            promptId: string
            promptTitle: string
            difficulty: ChallengeDifficulty
            source: string
            seedQuestions: Array<{ cardId: string, kind: string, title: string, givenCodes: Array<MockInterviewGivenCodeVariant> }> | null
            countsToReadiness: boolean
        },
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
        } = params

        // retire the enrollment's previous in-flight draw (if any) BEFORE
        // persisting the new one, so resume-lookup never has two candidates —
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
            },
        )
    }
}
