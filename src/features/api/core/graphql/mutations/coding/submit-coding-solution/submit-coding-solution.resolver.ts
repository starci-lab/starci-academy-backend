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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
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
    CodingSubmissionService,
} from "@modules/bussiness/coding/coding-submission.service"
import {
    ClientContextParam,
} from "@modules/platform/client-context/decorators/client-context.decorators"
import type {
    ClientContext,
} from "@modules/platform/client-context/types"
import {
    SubmitCodingSolutionRequest,
} from "./graphql-types/request"
import {
    SubmitCodingSolutionResponse,
    type SubmitCodingSolutionResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Submits a solution: persists a pending submission, enqueues the async Judge0
 * judging job, and returns the submission + job ids. The client subscribes to
 * the job over the `job_notifications` Socket.IO namespace for the verdict.
 * Rate-limited (Strict) to curb spam submits.
 */
export class SubmitCodingSolutionResolver {
    constructor(
        private readonly codingSubmissionService: CodingSubmissionService,
    ) {}

    /**
     * Resolves the `submitCodingSolution` mutation for the authenticated user.
     *
     * @param request - problem slug, language, source code, and optional anti-cheat telemetry
     * @param user - the authenticated caller the submission is attributed to
     * @param client - request metadata (IP/user-agent/fingerprint) forwarded to device tracking
     * @returns the created submission id + the judging job id to subscribe to
     */
    @UseThrottler(ThrottlerConfig.Strict)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Solution submitted for judging",
        [Locale.Vi]: "Đã nộp bài, đang chấm", // vn-ok: vi-locale string emitted to clients
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
