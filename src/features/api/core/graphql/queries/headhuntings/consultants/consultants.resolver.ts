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
    ConsultantsService,
} from "./consultants.service"
import {
    ConsultantsRequest,
    ConsultantsResponse,
    ConsultantsResponseData,
} from "./graphql-types"

/**
 * Resolver for the Headhunters query.
 */
@Resolver()
export class ConsultantsResolver {
    constructor(
        private readonly consultantsService: ConsultantsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Consultants fetched successfully",
        [Locale.Vi]: "Lấy danh sách tài nguyên nền tảng thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ConsultantsResponse,
        {
            name: "consultants",
            description: "Lists consultants in a category with pagination.",
        },
    )
    async execute(
        @Args("request") request: ConsultantsRequest,
        @GraphQLLocale() locale: Locale,
    ): Promise<ConsultantsResponseData> {
        return this.consultantsService.execute({
            request,
            locale,
        })
    }
}
