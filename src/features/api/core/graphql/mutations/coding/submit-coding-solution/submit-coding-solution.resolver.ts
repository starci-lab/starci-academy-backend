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
    ClientContextParam,
    type ClientContext,
} from "@modules/client-context"
import {
    SubmitCodingSolutionRequest,
    SubmitCodingSolutionResponse,
    type SubmitCodingSolutionResponseData,
} from "./graphql-types"

/**
 * Submits a solution: persists a pending submission, enqueues the async Judge0
 * judging job, and returns the submission + job ids. The client subscribes to
 * the job over the `job_notifications` Socket.IO namespace for the verdict.
 * Rate-limited (Strict) to curb spam submits.
 */
@Resolver()
export class SubmitCodingSolutionResolver {
    constructor(
        private readonly codingSubmissionService: CodingSubmissionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Solution submitted for judging",
        [Locale.Vi]: "Đã nộp bài, đang chấm",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SubmitCodingSolutionResponse,
        {
            name: "submitCodingSolution",
            description: "Submits a solution for async judging; returns the submission + job ids.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Problem slug, language, and source code.",
            },
        )
            request: SubmitCodingSolutionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
        @ClientContextParam()
            client: ClientContext,
    ): Promise<SubmitCodingSolutionResponseData> {
        // create the pending submission + enqueue judging, scoped to the user.
        // request metadata feeds device tracking; telemetry is captured for transport only
        return this.codingSubmissionService.submit({
            userId: user.id,
            slug: request.slug,
            language: request.language,
            sourceCode: request.sourceCode,
            telemetry: request.telemetry,
            ipAddress: client.ipAddress,
            userAgent: client.userAgent,
            fingerprint: client.fingerprint,
        })
    }
}
