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
    SyncSubmissionRequest,
} from "./graphql-types/request"
import {
    SyncSubmissionResponse,
    SyncSubmissionResponseData,
} from "./graphql-types/response"
import {
    SyncSubmissionService,
} from "./sync-submission.service"
import type {
    GraphQLEnrollmentContextParams,
} from "../../../shared/types/graphql-enrollment-context"

@Resolver()
/**
 * GraphQL entry for syncing challenge submissions for the current user.
 */
export class SyncSubmissionResolver {
    constructor(
        private readonly syncSubmissionService: SyncSubmissionService,
    ) {}

    /**
     * GraphQL entry for syncing challenge submissions for the current user.
     * @param user - The user.
     * @param request - The request.
     * @param locale - The locale.
     * @returns The response.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Submissions synced successfully",
        [Locale.Vi]: "Đồng bộ bài nộp thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SyncSubmissionResponse,
        {
            name: "syncSubmission",
            description: "Upserts one submission URL for the current user; URL format must match the submission type (GitHub or Google Docs).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Challenge submission ids and URLs to upsert.",
            },
        )
            request: SyncSubmissionRequest,
        @GraphQLLocale()
            locale: Locale,
        @Context()
            context: GraphQLEnrollmentContextParams,
    ): Promise<SyncSubmissionResponseData> {
        return this.syncSubmissionService.execute(
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
