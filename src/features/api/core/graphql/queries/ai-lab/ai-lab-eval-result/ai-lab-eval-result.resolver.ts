import {
    Args,
    ID,
    Query,
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
    AiLabEvalRunEntity,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    AiLabEvalService,
} from "@modules/bussiness"
import {
    AiLabEvalResultResponse,
} from "./graphql-types"

/**
 * Returns a single graded AI Lab eval run (with per-case results) owned by the
 * authenticated learner. The FE polls this after the eval-grading job completes
 * over the existing job-notifications socket.
 */
@Resolver()
export class AiLabEvalResultResolver {
    constructor(
        private readonly aiLabEvalService: AiLabEvalService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI Lab eval result fetched successfully",
        [Locale.Vi]: "Lấy kết quả chấm phòng thí nghiệm AI thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => AiLabEvalResultResponse,
        {
            name: "aiLabEvalResult",
            description: "Returns one graded AI Lab eval run (with per-case results) owned by the learner.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "evalRunId",
            {
                type: () => ID,
            },
        )
            evalRunId: string,
    ): Promise<AiLabEvalRunEntity | null> {
        // owner-scoped load so a learner only reads their own verdict
        const {
            evalRun,
        } = await this.aiLabEvalService.getEvalResult({
            evalRunId,
            userId: user.id,
        })
        return evalRun
    }
}
