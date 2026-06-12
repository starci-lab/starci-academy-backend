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

/**
 * Records that the user revealed a problem's reference solution. Idempotent.
 * Once revealed, a later first solve of that problem awards no points — peeking
 * the answer forfeits the score. Auth-guarded + soft-throttled.
 */
@Resolver()
export class RevealCodingSolutionResolver {
    constructor(
        private readonly codingSubmissionService: CodingSubmissionService,
    ) {}

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
