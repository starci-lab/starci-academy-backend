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
    SubmitChallengeSubmissionsRequest,
    SubmitChallengeSubmissionsResponse,
} from "./graphql-types"
import {
    SubmitChallengeSubmissionsService,
} from "./submit-challenge-submissions.service"

/**
 * GraphQL entry: queue automated grading for GitHub challenge submissions under a challenge.
 */
@Resolver()
export class SubmitChallengeSubmissionsResolver {
    constructor(
        private readonly submitChallengeSubmissionsService: SubmitChallengeSubmissionsService,
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
        () => SubmitChallengeSubmissionsResponse,
        {
            name: "submitChallengeSubmissions",
            description: "Queue automated grading for GitHub URL submissions under one challenge; call after `syncChallengeSubmissions`.",
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
            request: SubmitChallengeSubmissionsRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<void> {
        await this.submitChallengeSubmissionsService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
