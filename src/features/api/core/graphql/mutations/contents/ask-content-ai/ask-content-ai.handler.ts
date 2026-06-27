import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    AiModelCategory,
    Locale,
} from "@modules/databases"
import {
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

@CommandHandler(AskContentAiCommand)
@Injectable()
export class AskContentAiHandler
    extends ICQRSHandler<AskContentAiCommand, AskContentAiData>
    implements ICommandHandler<AskContentAiCommand, AskContentAiData> {
    constructor(
        private readonly aiInvokeService: AiInvokeService,
        private readonly contentAiService: ContentAiService,
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

        // ground the question in the lesson body + enforce the premium gate
        // (shared with the streaming `/content_ai` socket gateway)
        const {
            messages,
        } = await this.contentAiService.prepareMessages({
            userId: user.id,
            contentId,
            question,
            history,
            locale: locale ?? Locale.En,
        })

        // content AI is free-tier: invoke the free local model only (Free
        // category — no Economy cloud fallback, no AI-credit gate / debit).
        const {
            text,
        } = await this.aiInvokeService.invoke({
            messages,
            categories: [
                AiModelCategory.Free,
            ],
        })

        return {
            answer: text,
        }
    }
}
