import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
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
    FoundationsService,
} from "./foundations.service"
import {
    FoundationsRequest,
} from "./graphql-types/request"
import {
    FoundationsResponse,
    FoundationsResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Resolver for the foundations query.
 */
export class FoundationsResolver {
    constructor(
        private readonly foundationsService: FoundationsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Foundations fetched successfully",
        [Locale.Vi]: "Lấy danh sách tài nguyên nền tảng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => FoundationsResponse,
        {
            name: "foundations",
            description: "Lists foundations in a category with pagination.",
        },
    )
    async execute(
        @Args("request") request: FoundationsRequest,
        @GraphQLLocale() locale: Locale,
    ): Promise<FoundationsResponseData> {
        return this.foundationsService.execute({
            request,
            locale,
        })
    }
}
