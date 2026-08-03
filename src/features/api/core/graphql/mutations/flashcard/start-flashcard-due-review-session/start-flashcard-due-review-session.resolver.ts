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
    StartFlashcardDueReviewSessionRequest,
    StartFlashcardDueReviewSessionResponse,
} from "./graphql-types"
import {
    StartFlashcardDueReviewSessionService,
} from "./start-flashcard-due-review-session.service"

/**
 * GraphQL entrypoint for `startFlashcardDueReviewSession` — delegates to {@link StartFlashcardDueReviewSessionService.execute},
 * which dispatches the CQRS command {@link StartFlashcardDueReviewSessionHandler} owns. See {@link execute}'s
 * own doc below for what the mutation actually does.
 */
@Resolver()
export class StartFlashcardDueReviewSessionResolver {
    constructor(
        private readonly startFlashcardDueReviewSessionService: StartFlashcardDueReviewSessionService,
    ) { }

    /**
     * Persists ONE cross-deck due-review batch session draw so it becomes
     * resumable — mirrors `startFlashcardReviewSession`. Retires any PRIOR
     * "in_progress" draw for the same enrollment first, so a learner never
     * has two resumable due-review batches at once.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard due-review session started successfully",
        [Locale.Vi]: "Bắt đầu phiên ôn tập đến hạn thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => StartFlashcardDueReviewSessionResponse,
        {
            name: "startFlashcardDueReviewSession",
            description: "Persists a resumable cross-deck due-review batch session for a course + drawn card set.",
        },
    )
    async execute(
        @Args("request")
            request: StartFlashcardDueReviewSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.startFlashcardDueReviewSessionService.execute(
            {
                request,
                user,
            },
        )
    }
}
