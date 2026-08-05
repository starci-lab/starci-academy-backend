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
    ChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ChallengeSubmissionRequest,
} from "./graphql-types/request"
import {
    ChallengeSubmissionResponse,
} from "./graphql-types/response"
import {
    ChallengeSubmissionQueryService,
} from "./challenge-submission.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
@Resolver()
/**
 * Resolver for challenge submissions.
 */
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
        [Locale.Vi]: "Lấy challenge submission thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
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
