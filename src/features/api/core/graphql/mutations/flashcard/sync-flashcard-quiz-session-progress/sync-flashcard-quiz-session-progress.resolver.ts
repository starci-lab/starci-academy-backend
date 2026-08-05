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
    SyncFlashcardQuizSessionProgressRequest,
    SyncFlashcardQuizSessionProgressResponse,
} from "./graphql-types"
import {
    SyncFlashcardQuizSessionProgressService,
} from "./sync-flashcard-quiz-session-progress.service"

@Resolver()
/**
 * GraphQL entrypoint for `syncFlashcardQuizSessionProgress` -- delegates to {@link SyncFlashcardQuizSessionProgressService.execute},
 * which dispatches the CQRS command {@link SyncFlashcardQuizSessionProgressHandler} owns. See {@link execute}'s
 * own doc below for what the mutation actually does.
 */
export class SyncFlashcardQuizSessionProgressResolver {
    constructor(
        private readonly syncFlashcardQuizSessionProgressService: SyncFlashcardQuizSessionProgressService,
    ) { }

    /**
     * Periodically syncs an in-flight flashcard quick-quiz session's per-card
     * results + position so a learner who navigates away mid-quiz can resume
     * it via `myInProgressFlashcardQuizSession`. Never throws for a
     * stale/late sync (session already completed/abandoned) -- see the
     * handler's own doc.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard quiz session synced successfully",
        [Locale.Vi]: "Đồng bộ phiên hỏi nhanh thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SyncFlashcardQuizSessionProgressResponse,
        {
            name: "syncFlashcardQuizSessionProgress",
            description: "Syncs an in-flight flashcard quick-quiz session's per-card results + position for later resume.",
        },
    )
    async execute(
        @Args("request")
            request: SyncFlashcardQuizSessionProgressRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.syncFlashcardQuizSessionProgressService.execute(
            {
                request,
                user,
            },
        )
    }
}
