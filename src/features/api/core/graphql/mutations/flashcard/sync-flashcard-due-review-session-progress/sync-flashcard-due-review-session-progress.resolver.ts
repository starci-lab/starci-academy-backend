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
    SyncFlashcardDueReviewSessionProgressRequest,
    SyncFlashcardDueReviewSessionProgressResponse,
} from "./graphql-types"
import {
    SyncFlashcardDueReviewSessionProgressService,
} from "./sync-flashcard-due-review-session-progress.service"

@Resolver()
/**
 * GraphQL entrypoint for `syncFlashcardDueReviewSessionProgress` -- delegates to {@link SyncFlashcardDueReviewSessionProgressService.execute},
 * which dispatches the CQRS command {@link SyncFlashcardDueReviewSessionProgressHandler} owns. See {@link execute}'s
 * own doc below for what the mutation actually does.
 */
export class SyncFlashcardDueReviewSessionProgressResolver {
    constructor(
        private readonly syncFlashcardDueReviewSessionProgressService: SyncFlashcardDueReviewSessionProgressService,
    ) { }

    /**
     * Periodically syncs an in-flight cross-deck due-review batch session's
     * position + progress so a learner who navigates away mid-batch can
     * resume it via `myInProgressFlashcardDueReviewSession`. Never throws
     * for a stale/late sync (session already completed/abandoned) -- see the
     * service's own doc.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard due-review session synced successfully",
        [Locale.Vi]: "Đồng bộ phiên ôn tập đến hạn thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SyncFlashcardDueReviewSessionProgressResponse,
        {
            name: "syncFlashcardDueReviewSessionProgress",
            description: "Syncs an in-flight cross-deck due-review batch session's position + progress for later resume.",
        },
    )
    async execute(
        @Args("request")
            request: SyncFlashcardDueReviewSessionProgressRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.syncFlashcardDueReviewSessionProgressService.execute(
            {
                request,
                user,
            },
        )
    }
}
