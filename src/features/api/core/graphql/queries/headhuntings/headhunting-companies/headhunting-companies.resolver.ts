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
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    HeadhuntingCompaniesService,
} from "./headhunting-companies.service"
import {
    HeadhuntingCompaniesResponse,
} from "./graphql-types/response"

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
        [Locale.Vi]: "Lấy danh sách công ty headhunter thành công", // vn-ok: vi-locale string emitted to clients
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
