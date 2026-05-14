import {
    Args,
    Mutation,
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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    SubmitChallengeSubmissionRequest,
    SubmitChallengeSubmissionResponse,
    SubmitChallengeSubmissionResponseData,
} from "./graphql-types"
import {
    SubmitChallengeSubmissionService,
} from "./submit-challenge-submission.service"

/**
 * GraphQL entry: queue automated grading for GitHub challenge submissions under a challenge.
 */
@Resolver()
export class SubmitChallengeSubmissionResolver {
    constructor(
        private readonly submitChallengeSubmissionService: SubmitChallengeSubmissionService,
    ) {}

    /**
     * Enqueues the GitHub grading pipeline for the authenticated learner.
     */
    @UseThrottler(ThrottlerConfig.Medium)
    @GraphQLSuccessMessage({
        [Locale.En]: "Submissions queued for grading",
        [Locale.Vi]: "Đã xếp hàng chấm các bài nộp",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SubmitChallengeSubmissionResponse,
        {
            name: "submitChallengeSubmission",
            description: "Queue automated grading for one challenge submission. Pass `githubUrl` when the user row is not created yet (replaces prior sync-only flow).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Challenge whose submissions to grade for the current user.",
            },
        )
            request: SubmitChallengeSubmissionRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<SubmitChallengeSubmissionResponseData> {
        return this.submitChallengeSubmissionService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
