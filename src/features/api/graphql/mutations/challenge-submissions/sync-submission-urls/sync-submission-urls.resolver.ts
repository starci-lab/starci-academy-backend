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
    SyncSubmissionUrlsRequest,
    SyncSubmissionUrlsResponse,
} from "./graphql-types"
import {
    SyncSubmissionUrlsService,
} from "./sync-submission-urls.service"

/**
 * GraphQL entry for syncing challenge submission URLs for the current user.
 */
@Resolver()
export class SyncSubmissionUrlsResolver {
    constructor(
        private readonly syncSubmissionUrlsService: SyncSubmissionUrlsService,
    ) {}

    /**
     * GraphQL entry for syncing challenge submission URLs for the current user.
     * @param user - The user.
     * @param request - The request.
     * @param locale - The locale.
     * @returns The response.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Submission URLs synced successfully",
        [Locale.Vi]: "Đồng bộ URL bài nộp thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SyncSubmissionUrlsResponse,
        {
            name: "syncChallengeSubmissionUrls",
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
            request: SyncSubmissionUrlsRequest,
        @GraphQLLocale()
            locale: Locale,
    ) {
        this.syncSubmissionUrlsService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
