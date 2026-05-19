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
    ConsultantEntity,
    Locale,
} from "@modules/databases"
import {
    ConsultantService,
} from "./consultant.service"
import {
    ConsultantRequest,
    ConsultantResponse,
} from "./graphql-types"

@Resolver()
export class ConsultantResolver {
    constructor(
        private readonly consultantService: ConsultantService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Consultant fetched successfully",
        [Locale.Vi]: "Lấy thông tin consultant thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ConsultantResponse,
        {
            name: "consultant",
            description: "Returns a single consultant by id or displayId.",
        },
    )
    async execute(
        @Args("request") request: ConsultantRequest,
        @GraphQLLocale() locale: Locale,
    ): Promise<ConsultantEntity> {
        return this.consultantService.execute({
            request,
            locale,
        })
    }
}
