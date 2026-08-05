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
    FoundationsService,
} from "./foundations.service"
import {
    FoundationsRequest,
    FoundationsResponse,
    FoundationsResponseData,
} from "./graphql-types"

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
