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
    UserService,
} from "../user"

/** One prior chat turn replayed to the model as short-term memory. */
export interface ContentAiHistoryMessage {
    /** Author of the turn: `"user"` or `"assistant"`. */
    role: string
    /** The message text. */
    content: string
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

        // ground the answer in this content's body, then replay the recent turns
        // (capped) for short-term memory, then the new question
        const historyMessages = (history ?? [])
            .slice(-MAX_HISTORY_MESSAGES)
            .map((message) => message.role === "assistant"
                ? new AIMessage(message.content)
                : new HumanMessage(message.content))
        const messages: Array<BaseMessage> = [
            new SystemMessage(this.buildSystemPrompt(content.body,
                locale)),
            ...historyMessages,
            new HumanMessage(question),
        ]
        return {
            messages,
        }
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
            "You are StarCi AI, a concise tutor embedded in a programming course.",
            "Answer the student's question using ONLY the lesson content below.",
            "If the answer is not in the content, say you are not sure and suggest what to look for.",
            `Reply in ${language}. Keep it short, concrete and practical.`,
            "",
            "=== LESSON CONTENT ===",
            body,
        ].join("\n")
    }
}
