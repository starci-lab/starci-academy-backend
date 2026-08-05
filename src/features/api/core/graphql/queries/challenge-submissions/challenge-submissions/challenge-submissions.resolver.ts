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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ChallengeSubmissionsRequest,
} from "./graphql-types/request"
import {
    ChallengeSubmissionsResponse,
    ChallengeSubmissionsResponseData,
} from "./graphql-types/response"
import {
    ChallengeSubmissionsService,
} from "./challenge-submissions.service"
@Resolver()
/**
 * GraphQL entry for `challengeSubmissions`: unpaginated slots on one challenge,
 * each carrying the caller's join row + latest attempt when present.
 */
export class ChallengeSubmissionsResolver {
    constructor(
        private readonly challengeSubmissionsService: ChallengeSubmissionsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Challenge submissions fetched successfully",
        [Locale.Vi]: "Lấy danh sách challenge submission thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ChallengeSubmissionsResponse,
        {
            name: "challengeSubmissions",
            description: "Returns all challenge submissions for a challenge; each item includes userSubmission for the current user (no userSubmissions list).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Challenge id and optional sort.",
            },
        )
            request: ChallengeSubmissionsRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ChallengeSubmissionsResponseData> {
        return this.challengeSubmissionsService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
