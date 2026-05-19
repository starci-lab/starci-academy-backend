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
    FoundationEntity,
    Locale,
} from "@modules/databases"
import {
    FoundationService,
} from "./foundation.service"
import {
    FoundationRequest,
    FoundationResponse,
} from "./graphql-types"

@Resolver()
export class FoundationResolver {
    constructor(
        private readonly foundationService: FoundationService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Foundation fetched successfully",
        [Locale.Vi]: "Lấy tài nguyên nền tảng thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => FoundationResponse,
        {
            name: "foundation",
            description: "Returns a single foundation item by id or displayId.",
        },
    )
    async execute(
        @Args("request") request: FoundationRequest,
        @GraphQLLocale() locale: Locale,
    ): Promise<FoundationEntity> {
        return this.foundationService.execute({
            request,
            locale,
        })
    }
}
