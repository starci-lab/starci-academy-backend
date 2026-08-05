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
    ConsultantsService,
} from "./consultants.service"
import {
    ConsultantsRequest,
} from "./graphql-types/request"
import {
    ConsultantsResponse,
    ConsultantsResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Resolver for the Headhunters (consultants) list query.
 *
 * Optional auth: an anonymous viewer still gets the list, just with
 * `contactUnlocked = false` (contact fields nulled out) on every consultant.
 * A logged-in viewer's CV score determines whether contact details unlock.
 */
export class ConsultantsResolver {
    constructor(
        private readonly consultantsService: ConsultantsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Consultants fetched successfully",
        [Locale.Vi]: "Lấy danh sách tài nguyên nền tảng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ConsultantsResponse,
        {
            name: "consultants",
            description: "Lists consultants in a category with pagination; contact details are gated by the viewer's CV score.",
        },
    )
    async execute(
        @Args("request") request: ConsultantsRequest,
        @GraphQLLocale() locale: Locale,
        @KeycloakGraphQLUser() user: UserEntity,
    ): Promise<ConsultantsResponseData> {
        return this.consultantsService.execute({
            request,
            locale,
            // set by KeycloakOptionalAuthGraphQLGuard only when a valid
            // Bearer token was present; undefined for anonymous viewers
            user,
        })
    }
}
