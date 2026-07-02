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
} from "@modules/rag"
import {
    IndexRagPlaygroundData,
    IndexRagPlaygroundRequest,
    IndexRagPlaygroundResponse,
} from "./graphql-types"

/**
 * PUBLIC (no login) mutation — index a code source into an anonymous RAG
 * Playground session. Strict throttle: this triggers a real chunk+embed+Qdrant
 * write on an unauthenticated endpoint, so it is the tightest tier in the app.
 */
@Resolver()
export class IndexRagPlaygroundResolver {
    constructor(
        private readonly publicRagPlaygroundService: PublicRagPlaygroundService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Code indexed successfully",
        [Locale.Vi]: "Đã index code thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => IndexRagPlaygroundResponse,
        {
            name: "indexRagPlayground",
            description: "Indexes a code source (paste/upload/sample/GitHub) into a public, anonymous RAG Playground session. No authentication required.",
        },
    )
    async execute(
        @Args("request")
            request: IndexRagPlaygroundRequest,
    ): Promise<IndexRagPlaygroundData> {
        return this.publicRagPlaygroundService.index({
            sessionId: request.sessionId,
            kind: request.kind,
            code: request.code,
            language: request.language,
            fileName: request.fileName,
            githubUrl: request.githubUrl,
        })
    }
}
