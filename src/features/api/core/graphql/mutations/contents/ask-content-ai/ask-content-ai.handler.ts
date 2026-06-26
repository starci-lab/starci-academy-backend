import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    AiMode,
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    AiEntitlementService,
    AiInvokeService,
    MODEL_CREDIT,
    resolveGradingInvokeOptions,
} from "@modules/ai"
import {
    S3NameResolverService,
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    UserService,
} from "@modules/bussiness"
import {
    AiQuotaExhaustedException,
    ContentNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    ForbiddenException,
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    AskContentAiCommand,
} from "./ask-content-ai.command"
import {
    AskContentAiData,
} from "./graphql-types"

/** Flat credit cost charged per content question (user-facing integer). */
const ASK_CONTENT_AI_COST = 1

/** Max prior chat messages fed back to the model (caps token growth / cost). */
const MAX_HISTORY_MESSAGES = 8

@CommandHandler(AskContentAiCommand)
@Injectable()
export class AskContentAiHandler
    extends ICQRSHandler<AskContentAiCommand, AskContentAiData>
    implements ICommandHandler<AskContentAiCommand, AskContentAiData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly userService: UserService,
    ) {
        super()
    }

    protected override async process(
        command: AskContentAiCommand,
    ): Promise<AskContentAiData> {
        const {
            request: {
                contentId,
                question,
                history,
            },
            user,
            locale,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // The lesson body lives in MinIO (the Postgres `body` column is empty for
        // snapshot-backed content) — load it the same way the content reader does,
        // NOT from `ContentEntity.body`, or the model is grounded on an empty body
        // and replies "I'm not sure, the content wasn't provided".
        const objectKey = this.s3NameResolverService.content(
            contentId,
            locale ?? Locale.En,
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

        // Premium gate: the resolver only checks auth (not enrollment), so a
        // non-enrolled viewer could otherwise pull a locked lesson's full body out
        // through the AI. Source the premium flag + owning course from the live DB
        // row and block ungranted premium content.
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
                ? await this.userService.checkEnrollment(user.id,
                    courseId)
                : false
            if (!entitled) {
                throw new ForbiddenException(
                    "Enroll in this course to ask AI about premium content",
                )
            }
        }

        // gate the unified AI credit pool — block once the flat cost cannot be paid
        const snapshot = await this.aiEntitlementService.snapshot({
            userId: user.id,
        })
        if (snapshot.credit.remaining5h < ASK_CONTENT_AI_COST) {
            throw new AiQuotaExhaustedException({
                mode: AiMode.Auto,
                window: "credit",
            })
        }

        // resolve the user's lane (Auto by default; BYOK / Premium honored if set)
        const invokeOptions = await resolveGradingInvokeOptions({
            userId: user.id,
            selection: undefined,
            aiEntitlementService: this.aiEntitlementService,
        })

        // ground the answer in this content's body, then replay the recent turns
        // (capped) for short-term memory, then the new question
        const historyMessages = (history ?? [])
            .slice(-MAX_HISTORY_MESSAGES)
            .map((message) => message.role === "assistant"
                ? new AIMessage(message.content)
                : new HumanMessage(message.content))
        const messages = [
            new SystemMessage(this.buildSystemPrompt(content.body,
                locale ?? Locale.En)),
            ...historyMessages,
            new HumanMessage(question),
        ]
        const {
            text,
            model,
        } = await this.aiInvokeService.invoke({
            messages,
            ...invokeOptions,
        })

        // debit AFTER a successful answer, by the model that served: the self-hosted
        // Qwen is free (0), economy cloud falls back to its per-model credit, and an
        // unknown model uses the flat ask cost. (BYOK is free — consume no-ops.)
        await this.aiEntitlementService.consume({
            userId: user.id,
            mode: snapshot.mode,
            cost: MODEL_CREDIT[model] ?? ASK_CONTENT_AI_COST,
        })

        return {
            answer: text,
        }
    }

    /**
     * System prompt grounding the answer in the content body and pinning the reply
     * language to the request locale.
     *
     * @param body - The content's markdown body.
     * @param locale - The active request locale.
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
