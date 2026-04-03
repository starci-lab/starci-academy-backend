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
    SyncSubmissionsRequest,
    SyncSubmissionsResponse,
} from "./graphql-types"
import {
    SyncSubmissionsService,
} from "./sync-submissions.service"

/**
 * GraphQL entry for syncing challenge submissions for the current user.
 */
@Resolver()
export class SyncSubmissionsResolver {
    constructor(
        private readonly syncSubmissionsService: SyncSubmissionsService,
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
        () => SyncSubmissionsResponse,
        {
            name: "syncChallengeSubmissions",
            description: "Upserts submission URLs for the current user; URL format must match each submission's type (GitHub or Google Docs).",
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
            request: SyncSubmissionsRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<void> {
        await this.syncSubmissionsService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
