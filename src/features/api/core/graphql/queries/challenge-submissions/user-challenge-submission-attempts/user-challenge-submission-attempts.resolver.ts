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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UserChallengeSubmissionAttemptsService,
} from "./user-challenge-submission-attempts.service"
import {
    UserChallengeSubmissionAttemptsRequest,
    UserChallengeSubmissionAttemptsResponse,
    UserChallengeSubmissionAttemptsResponseData,
} from "./graphql-types"

@Resolver()
export class UserChallengeSubmissionAttemptsResolver {
    constructor(
        private readonly userChallengeSubmissionAttemptsService: UserChallengeSubmissionAttemptsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Submission attempts fetched successfully",
        [Locale.Vi]: "Lấy danh sách submission attempt thành công",
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
