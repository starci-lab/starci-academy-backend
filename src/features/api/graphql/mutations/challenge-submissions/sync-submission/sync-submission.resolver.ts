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
    SyncSubmissionRequest,
    SyncSubmissionResponse,
} from "./graphql-types"
import {
    SyncSubmissionService,
} from "./sync-submission.service"

/**
 * GraphQL entry for syncing challenge submissions for the current user.
 */
@Resolver()
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
        [Locale.Vi]: "Đồng bộ bài nộp thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
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
    ): Promise<void> {
        await this.syncSubmissionService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
