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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    UserChallengeSubmissionFeedbacksService,
} from "./user-challenge-submission-feedbacks.service"
import {
    UserChallengeSubmissionFeedbacksRequest,
} from "./graphql-types/request"
import {
    UserChallengeSubmissionFeedbacksResponse,
    UserChallengeSubmissionFeedbacksResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * GraphQL entry for `userChallengeSubmissionFeedbacks`: paginated scorer
 * notes on one attempt. Auth-gated; does not pass the user into the handler.
 */
export class UserChallengeSubmissionFeedbacksResolver {
    constructor(
        private readonly userChallengeSubmissionFeedbacksService: UserChallengeSubmissionFeedbacksService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Submission feedbacks fetched successfully",
        [Locale.Vi]: "Lấy danh sách submission feedback thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserChallengeSubmissionFeedbacksResponse,
        {
            name: "userChallengeSubmissionFeedbacks",
            description: "Returns a paginated list of submission feedbacks, optionally filtered by attempt ID.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Pagination, sorts, and filters.",
            },
        )
            request: UserChallengeSubmissionFeedbacksRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<UserChallengeSubmissionFeedbacksResponseData> {
        return this.userChallengeSubmissionFeedbacksService.execute(
            {
                request,
                locale,
            },
        )
    }
}
