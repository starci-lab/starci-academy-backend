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
    ChallengeSubmissionEntity,
    Locale,
} from "@modules/databases"
import {
    ChallengeSubmissionRequest,
    ChallengeSubmissionResponse,
} from "./graphql-types"
import {
    ChallengeSubmissionQueryService,
} from "./challenge-submission.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

/**
 * Resolver for challenge submissions.
 */
@Resolver()
export class ChallengeSubmissionResolver {
    constructor(
        private readonly challengeSubmissionQueryService: ChallengeSubmissionQueryService,
    ) {}

    /**
     * Get a challenge submission by ID.
     * @param request - The request object containing the challenge submission ID.
     * @param locale - The locale of the user.
     * @returns The challenge submission entity.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Challenge submission fetched successfully",
        [Locale.Vi]: "Lấy challenge submission thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ChallengeSubmissionResponse,
        {
            name: "challengeSubmission",
            description: "Returns a challenge submission by id with userSubmissions join rows (and per-row user).",
        },
    )
    async execute(
        @Args("request")
            request: ChallengeSubmissionRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ChallengeSubmissionEntity> {
        return this.challengeSubmissionQueryService.execute(
            {
                request,
                locale,
            },
        )
    }
}
