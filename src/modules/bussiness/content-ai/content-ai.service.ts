import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import type {
    BaseMessage,
} from "@langchain/core/messages"
import {
    ChallengeEntity,
    ContentAiMessageEntity,
    ContentAiSessionEntity,
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    S3NameResolverService,
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    ContentAiSessionTitleTooLongException,
    ContentNotFoundException,
    PremiumContentAiAccessDeniedException,
} from "@modules/exceptions"
import {
    ContentRagRetrievalService,
} from "@modules/rag"
import {
    envConfig,
} from "@modules/env"
import {
    UserService,
} from "../user"

/**
 * Which surface a content-AI question is grounded on. A session is one
 * `(scope + anchor)`; the scope selects WHICH grounding path runs:
 * - `"content"`: a course lesson/content item (MinIO body + repo code, premium-gated).
 * - `"task"`: a capstone / personal-project task (milestone RAG chunk, enrolled-only).
 * - `"foundation"`: a global foundation-library doc (single-doc RAG, no course gate).
 * - `"course"`: the whole course (course-wide RAG, enrolled-only).
 */
export type ContentAiScope = "content" | "task" | "challenge" | "foundation" | "course"

/** One prior chat turn replayed to the model as short-term memory. */
export interface ContentAiHistoryMessage {
    /** Author of the turn: `"user"` or `"assistant"`. */
    role: string
    /** The message text. */
    content: string
}

/** A conversation in the session list / search results. */
export interface ContentAiSessionSummary {
    /** Session id. */
    id: string
    /** Conversation title (null until the first question auto-titles it). */
    title: string | null
    /** Last-activity timestamp (drives recency ordering). */
    updatedAt: Date
    /** Number of turns in the conversation. */
    messageCount: number
    /** Which surface the conversation grounds on. */
    scope: ContentAiScope
    /** Content the conversation is anchored to (content scope only; null otherwise). */
    originContentId: string | null
    /** Title of the anchoring content (only resolved for cross-lesson search results). */
    originContentTitle: string | null
    /** First message matching the search query (only for search results). */
    snippet: string | null
}

/** Params for {@link ContentAiService.prepareMessages}. */
export interface PrepareContentAiMessagesParams {
    /** The asking learner (drives the premium-content entitlement gate). */
    userId: string
    /** Lesson content the question is about (lesson scope). */
    contentId?: string | null
    /** Capstone / personal-project task the question is about (task scope). */
    taskId?: string | null
    /** Hands-on challenge the question is about (challenge scope, enrolled-only). */
    challengeId?: string | null
    /** Global foundation-library doc the question is about (foundation scope). */
    foundationId?: string | null
    /** Course the question is about when no lesson/task/foundation is open (course scope, enrolled-only). */
    courseId?: string | null
    /** The learner's question about this content. */
    question: string
    /** Recent prior turns (oldest first) for short-term memory; capped here. */
    history?: Array<ContentAiHistoryMessage>
    /** Active request locale — reply language + which body locale to load. */
    locale: Locale
}

/**
 * Rolling TOKEN-BUDGET window for replayed history (behaves like a general chat
 * app, not a flat message count): a content-AI call may fill up to
 * {@link MAX_INPUT_CHARS} of input (grounding + history + question); whatever is
 * left after grounding + the question + a reserved slice for the answer becomes
 * the budget for prior turns. So a big-grounding lesson keeps fewer turns and a
 * small one keeps far more than the old flat cap of 8. Measured in CHARS (not
 * tokens) to match {@link MAX_CODE_STUFF_CHARS}.
 *
 * TUNED TO THE HOST'S ACTUAL num_ctx, not the model's native max. History (this
 * budget) + grounding + the question must all fit the loaded context or Ollama
 * silently truncates the prompt HEAD (= the grounding). 2026-07-18: the local
 * `qwen2.5-coder:7b` was loading at Ollama's DEFAULT num_ctx=4096 (grounding was
 * being truncated!); it's now baked to **num_ctx=8192** via a Modelfile
 * (`PARAMETER num_ctx 8192`, persists across restarts). The 8 GB RTX 5060 caps it
 * there — at 8192 ~17% of layers offload to CPU (still ~43 tok/s, fine); 32768
 * would OOM. So the full input budget is ~8192 tokens ≈ ~24k chars (Vietnamese/
 * code ~3 chars/token, under-counted for safety). If num_ctx changes, scale this.
 */
const MAX_INPUT_CHARS = 24000
/** Input chars kept free for the model's own answer (never spent on history);
 *  ~1k tokens of reply at ~3 chars/token. */
const RESPONSE_RESERVE_CHARS = 3000
/** Absolute safety bound on how many recent turns we even walk — the token budget
 * is the real gate; this only stops a pathological history array. */
const MAX_HISTORY_MESSAGES = 100

/**
 * Upper bound (chars) on the stuffed grounding when the FULL lesson code is
 * included alongside the body. Under it we feed the tutor the whole body + every
 * repo file (so it can read/explain any part of the lesson's source, even for a
 * short lesson); over it we fall back to RAG chunk retrieval to stay inside the
 * free local model's context window. ~24k chars ≈ ~6k tokens of grounding — the
 * real lesson source (lockfiles/vendored dirs filtered out) fits well under this.
 */
const MAX_CODE_STUFF_CHARS = 24000

/**
 * Repo files skipped when stuffing the lesson's full source: generated lockfiles
 * and minified/sourcemap artifacts. (`node_modules`/`dist`/`build`/`.git` are
 * already dropped by the repo synchronizer, but a committed lockfile still lands
 * in the file map and would blow the budget with noise the tutor never needs.)
 */
const NON_SOURCE_CODE_FILE = /(?:^|\/)(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$|\.lock$|\.min\.(?:js|css)$|\.map$/i

/**
 * Shared content-AI tutoring logic: turns a `(content, question, history)` into
 * the grounded LangChain messages to send to the model.
 *
 * Used by both the one-shot `askContentAi` mutation and the streaming
 * `/content_ai` socket gateway so the grounding + premium gate live in one
 * place. NOTE: content AI is free-tier — there is intentionally NO AI-credit
 * gate here; callers invoke the free local model only.
 */
@Injectable()
export class ContentAiService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly userService: UserService,
        private readonly contentRagRetrievalService: ContentRagRetrievalService,
    ) { }

    /**
     * Build the grounded chat messages for a content-AI question: load the
     * lesson body from MinIO, enforce the premium-content gate, then assemble
     * `system prompt + capped history + new question`.
     *
     * @param params - {@link PrepareContentAiMessagesParams}.
     * @returns The ordered messages to invoke/stream against the model.
     * @throws ContentNotFoundException when the content body is missing.
     * @throws PremiumContentAiAccessDeniedException when premium content is not entitled.
     */
    async prepareMessages(
        {
            userId,
            contentId,
            taskId,
            challengeId,
            foundationId,
            courseId,
            question,
            history,
            locale,
        }: PrepareContentAiMessagesParams,
    ): Promise<{ messages: Array<BaseMessage> }> {
        // Dispatch grounding by scope. Priority contentId > taskId > foundationId:
        // a lesson page always grounds on its lesson; a capstone-task or foundation
        // page carries no contentId and grounds on its own material instead. Guard:
        // at least one anchor id is required.
        let grounding: string
        let scope: ContentAiScope
        if (contentId) {
            grounding = await this.resolveLessonGrounding({
                userId,
                contentId,
                question,
                locale,
            })
            scope = "content"
        } else if (taskId) {
            grounding = await this.resolveTaskGrounding({
                userId,
                taskId,
                question,
            })
            scope = "task"
        } else if (challengeId) {
            grounding = await this.resolveChallengeGrounding({
                userId,
                challengeId,
                question,
            })
            scope = "challenge"
        } else if (foundationId) {
            grounding = await this.resolveFoundationGrounding({
                userId,
                foundationId,
                question,
            })
            scope = "foundation"
        } else if (courseId) {
            grounding = await this.resolveCourseGrounding({
                userId,
                courseId,
                question,
            })
            scope = "course"
        } else {
            throw new ContentNotFoundException({
            })
        }

        // replay recent turns as a ROLLING TOKEN-BUDGET window: keep as many of the
        // NEWEST turns as fit in the input left after grounding + the question + the
        // answer reserve, walking newest→oldest and stopping at the budget. A large
        // lesson (big grounding) keeps fewer turns; a small one keeps many — the
        // long-conversation memory a general chat app has, without overflowing the
        // free local model's context.
        const systemPromptText = this.buildSystemPrompt(grounding,
            locale,
            scope)
        const historyBudgetChars = Math.max(
            0,
            MAX_INPUT_CHARS - systemPromptText.length - question.length - RESPONSE_RESERVE_CHARS,
        )
        const windowedHistory: Array<ContentAiHistoryMessage> = []
        let usedChars = 0
        for (const message of (history ?? []).slice(-MAX_HISTORY_MESSAGES).reverse()) {
            usedChars += message.content.length
            if (usedChars > historyBudgetChars) {
                break
            }
            // rebuild oldest-first as we accept newest-first
            windowedHistory.unshift(message)
        }
        const historyMessages = windowedHistory.map((message) => message.role === "assistant"
            ? new AIMessage(message.content)
            : new HumanMessage(message.content))
        const messages: Array<BaseMessage> = [
            new SystemMessage(systemPromptText),
            ...historyMessages,
            new HumanMessage(question),
        ]
        return {
            messages,
        }
    }

    /**
     * Lesson-scope grounding: load the lesson body from MinIO, enforce the
     * premium-content gate, then stuff the whole body (+ full repo code) or
     * RAG-retrieve for large lessons. Extracted verbatim from the original
     * `prepareMessages` body so the task/foundation scopes dispatch alongside it.
     *
     * @param params - The learner, the content id, the question, and the locale.
     * @returns The grounding text for the lesson system prompt.
     * @throws ContentNotFoundException when the content body is missing.
     * @throws PremiumContentAiAccessDeniedException when premium content is not entitled.
     */
    private async resolveLessonGrounding(
        {
            userId,
            contentId,
            question,
            locale,
        }: {
            userId: string
            contentId: string
            question: string
            locale: Locale
        },
    ): Promise<string> {
        // The lesson body lives in MinIO (the Postgres `body` column is empty for
        // snapshot-backed content) — load it the same way the content reader does,
        // NOT from `ContentEntity.body`, or the model is grounded on an empty body
        // and replies "I'm not sure, the content wasn't provided".
        const objectKey = this.s3NameResolverService.content(
            contentId,
            locale,
        )
        const content = await this.s3ReadService.json<ContentEntity>({
            key: objectKey,
            provider: S3Provider.Minio,
        })
        if (!content) {
            throw new ContentNotFoundException({
                id: contentId,
            })
        }

        // Premium gate: source the premium flag + owning course from the live DB
        // row and block ungranted premium content (a non-enrolled viewer could
        // otherwise pull a locked lesson's full body out through the AI).
        const row = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id: contentId,
                },
                relations: {
                    module: {
                        course: true,
                    },
                },
                select: {
                    id: true,
                    isPremium: true,
                    module: {
                        id: true,
                        course: {
                            id: true,
                        },
                    },
                },
            },
        )
        const isPremium = row?.isPremium ?? content.isPremium
        const courseId = row?.module?.course?.id
        if (isPremium) {
            const entitled = courseId
                ? await this.userService.checkEnrollment(userId,
                    courseId)
                : false
            if (!entitled) {
                throw new PremiumContentAiAccessDeniedException({
                    userId,
                    contentId,
                })
            }
        }

        // ground the answer: stuff the whole body for small lessons (cheap, no
        // retrieval miss), else RAG-retrieve the most relevant chunks for large ones
        const body = this.resolveBodyText(content,
            locale)
        return this.resolveGrounding({
            content,
            contentId,
            question,
            body,
        })
    }

    /**
     * Task-scope grounding: pull the capstone / personal-project task's brief +
     * acceptance-criteria chunks from the content RAG index. Milestone chunks are
     * written with `metadata.contentId = taskId` (shared UUID id-space), so the
     * same single-doc retrieval the lesson scope uses returns exactly this task's
     * material. Degrades to an empty excerpt (un-grounded) when the index is
     * absent / retrieval misses — retrieval never blocks the chat.
     *
     * Entitlement: capstone material is ENROLLED-ONLY. We resolve the task's
     * owning course (task → milestone → course) and gate on enrollment; a
     * non-enrolled viewer gets an empty excerpt (no leak), so the model never
     * reveals capstone briefs/criteria through the AI. Mirrors the course scope.
     *
     * @param params - The learner, the task id, and the question.
     * @returns The grounding text, or empty when the viewer is not enrolled.
     */
    private async resolveTaskGrounding(
        {
            userId,
            taskId,
            question,
        }: {
            userId: string
            taskId: string
            question: string
        },
    ): Promise<string> {
        // resolve the task's owning course so we can enforce the enrolled-only gate
        const courseId = await this.resolveCourseIdOfTask(taskId)
        const entitled = courseId
            ? await this.userService.checkEnrollment(userId,
                courseId)
            : false
        if (!entitled) {
            return ""
        }
        const {
            excerpt,
        } = await this.contentRagRetrievalService.retrieveContentExcerpt({
            contentId: taskId,
            query: question,
        })
        return excerpt
    }

    /**
     * Challenge-scope grounding: pull a hands-on challenge's brief + steps + test
     * cases from the content RAG index. Challenge chunks are written with
     * `metadata.contentId = challengeId` (shared UUID id-space, `kind = "challenge"`),
     * so the same single-doc retrieval the lesson scope uses returns exactly this
     * challenge's material.
     *
     * Entitlement: ENROLLED-ONLY, mirroring the task scope. We resolve the
     * challenge's owning course (challenge → content → module → course) and gate on
     * enrollment; a non-enrolled viewer gets an empty excerpt (no leak), so the
     * model never reveals a challenge's brief / test cases through the AI.
     *
     * @param params - The learner, the challenge id, and the question.
     * @returns The grounding text, or empty when the viewer is not enrolled.
     */
    private async resolveChallengeGrounding(
        {
            userId,
            challengeId,
            question,
        }: {
            userId: string
            challengeId: string
            question: string
        },
    ): Promise<string> {
        // resolve the challenge's owning course so we can enforce the enrolled-only gate
        const courseId = await this.resolveCourseIdOfChallenge(challengeId)
        const entitled = courseId
            ? await this.userService.checkEnrollment(userId,
                courseId)
            : false
        if (!entitled) {
            return ""
        }
        const {
            excerpt,
        } = await this.contentRagRetrievalService.retrieveContentExcerpt({
            contentId: challengeId,
            query: question,
        })
        return excerpt
    }

    /**
     * Foundation-scope grounding: single-doc RAG over one GLOBAL foundation-
     * library document. Foundation entities are NOT course-scoped (they belong to
     * a foundation-category and carry no courseId), so there is intentionally NO
     * premium / enrollment gate — the foundation library is global. Chunks are
     * indexed with `metadata.contentId = foundationId`, so the lesson scope's
     * single-doc retrieval returns this foundation's material. Degrades to an
     * empty excerpt when the index is absent / retrieval misses.
     *
     * @param params - The learner, the foundation id, and the question.
     * @returns The grounding text for the foundation system prompt.
     */
    private async resolveFoundationGrounding(
        {
            userId,
            foundationId,
            question,
        }: {
            userId: string
            foundationId: string
            question: string
        },
    ): Promise<string> {
        // userId is accepted for signature symmetry with the other scopes; a
        // global foundation doc needs no per-user gate, so it is unused here.
        void userId
        const {
            excerpt,
        } = await this.contentRagRetrievalService.retrieveContentExcerpt({
            contentId: foundationId,
            query: question,
        })
        return excerpt
    }

    /**
     * Course-scope grounding: course-wide RAG for a surface with no material of its
     * own (mind-map, leaderboard, the course home, …).
     *
     * ENROLLED-ONLY, deliberately. `retrieveCourseExcerpt` on this branch has no
     * premium-exclusion filter (the `excludeContentIds` widening lives in the
     * still-uncommitted `content-ai-chat-app-wide` work), so answering a
     * non-enrolled viewer course-wide could surface premium lessons the RAG index
     * holds. Until that filter lands, we gate: enrolled → full course RAG; not
     * enrolled → NO course grounding (empty excerpt, the model answers from general
     * knowledge, never from premium course material). This trades the trial→paid
     * "chat about the whole course" funnel for safety; re-enable trial course chat
     * with premium exclusion once app-wide lands.
     * TODO(content-ai-rail-scope): swap the gate for excludeContentIds-based
     * premium filtering when `retrieveCourseExcerpt` gains that param on mtp.
     *
     * @param params - The learner, the course id, and the question.
     * @returns The grounding text, or empty when the viewer is not enrolled.
     */
    private async resolveCourseGrounding(
        {
            userId,
            courseId,
            question,
        }: {
            userId: string
            courseId: string
            question: string
        },
    ): Promise<string> {
        const enrolled = await this.userService.checkEnrollment(userId,
            courseId)
        if (!enrolled) {
            return ""
        }
        const {
            excerpt,
        } = await this.contentRagRetrievalService.retrieveCourseExcerpt({
            courseId,
            query: question,
        })
        return excerpt
    }

    /**
     * Resolve the text to ground the answer on. The tutor must be able to read the
     * lesson's FULL source — not just the prose, and not only for large lessons — so
     * for a lesson that ships code we prefer to stuff the WHOLE body + EVERY repo
     * file (a short lesson previously stuffed body-only, hiding its code):
     *
     * - **Has code, and body + full code ≤ {@link MAX_CODE_STUFF_CHARS}**: stuff the
     *   whole lesson (body + all repo files). The tutor sees every file, so it can
     *   read/explain any snippet the student points at — regardless of lesson size.
     * - **Has code but too big to stuff**: RAG-retrieve the top-k most relevant chunks
     *   (body + code, filtered to this content) so the prompt stays within the free
     *   local model's context window.
     * - **No code (prose-only lesson)**: small body → stuff whole; large body → RAG.
     *
     * Falls back to the whole body whenever retrieval misses/fails/index absent — so
     * the chat never degrades below body-only grounding.
     *
     * @param params - The content snapshot, its id, the question, and the whole body.
     * @returns The grounding text to put in the system prompt.
     */
    private async resolveGrounding(
        {
            content,
            contentId,
            question,
            body,
        }: {
            content: ContentEntity
            contentId: string
            question: string
            body: string
        },
    ): Promise<string> {
        // full lesson code (all repo files) — "" for a prose-only lesson
        const code = await this.loadFullCode(content)

        if (code) {
            const stuffed = `${body}\n\n=== LESSON CODE (full source) ===\n${code}`
            // whole lesson fits → stuff body + every file (reads any snippet, any size)
            if (stuffed.length <= MAX_CODE_STUFF_CHARS) {
                return stuffed
            }
            // too big for the local model → RAG the most relevant body+code chunks
            const { excerpt } = await this.contentRagRetrievalService.retrieveContentExcerpt({
                contentId,
                query: question,
            })
            return excerpt.trim()
                ? excerpt
                : stuffed.slice(0,
                    MAX_CODE_STUFF_CHARS)
        }

        // prose-only lesson: small → stuff whole; large → RAG (fallback to body)
        if (body.length <= envConfig().services.contentRag.stuffCharThreshold) {
            return body
        }
        const { excerpt } = await this.contentRagRetrievalService.retrieveContentExcerpt({
            contentId,
            query: question,
        })
        return excerpt.trim()
            ? excerpt
            : body
    }

    /**
     * Read a lesson's FULL source from MinIO — every repo file concatenated (each
     * prefixed with its path), or "" for a prose-only lesson (no code in MinIO).
     *
     * Mirrors the repo-file read the lesson RAG indexer uses: the synchronizer
     * writes the Sandpack file map to `repo/<repoName>/<githubDir>.json` where
     * `repoName` is the last path segment of `githubBaseUrl`. Non-fatal: any
     * read/parse failure returns "" so grounding degrades to body-only.
     *
     * @param content - The content snapshot (needs `isSandbox`/`githubBaseUrl`/`githubDir`).
     * @returns The concatenated source, or "" when the lesson ships no code.
     */
    private async loadFullCode(
        content: ContentEntity,
    ): Promise<string> {
        if (!content.isSandbox || !content.githubBaseUrl || !content.githubDir) {
            return ""
        }
        const repoName = content.githubBaseUrl.split("/").at(-1)
        if (!repoName) {
            return ""
        }
        try {
            const files = await this.s3ReadService.json<Record<string, { code: string }>>({
                key: this.s3NameResolverService.repo(repoName,
                    content.githubDir),
                provider: S3Provider.Minio,
            })
            const parts: Array<string> = []
            for (const [
                filePath,
                file,
            ] of Object.entries(files ?? {
                })) {
                // skip lockfiles / minified artifacts / stray vendored files — real
                // source only, so the budget isn't wasted on noise the tutor ignores
                if (NON_SOURCE_CODE_FILE.test(filePath) || filePath.includes("node_modules/")) {
                    continue
                }
                if (!file.code?.trim()) {
                    continue
                }
                parts.push(`// ${filePath}\n${file.code}`)
            }
            return parts.join("\n\n")
        } catch {
            // MinIO miss / parse failure → degrade to body-only grounding
            return ""
        }
    }

    /**
     * Resolve the lesson markdown to ground on. Snapshot-backed content keeps the
     * V1 scalar `body` EMPTY and stores the real lesson under the V2 `bodies`
     * buckets (one per language variant, each with per-locale `translations`) —
     * so reading `content.body` alone grounds the model on an empty body and it
     * replies "the content wasn't provided". Prefer the localized text of the
     * first non-empty bucket (the prose is shared across language variants;
     * tutoring doesn't need all four), falling back to the legacy scalar body.
     *
     * @param content - The content snapshot loaded from MinIO.
     * @param locale - The request locale (selects the body translation).
     * @returns The lesson markdown, or empty string when none is available.
     */
    private resolveBodyText(
        content: ContentEntity,
        locale: Locale,
    ): string {
        // V1 legacy scalar body, when populated
        if (content.body && content.body.trim()) {
            return content.body
        }
        // V2 bodies[]: take the first bucket's localized (or default) markdown
        for (const bucket of content.bodies ?? []) {
            const translated = (bucket.translations ?? [])
                .find((translation) => translation.locale === locale)?.body
            const text = translated ?? bucket.body
            if (text && text.trim()) {
                return text
            }
        }
        return ""
    }

    /**
     * Resolve the enrollment id for `(user, the content's owning course)`.
     *
     * Course-scoped data keys off the enrollment (not the raw user). Trial rows
     * (`is_enrolled = false`) count — a learner reading/asking about a lesson has
     * an enrollment row whether or not they have paid.
     *
     * @param userId - The asking learner.
     * @param contentId - Content whose course the enrollment is resolved against.
     * @returns The enrollment id, or `null` when none exists / the course is unknown.
     */
    private async resolveEnrollmentId(
        userId: string,
        contentId: string,
    ): Promise<string | null> {
        const row = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id: contentId,
                },
                relations: {
                    module: {
                        course: true,
                    },
                },
                select: {
                    id: true,
                    module: {
                        id: true,
                        course: {
                            id: true,
                        },
                    },
                },
            },
        )
        const courseId = row?.module?.course?.id
        if (!courseId) {
            return null
        }
        return this.resolveEnrollmentByCourse(userId,
            courseId)
    }

    /**
     * Resolve the enrollment id for `(user, course)` directly. Trial rows
     * (`is_enrolled = false`) count — an enrollment row exists whether or not the
     * learner has paid. Used to anchor task / course sessions (whose course is
     * known without a content lookup).
     *
     * @param userId - The asking learner.
     * @param courseId - The course to resolve the enrollment against.
     * @returns The enrollment id, or `null` when the learner has no enrollment row.
     */
    private async resolveEnrollmentByCourse(
        userId: string,
        courseId: string,
    ): Promise<string | null> {
        const rows = await this.entityManager.query<Array<{ id: string }>>(
            "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 LIMIT 1",
            [
                userId,
                courseId,
            ],
        )
        return rows[0]?.id ?? null
    }

    /**
     * Resolve a task's owning course (task → milestone → course), so a task session
     * can be anchored to the right enrollment.
     *
     * @param taskId - The capstone / personal-project task.
     * @returns The owning course id, or `null` when the task / course is unknown.
     */
    private async resolveCourseIdOfTask(
        taskId: string,
    ): Promise<string | null> {
        const task = await this.entityManager.findOne(
            MilestoneTaskEntity,
            {
                where: {
                    id: taskId,
                },
                relations: {
                    milestone: {
                        course: true,
                    },
                },
                select: {
                    id: true,
                    milestone: {
                        id: true,
                        course: {
                            id: true,
                        },
                    },
                },
            },
        )
        return task?.milestone?.course?.id ?? null
    }

    /**
     * Resolve a challenge's owning course (challenge → content → module → course),
     * so a challenge session can be anchored to the right enrollment / gated.
     *
     * @param challengeId - The hands-on challenge.
     * @returns The owning course id, or `null` when the challenge / course is unknown.
     */
    private async resolveCourseIdOfChallenge(
        challengeId: string,
    ): Promise<string | null> {
        const challenge = await this.entityManager.findOne(
            ChallengeEntity,
            {
                where: {
                    id: challengeId,
                },
                relations: {
                    content: {
                        module: {
                            course: true,
                        },
                    },
                },
                select: {
                    id: true,
                    content: {
                        id: true,
                        module: {
                            id: true,
                            course: {
                                id: true,
                            },
                        },
                    },
                },
            },
        )
        return challenge?.content?.module?.course?.id ?? null
    }

    /**
     * Resolve the real `users.id` (uuid) from a Keycloak subject id. The socket
     * gateway stamps the Keycloak sub, but course-scoped data keys off
     * `enrollments.user_id` (= `users.id`) — so the sub must be resolved first.
     *
     * @param keycloakId - The Keycloak subject id from the socket.
     * @returns The real user id, or `null` when no user matches.
     */
    async resolveUserIdByKeycloakId(
        keycloakId: string,
    ): Promise<string | null> {
        const user = await this.userService.getUserByKeycloakId(keycloakId)
        return user?.id ?? null
    }

    /**
     * Create a new (empty) conversation anchored to one of the four scopes —
     * content / task / foundation / course (the SESSION-PER-SCOPE model). The
     * scope is taken explicitly when given, else derived by anchor priority
     * (content > task > foundation > course), mirroring `prepareMessages`.
     * Auto-titled later from its first question.
     *
     * Anchoring + entitlement per scope:
     * - **content**: keys off the lesson's enrollment (trial rows count). The
     *   premium-content gate still fires at answer time in `prepareMessages`.
     * - **task**: resolves the task → owning course → enrollment (trial rows
     *   count). Capstone material stays enrolled-gated at answer time.
     * - **course**: keys off the course's enrollment (trial rows count).
     * - **foundation**: GLOBAL — no course, no enrollment; keys off the raw user.
     *
     * @param params - The learner, the (optional) scope, and the anchor ids.
     * @returns The new session id, or `null` when no valid anchor / enrollment resolves.
     */
    async createSession(
        {
            userId,
            scope,
            contentId,
            taskId,
            foundationId,
            courseId,
            archived,
        }: {
            userId: string
            scope?: ContentAiScope | null
            contentId?: string | null
            taskId?: string | null
            foundationId?: string | null
            courseId?: string | null
            /**
             * Born-archived: stamp `archived_at = now()` at creation so the
             * conversation never clutters the default history list yet stays
             * searchable. Used for selection-passage ("explain this") chats — a
             * one-off side-thread that inherits the surface grounding + the passage.
             */
            archived?: boolean | null
        },
    ): Promise<string | null> {
        // derive scope by anchor priority when the caller did not pin one
        const resolvedScope: ContentAiScope | null = scope
            ?? (contentId
                ? "content"
                : taskId
                    ? "task"
                    : foundationId
                        ? "foundation"
                        : courseId
                            ? "course"
                            : null)
        if (!resolvedScope) {
            return null
        }

        // resolve the row to persist per scope; a missing anchor / enrollment → null
        // (no session created) so a non-entitled or malformed request is a silent
        // no-op rather than an orphan row.
        let toCreate: Partial<ContentAiSessionEntity> | null = null
        if (resolvedScope === "content") {
            if (!contentId) {
                return null
            }
            const enrollmentId = await this.resolveEnrollmentId(userId,
                contentId)
            if (!enrollmentId) {
                return null
            }
            toCreate = {
                scope: "content",
                enrollmentId,
                originContentId: contentId,
            }
        } else if (resolvedScope === "task") {
            if (!taskId) {
                return null
            }
            const taskCourseId = await this.resolveCourseIdOfTask(taskId)
            const enrollmentId = taskCourseId
                ? await this.resolveEnrollmentByCourse(userId,
                    taskCourseId)
                : null
            if (!enrollmentId) {
                return null
            }
            toCreate = {
                scope: "task",
                enrollmentId,
                originTaskId: taskId,
            }
        } else if (resolvedScope === "course") {
            if (!courseId) {
                return null
            }
            const enrollmentId = await this.resolveEnrollmentByCourse(userId,
                courseId)
            if (!enrollmentId) {
                return null
            }
            toCreate = {
                scope: "course",
                enrollmentId,
            }
        } else {
            // foundation: GLOBAL library doc — no course, no enrollment; anchor on
            // the raw user (course-agnostic side of the enrollment-centric model)
            if (!foundationId) {
                return null
            }
            toCreate = {
                scope: "foundation",
                userId,
                originFoundationId: foundationId,
            }
        }

        const session = this.entityManager.create(
            ContentAiSessionEntity,
            {
                ...toCreate,
                title: null,
                // born-archived side-threads (selection asks) are stamped now so
                // they stay out of the default list but remain searchable
                archivedAt: archived
                    ? new Date()
                    : null,
            },
        )
        await this.entityManager.save(session)
        return session.id
    }

    /**
     * List the learner's conversations for the CURRENT scope (recency-first): a
     * lesson lists that content's chats, a task lists that task's, a foundation
     * lists that foundation doc's, a course lists the whole-course chats. When a
     * non-empty `search` is given the CONTENT scope searches ALL the learner's
     * course conversations (so an old "kafka"/"nginx" chat is findable); the other
     * scopes filter their own list by title/message text.
     *
     * The scope is taken explicitly when given, else derived by anchor priority
     * (content > task > foundation > course), mirroring `prepareMessages` /
     * `createSession`.
     *
     * @param params - The learner, the (optional) scope, the anchor ids, and paging.
     * @returns Conversation summaries (recency-first).
     */
    async sessions(
        {
            userId,
            scope,
            contentId,
            taskId,
            foundationId,
            courseId,
            search,
            limit,
            offset,
            includeArchived,
        }: {
            userId: string
            scope?: ContentAiScope | null
            contentId?: string | null
            taskId?: string | null
            foundationId?: string | null
            courseId?: string | null
            search?: string
            limit?: number
            offset?: number
            includeArchived?: boolean
        },
    ): Promise<Array<ContentAiSessionSummary>> {
        // clamp the page so a bad client value can't pull the whole table
        const pageLimit = Math.min(Math.max(limit ?? 20,
            1),
        50)
        const pageOffset = Math.max(offset ?? 0,
            0)
        const trimmed = (search ?? "").trim()

        // derive scope by anchor priority when not pinned
        const resolvedScope: ContentAiScope | null = scope
            ?? (contentId
                ? "content"
                : taskId
                    ? "task"
                    : foundationId
                        ? "foundation"
                        : courseId
                            ? "course"
                            : null)

        // CONTENT: original behaviour, verbatim (list this content, or course-wide
        // search) — no regression to the shipped lesson list.
        if (resolvedScope === "content") {
            if (!contentId) {
                return []
            }
            if (trimmed) {
                // search ALWAYS spans archived rows — digging up an archived (or
                // born-archived selection) chat is exactly when search is used, so
                // `includeArchived` is not threaded here.
                return this.searchSessions(userId,
                    contentId,
                    trimmed,
                    pageLimit,
                    pageOffset)
            }
            return this.listSessions(userId,
                contentId,
                pageLimit,
                pageOffset,
                includeArchived ?? false)
        }

        // TASK / FOUNDATION / COURSE: scope-anchored list (the session-per-scope slice)
        if (!resolvedScope) {
            return []
        }
        return this.listScopedSessions({
            userId,
            scope: resolvedScope,
            taskId,
            foundationId,
            courseId,
            search: trimmed,
            limit: pageLimit,
            offset: pageOffset,
            includeArchived: includeArchived ?? false,
        })
    }

    /**
     * List (or in-scope search) conversations for a NON-content scope — task,
     * foundation, or course. Resolves the scope's owner + anchor, then runs one
     * recency-first paged query. A task/course session is owned via the
     * enrollment; a GLOBAL foundation session is owned via the raw user. The anchor
     * isolates the surface (`origin_task_id` / `origin_foundation_id`); a course
     * session has no per-item anchor and is selected by `scope = 'course'`.
     *
     * A non-empty `search` narrows THIS scope's list by title/message text (no
     * cross-content JOIN — task/foundation/course rows have no content title) and
     * spans archived rows, matching the content-scope search semantics.
     *
     * @param params - The learner, the scope, the anchor ids, search + paging.
     * @returns Conversation summaries (recency-first), or empty when unauthorized.
     */
    private async listScopedSessions(
        {
            userId,
            scope,
            taskId,
            foundationId,
            courseId,
            search,
            limit,
            offset,
            includeArchived,
        }: {
            userId: string
            scope: ContentAiScope
            taskId?: string | null
            foundationId?: string | null
            courseId?: string | null
            search: string
            limit: number
            offset: number
            includeArchived: boolean
        },
    ): Promise<Array<ContentAiSessionSummary>> {
        // resolve the owner predicate + the anchor predicate for this scope. Column
        // names are whitelisted (never client input) so they interpolate safely.
        let ownerColumn: "enrollment_id" | "user_id"
        let ownerId: string | null
        let anchorColumn: "origin_task_id" | "origin_foundation_id" | null = null
        let anchorId: string | null = null
        if (scope === "task") {
            if (!taskId) {
                return []
            }
            const taskCourseId = await this.resolveCourseIdOfTask(taskId)
            ownerColumn = "enrollment_id"
            ownerId = taskCourseId
                ? await this.resolveEnrollmentByCourse(userId,
                    taskCourseId)
                : null
            anchorColumn = "origin_task_id"
            anchorId = taskId
        } else if (scope === "course") {
            if (!courseId) {
                return []
            }
            ownerColumn = "enrollment_id"
            ownerId = await this.resolveEnrollmentByCourse(userId,
                courseId)
        } else {
            // foundation: GLOBAL — owned by the raw user, anchored on the doc
            if (!foundationId) {
                return []
            }
            ownerColumn = "user_id"
            ownerId = userId
            anchorColumn = "origin_foundation_id"
            anchorId = foundationId
        }
        if (!ownerId) {
            return []
        }

        // Build the parametrized query incrementally: $1 owner, $2 scope, then the
        // optional anchor, then the search-or-archived clause, then paging. Column
        // names are whitelisted above (never client input) so they interpolate safe.
        const params: Array<unknown> = [
            ownerId,
            scope,
        ]
        let anchorClause = ""
        if (anchorColumn) {
            params.push(anchorId)
            anchorClause = `AND s.${anchorColumn} = $${params.length}`
        }
        // search spans archived rows (same as content search); a plain list hides
        // archived unless includeArchived is set. When searching, the snippet reuses
        // the SAME pattern param.
        let searchClause: string
        let snippetExpr = "NULL"
        if (search) {
            params.push(`%${search}%`)
            const patternParam = params.length
            searchClause = `AND (s.title ILIKE $${patternParam}
                    OR EXISTS (SELECT 1 FROM content_ai_messages m2
                                WHERE m2.session_id = s.id AND m2.message ILIKE $${patternParam}))`
            snippetExpr = `(SELECT m3.message FROM content_ai_messages m3
                                WHERE m3.session_id = s.id AND m3.message ILIKE $${patternParam}
                                ORDER BY m3.created_at LIMIT 1)`
        } else {
            params.push(includeArchived)
            searchClause = `AND ($${params.length} OR s.archived_at IS NULL)`
        }
        params.push(limit)
        const limitParam = params.length
        params.push(offset)
        const offsetParam = params.length

        const rows = await this.entityManager.query<Array<{
            id: string
            title: string | null
            updatedAt: Date
            messageCount: number
            snippet: string | null
        }>>(
            `SELECT s.id, s.title, s.updated_at AS "updatedAt",
                    COUNT(m.id)::int AS "messageCount",
                    ${snippetExpr} AS "snippet"
             FROM content_ai_sessions s
             LEFT JOIN content_ai_messages m ON m.session_id = s.id
             WHERE s.${ownerColumn} = $1 AND s.scope = $2
               ${anchorClause}
               ${searchClause}
             GROUP BY s.id
             HAVING COUNT(m.id) > 0
             ORDER BY s.updated_at DESC
             LIMIT $${limitParam} OFFSET $${offsetParam}`,
            params,
        )
        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            updatedAt: row.updatedAt,
            messageCount: row.messageCount,
            scope,
            originContentId: null,
            originContentTitle: null,
            snippet: row.snippet,
        }))
    }

    /**
     * List conversations anchored to one content (recency-first), paged. Archived
     * conversations are hidden unless `includeArchived` is set.
     */
    private async listSessions(
        userId: string,
        contentId: string,
        limit: number,
        offset: number,
        includeArchived: boolean,
    ): Promise<Array<ContentAiSessionSummary>> {
        const enrollmentId = await this.resolveEnrollmentId(userId,
            contentId)
        if (!enrollmentId) {
            return []
        }
        const rows = await this.entityManager.query<Array<{
            id: string
            title: string | null
            updatedAt: Date
            messageCount: number
        }>>(
            // HAVING COUNT > 0 hides empty/abandoned sessions (created on send but
            // never got a saved turn) so the list + auto-select only see real chats.
            // `archived_at IS NULL` hides archived (incl. born-archived selection)
            // sessions from the default list unless includeArchived is requested.
            `SELECT s.id, s.title, s.updated_at AS "updatedAt",
                    COUNT(m.id)::int AS "messageCount"
             FROM content_ai_sessions s
             LEFT JOIN content_ai_messages m ON m.session_id = s.id
             WHERE s.enrollment_id = $1 AND s.origin_content_id = $2
               AND ($5 OR s.archived_at IS NULL)
             GROUP BY s.id
             HAVING COUNT(m.id) > 0
             ORDER BY s.updated_at DESC
             LIMIT $3 OFFSET $4`,
            [
                enrollmentId,
                contentId,
                limit,
                offset,
                includeArchived,
            ],
        )
        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            updatedAt: row.updatedAt,
            messageCount: row.messageCount,
            scope: "content" as const,
            originContentId: contentId,
            originContentTitle: null,
            snippet: null,
        }))
    }

    /**
     * Search ALL the learner's conversations in the content's course, paged.
     * INTENTIONALLY spans archived rows too (no `archived_at` filter): search is
     * exactly how a learner digs an archived / born-archived selection chat back
     * up, so it must see them.
     */
    private async searchSessions(
        userId: string,
        contentId: string,
        query: string,
        limit: number,
        offset: number,
    ): Promise<Array<ContentAiSessionSummary>> {
        const enrollmentId = await this.resolveEnrollmentId(userId,
            contentId)
        if (!enrollmentId) {
            return []
        }
        const pattern = `%${query}%`
        const rows = await this.entityManager.query<Array<{
            id: string
            title: string | null
            updatedAt: Date
            messageCount: number
            originContentId: string
            originContentTitle: string | null
            snippet: string | null
        }>>(
            `SELECT * FROM (
                SELECT s.id, s.title, s.updated_at AS "updatedAt",
                       s.origin_content_id AS "originContentId",
                       c.title AS "originContentTitle",
                       (SELECT COUNT(*)::int FROM content_ai_messages mc
                          WHERE mc.session_id = s.id) AS "messageCount",
                       (SELECT m2.message FROM content_ai_messages m2
                          WHERE m2.session_id = s.id AND m2.message ILIKE $2
                          ORDER BY m2.created_at LIMIT 1) AS "snippet"
                FROM content_ai_sessions s
                JOIN contents c ON c.id = s.origin_content_id
                WHERE s.enrollment_id = $1
                  AND (s.title ILIKE $2 OR EXISTS (
                       SELECT 1 FROM content_ai_messages m
                        WHERE m.session_id = s.id AND m.message ILIKE $2))
             ) t ORDER BY t."updatedAt" DESC
             LIMIT $3 OFFSET $4`,
            [
                enrollmentId,
                pattern,
                limit,
                offset,
            ],
        )
        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            updatedAt: row.updatedAt,
            messageCount: row.messageCount,
            scope: "content" as const,
            originContentId: row.originContentId,
            originContentTitle: row.originContentTitle,
            snippet: row.snippet,
        }))
    }

    /**
     * Load a conversation's turns (oldest first) so the thread can be rebuilt.
     * Returns empty when the session is not owned by the learner.
     *
     * @param params - The learner + the session.
     */
    async loadSessionMessages(
        {
            userId,
            sessionId,
        }: { userId: string, sessionId: string },
    ): Promise<Array<ContentAiHistoryMessage>> {
        const owned = await this.resolveOwnedSession(userId,
            sessionId)
        if (!owned) {
            return []
        }
        // raw SQL — avoid TypeORM `where`/`select` ambiguity on `session_id`
        // (it carries both @Column and @RelationId), which can throw at runtime
        const rows = await this.entityManager.query<Array<{ role: string, message: string }>>(
            `SELECT role, message
               FROM content_ai_messages
              WHERE session_id = $1
              ORDER BY created_at ASC`,
            [
                sessionId,
            ],
        )
        return rows.map((row) => ({
            role: row.role,
            content: row.message,
        }))
    }

    /**
     * Persist one `(question → answer)` turn under a conversation, for ANY scope.
     * The turn inherits the session's owner anchors (enrollment for a course-scoped
     * session, user for a foundation session). A content-scope turn also records
     * the content it was grounded on (`contentId`) so that conversation can span
     * lessons; task/foundation/course turns pass no content (the anchor lives on
     * the session). Auto-titles the session from its first question + bumps its
     * recency. No-op when the answer is empty or the session is not owned.
     *
     * @param params - The learner, the session, the (optional) grounding content, the Q + A.
     */
    async saveTurn(
        {
            userId,
            sessionId,
            contentId,
            question,
            answer,
        }: {
            userId: string
            sessionId: string
            contentId?: string | null
            question: string
            answer: string
        },
    ): Promise<void> {
        const trimmedAnswer = answer.trim()
        if (!question.trim() || !trimmedAnswer) {
            return
        }
        const owned = await this.resolveOwnedSession(userId,
            sessionId)
        if (!owned) {
            return
        }
        // a turn keys off whichever owner the session carries: enrollment for a
        // course-scoped session, user for a foundation session. content_id is set
        // only when the turn was grounded on a specific lesson (content scope).
        const anchor = {
            sessionId,
            enrollmentId: owned.enrollmentId,
            userId: owned.userId,
            contentId: contentId ?? null,
        }
        await this.entityManager.insert(
            ContentAiMessageEntity,
            [
                {
                    ...anchor,
                    role: "user",
                    message: question,
                },
                {
                    ...anchor,
                    role: "assistant",
                    message: trimmedAnswer,
                },
            ],
        )
        // auto-title from the first question (only when still untitled) + bump recency
        await this.entityManager.query(
            `UPDATE content_ai_sessions
                SET title = COALESCE(title, $2), updated_at = now()
              WHERE id = $1`,
            [
                sessionId,
                question.trim().slice(0,
                    120),
            ],
        )
    }

    /**
     * Delete a conversation (cascades its messages). No-op when not owned.
     *
     * @param params - The learner + the session to delete.
     */
    async deleteSession(
        {
            userId,
            sessionId,
        }: { userId: string, sessionId: string },
    ): Promise<void> {
        const owned = await this.resolveOwnedSession(userId,
            sessionId)
        if (!owned) {
            return
        }
        await this.entityManager.delete(
            ContentAiSessionEntity,
            {
                id: sessionId,
            },
        )
    }

    /**
     * Rename a conversation. Overwrites the title OUTRIGHT (no COALESCE) — the
     * learner's explicit rename wins over the auto-derived title. An empty/blank
     * title resets to NULL, so the session falls back to auto-titling from its
     * first question again. No-op when not owned.
     *
     * @param params - The learner, the session, and the new title (blank → reset).
     * @throws ContentAiSessionTitleTooLongException when the title exceeds the
     *   `content_ai_sessions.title` column limit (200 chars).
     */
    async renameContentAiSession(
        {
            userId,
            sessionId,
            title,
        }: { userId: string, sessionId: string, title: string },
    ): Promise<void> {
        // reject over-long titles at the boundary rather than letting the varchar(200)
        // column raise a raw DB error; an empty/blank title resets to auto-titling
        const trimmed = title.trim()
        if (trimmed.length > 200) {
            throw new ContentAiSessionTitleTooLongException({
                length: trimmed.length,
                max: 200,
            })
        }
        const owned = await this.resolveOwnedSession(userId,
            sessionId)
        if (!owned) {
            return
        }
        await this.entityManager.query(
            "UPDATE content_ai_sessions SET title = $2, updated_at = now() WHERE id = $1",
            [
                sessionId,
                trimmed || null,
            ],
        )
    }

    /**
     * Archive / unarchive a conversation. Archiving stamps `archived_at = now()`
     * (drops it from the default list, still searchable); unarchiving clears it
     * back to NULL (returns it to the list). No-op when not owned.
     *
     * @param params - The learner, the session, and the target archived state.
     */
    async setContentAiSessionArchived(
        {
            userId,
            sessionId,
            archived,
        }: { userId: string, sessionId: string, archived: boolean },
    ): Promise<void> {
        const owned = await this.resolveOwnedSession(userId,
            sessionId)
        if (!owned) {
            return
        }
        await this.entityManager.query(
            archived
                ? "UPDATE content_ai_sessions SET archived_at = now() WHERE id = $1"
                : "UPDATE content_ai_sessions SET archived_at = NULL WHERE id = $1",
            [
                sessionId,
            ],
        )
    }

    /**
     * Mark a conversation as just-opened (bumps `updated_at` → it sorts to the top
     * + becomes the one auto-reopened on reload). No-op when not owned. This is how
     * "remember the last conversation I read" is persisted server-side (not in the
     * browser): reading a chat bumps its recency.
     *
     * @param params - The learner + the session being opened.
     */
    async touchSession(
        {
            userId,
            sessionId,
        }: { userId: string, sessionId: string },
    ): Promise<void> {
        const owned = await this.resolveOwnedSession(userId,
            sessionId)
        if (!owned) {
            return
        }
        await this.entityManager.query(
            "UPDATE content_ai_sessions SET updated_at = now() WHERE id = $1",
            [
                sessionId,
            ],
        )
    }

    /**
     * Resolve the owner anchors of a session IF it belongs to the user. Ownership
     * holds either way of the enrollment-centric split: a course-scoped session
     * (content / task / course) is owned via `enrollments.user_id`; a
     * course-agnostic foundation session is owned via the session's own `user_id`.
     * A LEFT JOIN keeps foundation rows (null enrollment) matchable.
     *
     * @param userId - The asking learner.
     * @param sessionId - The session to check.
     * @returns `{ enrollmentId, userId }` (either may be null) when owned, else `null`.
     */
    private async resolveOwnedSession(
        userId: string,
        sessionId: string,
    ): Promise<{ enrollmentId: string | null, userId: string | null } | null> {
        const rows = await this.entityManager.query<Array<{
            enrollmentId: string | null
            userId: string | null
        }>>(
            `SELECT s.enrollment_id AS "enrollmentId", s.user_id AS "userId"
               FROM content_ai_sessions s
               LEFT JOIN enrollments e ON e.id = s.enrollment_id
              WHERE s.id = $1 AND (e.user_id = $2 OR s.user_id = $2)
              LIMIT 1`,
            [
                sessionId,
                userId,
            ],
        )
        return rows[0] ?? null
    }

    /**
     * System prompt grounding the answer in the scope's material and pinning the
     * reply language to the request locale. The `scope` selects the tutor persona
     * + the grounding-section header (lesson tutor · capstone-task mentor ·
     * foundation-library tutor); the lesson branch is the original prompt verbatim.
     *
     * @param grounding - The scope's grounding text (lesson body/code, task
     *   material, or foundation document).
     * @param locale - The active request locale.
     * @param scope - Which surface the question is grounded on.
     * @returns The system prompt string.
     */
    private buildSystemPrompt(
        grounding: string,
        locale: Locale,
        scope: ContentAiScope,
    ): string {
        const language = locale === Locale.Vi
            ? "Vietnamese"
            : "English"
        if (scope === "task") {
            return [
                "You are StarCi AI, a mentor for the student's capstone / personal-project TASK.",
                "The TASK MATERIAL below is the task's own brief, requirements and acceptance criteria — it is your primary source: read it, prefer it, and keep the student aligned to exactly THIS task.",
                "Mentor, don't do the work for them: explain concepts, unblock errors, review their approach and point at the relevant requirement — but never hand over a finished solution to the deliverable. Guide them to build it themselves.",
                "A student message may contain <display>the question</display> and <context>the highlighted passage plus its surrounding paragraph and section</context>. Use <context> only to understand WHICH part they mean; answer the <display> question. Never repeat or mention the tags or the raw context back to the student.",
                `Reply in ${language}. Keep it short, concrete and practical.`,
                "",
                "=== TASK MATERIAL ===",
                grounding,
            ].join("\n")
        }
        if (scope === "challenge") {
            return [
                "You are StarCi AI, a coach for the student's hands-on CHALLENGE.",
                "The CHALLENGE MATERIAL below is the challenge's own brief, steps and test cases — it is your primary source: read it, prefer it, and keep the student aligned to exactly THIS challenge.",
                "Coach, don't solve it for them: explain the concept, unblock an error, or clarify what a step / test case is asking — but never hand over the finished solution. Nudge them to write it and run the tests themselves.",
                "A student message may contain <display>the question</display> and <context>the highlighted passage plus its surrounding paragraph and section</context>. Use <context> only to understand WHICH part they mean; answer the <display> question. Never repeat or mention the tags or the raw context back to the student.",
                `Reply in ${language}. Keep it short, concrete and practical.`,
                "",
                "=== CHALLENGE MATERIAL ===",
                grounding,
            ].join("\n")
        }
        if (scope === "course") {
            return [
                "You are StarCi AI, a sharp and friendly tutor for the student's COURSE as a whole (no single lesson is open).",
                "The COURSE MATERIAL below is retrieved from across the course's lessons and is your primary source: read it, prefer it, and ground your answer in it.",
                "It may be EMPTY (the student is browsing, not yet enrolled, or nothing matched). When it is, answer from your general programming knowledge and, if useful, suggest which part of the course to open — never invent specific lesson content you were not given.",
                "A student message may contain <display>the question</display> and <context>a highlighted passage</context>. Use <context> only to understand WHICH part they mean; answer the <display> question. Never repeat or mention the tags or the raw context back to the student.",
                `Reply in ${language}. Keep it short, concrete and practical.`,
                "",
                "=== COURSE MATERIAL ===",
                grounding,
            ].join("\n")
        }
        if (scope === "foundation") {
            return [
                "You are StarCi AI, a sharp and friendly tutor explaining a FOUNDATION reference document from the knowledge library.",
                "The FOUNDATION DOCUMENT below is your primary source: read it, prefer it, and explain its concepts, terms, code and examples whenever the student asks about them.",
                "You MAY also use your general programming knowledge to explain a related concept, term, snippet or command the document does not mention — a good tutor EXPLAINS, it never refuses to read code, and never says a question is outside its training. Only when you truly cannot help, say so in one line and point the student to what to review.",
                "A student message may contain <display>the question</display> and <context>the highlighted passage plus its surrounding paragraph and section</context>. Use <context> only to understand WHICH part of the document they mean; answer the <display> question. Never repeat or mention the tags or the raw context back to the student.",
                `Reply in ${language}. Keep it short, concrete and practical.`,
                "",
                "=== FOUNDATION DOCUMENT ===",
                grounding,
            ].join("\n")
        }
        return [
            "You are StarCi AI, a sharp and friendly programming tutor embedded in a course.",
            "The LESSON CONTENT below — its explanations AND its code — is your primary source: read it, prefer it, and explain the lesson's own code, commands and examples whenever the student asks about them.",
            "You MAY also use your general programming knowledge to explain a concept, term, snippet or command the student asks about, even one the lesson does not mention — a good tutor EXPLAINS, it never refuses to read code. Do NOT reply that a common programming term is unknown to you, and never say a question is outside your training. Only when you truly cannot help, say so in one line and point the student to what to review.",
            "A student message may contain <display>the question</display> and <context>the highlighted passage plus its surrounding paragraph and section</context>. Use <context> only to understand WHICH part of the lesson they mean; answer the <display> question. Never repeat or mention the tags or the raw context back to the student.",
            `Reply in ${language}. Keep it short, concrete and practical.`,
            "",
            "=== LESSON CONTENT ===",
            grounding,
        ].join("\n")
    }
}
