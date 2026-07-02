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
    ConsultantEntity,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakGraphQLUser,
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    ConsultantService,
} from "./consultant.service"
import {
    ConsultantRequest,
    ConsultantResponse,
} from "./graphql-types"

/**
 * Optional auth: an anonymous viewer still gets the consultant payload, just
 * with `contactUnlocked = false` (contact fields nulled out). A logged-in
 * viewer's CV score determines whether contact details unlock.
 */
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
