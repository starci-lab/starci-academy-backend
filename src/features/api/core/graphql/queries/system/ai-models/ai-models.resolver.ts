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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    AiModelsResponse,
    AiModelsResponseData,
} from "./graphql-types/response"
import {
    AiModelsService,
} from "./ai-models.service"

@Resolver()
/**
 * Public GraphQL entry for `aiModels` -- returns the recommendation tier, per-
 * task active models, and the selectable grading roster.
 */
export class AiModelsResolver {
    constructor(
        private readonly service: AiModelsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI models fetched successfully",
        [Locale.Vi]: "Lấy thông tin mô hình AI thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => AiModelsResponse,
        {
            name: "aiModels",
            description: "Returns the current AI model configuration and active models for each task kind.",
        },
    )
    async execute(): Promise<AiModelsResponseData> {
        return this.service.execute()
    }
}
