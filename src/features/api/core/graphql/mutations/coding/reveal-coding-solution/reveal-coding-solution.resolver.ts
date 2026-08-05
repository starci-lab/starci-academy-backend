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
    CodingSubmissionService,
} from "@modules/bussiness"
import {
    RevealCodingSolutionRequest,
    RevealCodingSolutionResponse,
    type RevealCodingSolutionResponseData,
} from "./graphql-types"

@Resolver()
/**
 * Records that the user revealed a problem's reference solution. Idempotent.
 * Once revealed, a later first solve of that problem awards no points — peeking
 * the answer forfeits the score. Auth-guarded + soft-throttled.
 */
export class RevealCodingSolutionResolver {
    constructor(
        private readonly codingSubmissionService: CodingSubmissionService,
    ) {}

    /**
     * Resolves the `revealCodingSolution` mutation for the authenticated user.
     *
     * @param request - the target problem's slug
     * @param user - the authenticated caller, whose reveal is (idempotently) recorded
     * @returns whether a new reveal was recorded, plus the problem's reference solutions
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Solution revealed",
        [Locale.Vi]: "Đã mở đáp án",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RevealCodingSolutionResponse,
        {
            name: "revealCodingSolution",
            description: "Records a solution reveal (forfeits the problem's points on a later solve).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Slug of the problem whose solution is revealed.",
            },
        )
            request: RevealCodingSolutionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<RevealCodingSolutionResponseData> {
        // record the reveal for this user (idempotent) and serve the reference
        // solutions — this gated mutation is the ONLY place solutions reach the client
        const {
            revealed,
            solutions,
        } = await this.codingSubmissionService.recordSolutionReveal({
            userId: user.id,
            slug: request.slug,
        })
        return {
            revealed,
            solutions,
        }
    }
}
