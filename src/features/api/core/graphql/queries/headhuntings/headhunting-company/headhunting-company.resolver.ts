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
    HeadhuntingCompanyEntity,
    Locale,
} from "@modules/databases"
import {
    HeadhuntingCompanyService,
} from "./headhunting-company.service"
import {
    HeadhuntingCompanyRequest,
    HeadhuntingCompanyResponse,
} from "./graphql-types"

@Resolver()
export class HeadhuntingCompanyResolver {
    constructor(
        private readonly headhuntingCompanyService: HeadhuntingCompanyService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Headhunting company fetched successfully",
        [Locale.Vi]: "Lấy thông tin công ty headhunter thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => HeadhuntingCompanyResponse,
        {
            name: "headhuntingCompany",
            description: "Returns a single headhunting company by id or displayId.",
        },
    )
    async headhuntingCompany(
        @Args("request") request: HeadhuntingCompanyRequest,
        @GraphQLLocale() locale: Locale,
    ): Promise<HeadhuntingCompanyEntity> {
        return this.headhuntingCompanyService.execute({
            request,
            locale,
        })
    }
}
