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
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
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
    ConsultantService,
} from "./consultant.service"
import {
    ConsultantRequest,
} from "./graphql-types/request"
import {
    ConsultantResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Optional auth: an anonymous viewer still gets the consultant payload, just
 * with `contactUnlocked = false` (contact fields nulled out). A logged-in
 * viewer's CV score determines whether contact details unlock.
 */
export class ConsultantResolver {
    constructor(
        private readonly consultantService: ConsultantService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Consultant fetched successfully",
        [Locale.Vi]: "Lấy thông tin consultant thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ConsultantResponse,
        {
            name: "consultant",
            description: "Returns a single consultant by id or displayId; contact details are gated by the viewer's CV score.",
        },
    )
    async execute(
        @Args("request") request: ConsultantRequest,
        @GraphQLLocale() locale: Locale,
        @KeycloakGraphQLUser() user: UserEntity,
    ): Promise<ConsultantEntity> {
        return this.consultantService.execute({
            request,
            locale,
            // set by KeycloakOptionalAuthGraphQLGuard only when a valid
            // Bearer token was present; undefined for anonymous viewers
            user,
        })
    }
}
