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
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    SyncFlashcardReviewSessionProgressRequest,
    SyncFlashcardReviewSessionProgressResponse,
} from "./graphql-types"
import {
    SyncFlashcardReviewSessionProgressService,
} from "./sync-flashcard-review-session-progress.service"

@Resolver()
export class SyncFlashcardReviewSessionProgressResolver {
    constructor(
        private readonly syncFlashcardReviewSessionProgressService: SyncFlashcardReviewSessionProgressService,
    ) { }

    /**
     * Periodically syncs an in-flight flashcard review session's position +
     * progress so a learner who navigates away mid-review can resume it via
     * `myInProgressFlashcardReviewSession`. Never throws for a stale/late
     * sync (session already completed/abandoned) — see the service's own
     * doc.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard review session synced successfully",
        [Locale.Vi]: "Đồng bộ phiên ôn tập thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SyncFlashcardReviewSessionProgressResponse,
        {
            name: "syncFlashcardReviewSessionProgress",
            description: "Syncs an in-flight flashcard review session's position + progress for later resume.",
        },
    )
    async execute(
        @Args("request")
            request: SyncFlashcardReviewSessionProgressRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.syncFlashcardReviewSessionProgressService.execute(
            {
                request,
                user,
            },
        )
    }
}
