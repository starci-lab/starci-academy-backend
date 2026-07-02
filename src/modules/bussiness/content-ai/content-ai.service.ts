import {
    ForbiddenException,
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
    ContentAiMessageEntity,
    ContentAiSessionEntity,
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    S3NameResolverService,
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    ContentNotFoundException,
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
    /** Content the conversation is anchored to. */
    originContentId: string
    /** Title of the anchoring content (only resolved for cross-lesson search results). */
    originContentTitle: string | null
    /** First message matching the search query (only for search results). */
    snippet: string | null
}

/** Params for {@link ContentAiService.prepareMessages}. */
export interface PrepareContentAiMessagesParams {
    /** The asking learner (drives the premium-content entitlement gate). */
    userId: string
    /** Content the question is about. */
    contentId: string
    /** The learner's question about this content. */
    question: string
    /** Recent prior turns (oldest first) for short-term memory; capped here. */
    history?: Array<ContentAiHistoryMessage>
    /** Active request locale — reply language + which body locale to load. */
    locale: Locale
}

/** Max prior chat messages fed back to the model (caps token growth / cost). */
const MAX_HISTORY_MESSAGES = 8

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
     * @throws ForbiddenException when premium content is not entitled.
     */
    async prepareMessages(
        {
            userId,
            contentId,
            question,
            history,
            locale,
        }: PrepareContentAiMessagesParams,
    ): Promise<{ messages: Array<BaseMessage> }> {
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
                throw new ForbiddenException(
                    "Enroll in this course to ask AI about premium content",
                )
            }
        }

        // ground the answer: stuff the whole body for small lessons (cheap, no
        // retrieval miss), else RAG-retrieve the most relevant chunks for large ones
        const body = this.resolveBodyText(content,
            locale)
        const grounding = await this.resolveGrounding({
            content,
            contentId,
            question,
            body,
        })

        // replay the recent turns (capped) for short-term memory, then the question
        const historyMessages = (history ?? [])
            .slice(-MAX_HISTORY_MESSAGES)
            .map((message) => message.role === "assistant"
                ? new AIMessage(message.content)
                : new HumanMessage(message.content))
        const messages: Array<BaseMessage> = [
            new SystemMessage(this.buildSystemPrompt(grounding,
                locale)),
            ...historyMessages,
            new HumanMessage(question),
        ]
        return {
            messages,
        }
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
     * Create a new (empty) conversation anchored to a content. Auto-titled later
     * from its first question.
     *
     * @param params - The learner + the content the conversation starts in.
     * @returns The new session id, or `null` when no enrollment resolves.
     */
    async createSession(
        {
            userId,
            contentId,
        }: { userId: string, contentId: string },
    ): Promise<string | null> {
        const enrollmentId = await this.resolveEnrollmentId(userId,
            contentId)
        if (!enrollmentId) {
            return null
        }
        const session = this.entityManager.create(
            ContentAiSessionEntity,
            {
                enrollmentId,
                originContentId: contentId,
                title: null,
            },
        )
        await this.entityManager.save(session)
        return session.id
    }

    /**
     * List the learner's conversations for a content (recency-first), OR — when a
     * non-empty `search` is given — search ALL their conversations in the course
     * (title or message text) so an old "kafka" / "nginx" chat can be found again.
     *
     * @param params - The learner, the current content, and an optional search.
     * @returns Conversation summaries (recency-first).
     */
    async sessions(
        {
            userId,
            contentId,
            search,
            limit,
            offset,
        }: {
            userId: string
            contentId: string
            search?: string
            limit?: number
            offset?: number
        },
    ): Promise<Array<ContentAiSessionSummary>> {
        // clamp the page so a bad client value can't pull the whole table
        const pageLimit = Math.min(Math.max(limit ?? 20,
            1),
        50)
        const pageOffset = Math.max(offset ?? 0,
            0)
        const trimmed = (search ?? "").trim()
        if (trimmed) {
            return this.searchSessions(userId,
                contentId,
                trimmed,
                pageLimit,
                pageOffset)
        }
        return this.listSessions(userId,
            contentId,
            pageLimit,
            pageOffset)
    }

    /** List conversations anchored to one content (recency-first), paged. */
    private async listSessions(
        userId: string,
        contentId: string,
        limit: number,
        offset: number,
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
            // never got a saved turn) so the list + auto-select only see real chats
            `SELECT s.id, s.title, s.updated_at AS "updatedAt",
                    COUNT(m.id)::int AS "messageCount"
             FROM content_ai_sessions s
             LEFT JOIN content_ai_messages m ON m.session_id = s.id
             WHERE s.enrollment_id = $1 AND s.origin_content_id = $2
             GROUP BY s.id
             HAVING COUNT(m.id) > 0
             ORDER BY s.updated_at DESC
             LIMIT $3 OFFSET $4`,
            [
                enrollmentId,
                contentId,
                limit,
                offset,
            ],
        )
        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            updatedAt: row.updatedAt,
            messageCount: row.messageCount,
            originContentId: contentId,
            originContentTitle: null,
            snippet: null,
        }))
    }

    /** Search ALL the learner's conversations in the content's course, paged. */
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
     * Persist one `(question → answer)` turn under a conversation. Each turn also
     * records the content it was grounded on (so a conversation can span lessons).
     * Auto-titles the session from its first question + bumps its recency.
     * No-op when the answer is empty or the session is not owned.
     *
     * @param params - The learner, the session, the grounding content, the Q + A.
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
            contentId: string
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
        await this.entityManager.insert(
            ContentAiMessageEntity,
            [
                {
                    sessionId,
                    enrollmentId: owned.enrollmentId,
                    contentId,
                    role: "user",
                    message: question,
                },
                {
                    sessionId,
                    enrollmentId: owned.enrollmentId,
                    contentId,
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
     * Resolve the owning enrollment of a session IF it belongs to the user.
     *
     * @param userId - The asking learner.
     * @param sessionId - The session to check.
     * @returns `{ enrollmentId }` when owned, else `null`.
     */
    private async resolveOwnedSession(
        userId: string,
        sessionId: string,
    ): Promise<{ enrollmentId: string } | null> {
        const rows = await this.entityManager.query<Array<{ enrollmentId: string }>>(
            `SELECT s.enrollment_id AS "enrollmentId"
               FROM content_ai_sessions s
               JOIN enrollments e ON e.id = s.enrollment_id
              WHERE s.id = $1 AND e.user_id = $2
              LIMIT 1`,
            [
                sessionId,
                userId,
            ],
        )
        return rows[0] ?? null
    }

    /**
     * System prompt grounding the answer in the content body and pinning the
     * reply language to the request locale.
     *
     * @param body - The content's markdown body.
     * @param locale - The active request locale.
     * @returns The system prompt string.
     */
    private buildSystemPrompt(
        body: string,
        locale: Locale,
    ): string {
        const language = locale === Locale.Vi
            ? "Vietnamese"
            : "English"
        return [
            "You are StarCi AI, a sharp and friendly programming tutor embedded in a course.",
            "The LESSON CONTENT below — its explanations AND its code — is your primary source: read it, prefer it, and explain the lesson's own code, commands and examples whenever the student asks about them.",
            "You MAY also use your general programming knowledge to explain a concept, term, snippet or command the student asks about, even one the lesson does not mention — a good tutor EXPLAINS, it never refuses to read code. Do NOT reply that a common programming term is unknown to you, and never say a question is outside your training. Only when you truly cannot help, say so in one line and point the student to what to review.",
            "A student message may contain <display>the question</display> and <context>the highlighted passage plus its surrounding paragraph and section</context>. Use <context> only to understand WHICH part of the lesson they mean; answer the <display> question. Never repeat or mention the tags or the raw context back to the student.",
            `Reply in ${language}. Keep it short, concrete and practical.`,
            "",
            "=== LESSON CONTENT ===",
            body,
        ].join("\n")
    }
}
