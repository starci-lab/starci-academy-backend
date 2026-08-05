import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    PublicRagPlaygroundService,
    RagPlaygroundRunRegistryService,
} from "@modules/rag"
import {
    RagPlaygroundInvalidQuestionException,
} from "@modules/exceptions"
import {
    AskRagPlaygroundData,
    AskRagPlaygroundRequest,
    AskRagPlaygroundResponse,
} from "./graphql-types"

/** Hard cap on question length — bounds prompt size on a public, unauthenticated endpoint. */
const MAX_QUESTION_CHARS = 500

@Resolver()
/**
 * PUBLIC (no login) mutation — retrieve grounded context for a question and
 * prepare it for streaming. Does NOT invoke the model itself: it stashes the
 * prepared messages in {@link RagPlaygroundRunRegistryService} and returns a
 * `runId` the client subscribes to over the `/rag_playground` Socket.IO
 * namespace, which does the (local, $0) model call. Strict throttle — the
 * retrieval step is real Qdrant + embedding work on an anonymous endpoint.
 */
export class AskRagPlaygroundResolver {
    constructor(
        private readonly publicRagPlaygroundService: PublicRagPlaygroundService,
        private readonly ragPlaygroundRunRegistryService: RagPlaygroundRunRegistryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Question prepared successfully",
        [Locale.Vi]: "Đã chuẩn bị câu hỏi thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => AskRagPlaygroundResponse,
        {
            name: "askRagPlayground",
            description: "Retrieves grounded context for a question and prepares it for streaming over the public /rag_playground Socket.IO namespace. No authentication required.",
        },
    )
    async execute(
        @Args("request")
            request: AskRagPlaygroundRequest,
    ): Promise<AskRagPlaygroundData> {
        const question = request.question.trim().slice(0,
            MAX_QUESTION_CHARS)
        if (!question) {
            throw new RagPlaygroundInvalidQuestionException({
            })
        }

        const { chunks } = await this.publicRagPlaygroundService.retrieveContext({
            sessionId: request.sessionId,
            question,
        })
        const messages = this.publicRagPlaygroundService.buildAskMessages({
            question,
            chunks,
        })
        const runId = this.ragPlaygroundRunRegistryService.create({
            messages,
            sources: chunks,
        })

        return {
            runId,
            sources: chunks,
        }
    }
}
