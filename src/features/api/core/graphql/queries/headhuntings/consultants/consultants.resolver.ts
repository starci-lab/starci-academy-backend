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
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakGraphQLUser,
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    ConsultantsService,
} from "./consultants.service"
import {
    ConsultantsRequest,
    ConsultantsResponse,
    ConsultantsResponseData,
} from "./graphql-types"

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
        [Locale.Vi]: "Lấy danh sách tài nguyên nền tảng thành công",
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
