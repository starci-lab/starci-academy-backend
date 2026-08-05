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
    HeadhuntingCompanyService,
} from "./headhunting-company.service"
import {
    HeadhuntingCompanyRequest,
} from "./graphql-types/request"
import {
    HeadhuntingCompanyResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Optional auth: any nested `consultants` this company carries are gated by
 * the viewer's CV score, same as the standalone `consultant(s)` queries.
 */
export class HeadhuntingCompanyResolver {
    constructor(
        private readonly headhuntingCompanyService: HeadhuntingCompanyService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Headhunting company fetched successfully",
        [Locale.Vi]: "Lấy thông tin công ty headhunter thành công", // vn-ok: vi-locale string emitted to clients
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
