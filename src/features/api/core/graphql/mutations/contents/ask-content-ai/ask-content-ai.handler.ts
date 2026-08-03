import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    AiCeilSurface,
    AiModelCategory,
    AiModelTask,
    Locale,
} from "@modules/databases"
import {
    AiEntitlementService,
    AiInvokeService,
} from "@modules/ai"
import {
    ContentAiService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"
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
} from "./graphql-types"

/**
 * Handles {@link AskContentAiCommand}: grounds the learner's question via
 * {@link ContentAiService.prepareMessages} (lesson/task/challenge/quiz/
 * foundation/course scope), invokes the System AI engine at the free-first
 * floor, then bills the AI credit pool for whichever model actually served
 * the answer.
 */
@CommandHandler(AskContentAiCommand)
@Injectable()
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
        // foundation RAG) — shared with the streaming `/content_ai` socket gateway
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

        // content AI ("đọc bài") = same System engine as grading, floor=free:
        // local Qwen → OpenRouter free, then (only if all free fail) climb to
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
            floor: AiModelCategory.Free,
            surface: AiCeilSurface.Chatbot,
        })

        // bill by the model that actually served — a free model = 0 (normal case);
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
