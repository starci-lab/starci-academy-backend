import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
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
    UserEntity,
} from "@modules/databases"
import {
    KeycloakGraphQLUser,
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    HeadhuntingCompaniesService,
} from "./headhunting-companies.service"
import {
    HeadhuntingCompaniesResponse,
} from "./graphql-types"

@Resolver()
/**
 * Optional auth: any nested `consultants` on the returned companies are gated
 * by the viewer's CV score, same as the standalone `consultant(s)` queries.
 */
export class HeadhuntingCompaniesResolver {
    constructor(
        private readonly headhuntingCompaniesService: HeadhuntingCompaniesService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
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
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<Array<HeadhuntingCompanyEntity>> {
        return this.headhuntingCompaniesService.query(locale,
            user)
    }
}
