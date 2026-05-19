import {
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
    HeadhuntingCompaniesService,
} from "./headhunting-companies.service"
import {
    HeadhuntingCompaniesResponse,
} from "./graphql-types"

@Resolver()
export class HeadhuntingCompaniesResolver {
    constructor(
        private readonly headhuntingCompaniesService: HeadhuntingCompaniesService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy danh sách công ty headhunter thành công",
        [Locale.En]: "Headhunting companies fetched successfully",
    })
    @Query(
        () => HeadhuntingCompaniesResponse,
        {
            name: "headhuntingCompanies",
            description: "List all headhunting companies.",
        },
    )
    async headhuntingCompanies(
        @GraphQLLocale()
            locale: Locale,
    ): Promise<Array<HeadhuntingCompanyEntity>> {
        return this.headhuntingCompaniesService.query(locale)
    }
}
