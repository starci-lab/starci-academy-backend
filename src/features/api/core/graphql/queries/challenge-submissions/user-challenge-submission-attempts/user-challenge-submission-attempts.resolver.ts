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
    UserChallengeSubmissionAttemptsService,
} from "./user-challenge-submission-attempts.service"
import {
    UserChallengeSubmissionAttemptsRequest,
} from "./graphql-types/request"
import {
    UserChallengeSubmissionAttemptsResponse,
    UserChallengeSubmissionAttemptsResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * GraphQL entry for `userChallengeSubmissionAttempts`: the caller's paginated
 * try history on one submission slot.
 */
export class UserChallengeSubmissionAttemptsResolver {
    constructor(
        private readonly userChallengeSubmissionAttemptsService: UserChallengeSubmissionAttemptsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Submission attempts fetched successfully",
        [Locale.Vi]: "Lấy danh sách submission attempt thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserChallengeSubmissionAttemptsResponse,
        {
            name: "userChallengeSubmissionAttempts",
            description: "Returns a paginated list of submission attempts, optionally filtered by submission ID.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Pagination, sorts, and filters.",
            },
        )
            request: UserChallengeSubmissionAttemptsRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<UserChallengeSubmissionAttemptsResponseData> {
        return this.userChallengeSubmissionAttemptsService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
