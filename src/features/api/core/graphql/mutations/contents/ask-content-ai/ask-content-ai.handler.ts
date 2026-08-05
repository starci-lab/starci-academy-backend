import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    ContentAiService,
} from "@modules/bussiness/content-ai/content-ai.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    AskContentAiCommand,
} from "./ask-content-ai.command"
import {
    AskContentAiData,
} from "./graphql-types/response"

@CommandHandler(AskContentAiCommand)
@Injectable()
/**
 * Handles {@link AskContentAiCommand}: grounds the learner's question via
 * {@link ContentAiService.prepareMessages} (lesson/task/challenge/quiz/
 * foundation/course scope), invokes the System AI engine at the free-first
 * floor, then bills the AI credit pool for whichever model actually served
 * the answer.
 */
export class AskContentAiHandler
    extends ICQRSHandler<AskContentAiCommand, AskContentAiData>
    implements ICommandHandler<AskContentAiCommand, AskContentAiData> {
    constructor(
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly contentAiService: ContentAiService,
    ) {
        super()
    }

    /**
     * @param command - The one-shot content-AI question, the asking user, and the locale.
     * @returns The model's answer.
     * @throws UserNotFoundException when the command carries no authenticated user.
     */
    protected override async process(
        command: AskContentAiCommand,
    ): Promise<AskContentAiData> {
        const {
            request: {
                contentId,
                taskId,
                challengeId,
                quizId,
                foundationId,
                courseId,
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

        // ground the question by scope (lesson body + premium gate, or task /
        // foundation RAG) -- shared with the streaming `/content_ai` socket gateway
        const {
            messages,
        } = await this.contentAiService.prepareMessages({
            userId: user.id,
            contentId,
            taskId,
            challengeId,
            quizId,
            foundationId,
            courseId,
            question,
            history,
            locale: locale ?? Locale.En,
        })

        // content AI = same System engine as grading, floor=free:
        // local Qwen -> OpenRouter free, then (only if all free fail) climb to
        // economy+ within the tier ceiling.
        const {
            text,
            model,
            provider,
            cost,
            promptTokens,
            completionTokens,
            attempts,
        } = await this.aiInvokeService.run({
            userId: user.id,
            messages,
            floor: AiModelCategory.Low,
            surface: AiCeilSurface.Chatbot,
        })

        // bill by the model that actually served -- a free model = 0 (normal case);
        // a climbed economy+ model is charged to the user (platform doesn't eat it)
        await this.aiEntitlementService.consume({
            userId: user.id,
            cost,
            surface: AiCeilSurface.Chatbot,
            task: AiModelTask.Chatting,
            model,
            provider,
            promptTokens,
            completionTokens,
            attempts,
        })

        return {
            answer: text,
        }
    }
}
