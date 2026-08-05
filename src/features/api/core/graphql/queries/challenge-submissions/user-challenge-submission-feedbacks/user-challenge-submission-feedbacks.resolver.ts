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
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UserChallengeSubmissionFeedbacksService,
} from "./user-challenge-submission-feedbacks.service"
import { 
    UserChallengeSubmissionFeedbacksResponse,
    UserChallengeSubmissionFeedbacksRequest, 
    UserChallengeSubmissionFeedbacksResponseData 
} from "./graphql-types"

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
