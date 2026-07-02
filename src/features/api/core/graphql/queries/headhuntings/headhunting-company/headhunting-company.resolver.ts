import {
    Args,
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
    HeadhuntingCompanyService,
} from "./headhunting-company.service"
import {
    HeadhuntingCompanyRequest,
    HeadhuntingCompanyResponse,
} from "./graphql-types"

/**
 * Optional auth: any nested `consultants` this company carries are gated by
 * the viewer's CV score, same as the standalone `consultant(s)` queries.
 */
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
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
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
        @KeycloakGraphQLUser() user: UserEntity,
    ): Promise<HeadhuntingCompanyEntity> {
        return this.headhuntingCompanyService.execute({
            request,
            locale,
            // set by KeycloakOptionalAuthGraphQLGuard only when a valid
            // Bearer token was present; undefined for anonymous viewers
            user,
        })
    }
}
