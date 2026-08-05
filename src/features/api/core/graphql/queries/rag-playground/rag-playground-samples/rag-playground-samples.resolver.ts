import {
    Query,
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
    RagPlaygroundSampleSummary,
    RagPlaygroundSamplesResponse,
} from "./graphql-types"

@Resolver()
/**
 * PUBLIC (no login) query — lists the RAG Playground's built-in curated
 * sample catalog (id + label only). The code itself stays server-side and is
 * only revealed once a session actually indexes the chosen sample via
 * `indexRagPlayground`.
 */
export class RagPlaygroundSamplesResolver {
    constructor(
        private readonly publicRagPlaygroundService: PublicRagPlaygroundService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "RAG Playground samples fetched successfully",
        [Locale.Vi]: "Lấy danh sách mẫu RAG Playground thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => RagPlaygroundSamplesResponse,
        {
            name: "ragPlaygroundSamples",
            description: "Lists the RAG Playground's built-in curated sample catalog (id + label only, no code). No authentication required.",
        },
    )
    execute(): Array<RagPlaygroundSampleSummary> {
        return this.publicRagPlaygroundService.listSamples()
    }
}
