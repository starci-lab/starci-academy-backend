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
    resolveGradingInvokeOptions,
} from "@modules/ai"
import {
    AiQuotaExhaustedException,
    ContentNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
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
            },
            user,
            locale,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // load the content + its markdown body server-side (never trust client body)
        const content = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id: contentId,
                },
            },
        )
        if (!content) {
            throw new ContentNotFoundException({
                id: contentId,
            })
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

        // ground the answer in this content's body only
        const messages = [
            new SystemMessage(this.buildSystemPrompt(content.body,
                locale ?? Locale.En)),
            new HumanMessage(question),
        ]
        const {
            text,
        } = await this.aiInvokeService.invoke({
            messages,
            ...invokeOptions,
        })

        // debit the flat cost AFTER a successful answer (BYOK is free — consume no-ops)
        await this.aiEntitlementService.consume({
            userId: user.id,
            mode: snapshot.mode,
            cost: ASK_CONTENT_AI_COST,
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
