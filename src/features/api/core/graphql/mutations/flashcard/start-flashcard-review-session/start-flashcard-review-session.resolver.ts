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
    StartFlashcardReviewSessionRequest,
    StartFlashcardReviewSessionResponse,
} from "./graphql-types"
import {
    StartFlashcardReviewSessionService,
} from "./start-flashcard-review-session.service"

/**
 * GraphQL entrypoint for `startFlashcardReviewSession` — delegates to {@link StartFlashcardReviewSessionService.execute},
 * which dispatches the CQRS command {@link StartFlashcardReviewSessionHandler} owns. See {@link execute}'s
 * own doc below for what the mutation actually does.
 */
@Resolver()
export class StartFlashcardReviewSessionResolver {
    constructor(
        private readonly startFlashcardReviewSessionService: StartFlashcardReviewSessionService,
    ) { }

    /**
     * Persists ONE flashcard review ("Học thẻ") session draw over a single
     * deck so it becomes resumable — mirrors `startFlashcardQuizSession`.
     * Retires any PRIOR "in_progress" draw for the same enrollment+deck
     * first, so a learner never has two resumable review sessions on the
     * same deck at once.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard review session started successfully",
        [Locale.Vi]: "Bắt đầu phiên ôn tập thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => StartFlashcardReviewSessionResponse,
        {
            name: "startFlashcardReviewSession",
            description: "Persists a resumable flashcard review session for a deck + its card order.",
        },
    )
    async execute(
        @Args("request")
            request: StartFlashcardReviewSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.startFlashcardReviewSessionService.execute(
            {
                request,
                user,
            },
        )
    }
}
