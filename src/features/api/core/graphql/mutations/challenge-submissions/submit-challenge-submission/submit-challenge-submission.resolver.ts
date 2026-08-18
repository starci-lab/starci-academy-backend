import {
    Args,
    Context,
    Mutation,
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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
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
    SubmitChallengeSubmissionRequest,
} from "./graphql-types/request"
import {
    SubmitChallengeSubmissionResponse,
    SubmitChallengeSubmissionResponseData,
} from "./graphql-types/response"
import {
    SubmitChallengeSubmissionService,
} from "./submit-challenge-submission.service"
import type {
    GraphQLEnrollmentContextParams,
} from "../../../shared/types/graphql-enrollment-context"

@Resolver()
/**
 * GraphQL entry: queue automated grading for GitHub challenge submissions under a challenge.
 */
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
        [Locale.Vi]: "Đã xếp hàng chấm các bài nộp", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
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
        @Context()
            context: GraphQLEnrollmentContextParams,
    ): Promise<SubmitChallengeSubmissionResponseData> {
        return this.submitChallengeSubmissionService.execute(
            {
                request,
                locale,
                user,
                // course-scoped progress is keyed by enrollment (set by GraphQLEnrollmentGuard)
                enrollmentId: context.req.enrollmentId,
            },
        )
    }
}
