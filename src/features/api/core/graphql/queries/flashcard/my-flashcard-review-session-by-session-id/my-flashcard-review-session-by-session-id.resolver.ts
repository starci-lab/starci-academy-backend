import {
    Args,
    ID,
    Query,
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
    FlashcardDueReviewSessionService,
    FlashcardReviewSessionService,
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    MyFlashcardReviewSessionBySessionIdData,
    MyFlashcardReviewSessionBySessionIdResponse,
} from "./graphql-types"

@Resolver()
/**
 * Resolve a flashcard review session by its id ALONE -- the FE's unified
 * `/review/sessions/[sessionId]` route  uses this instead of the 2 separately-scoped
 * `myInProgressFlashcardReviewSession(deckId)` /
 * `myInProgressFlashcardDueReviewSession(courseId)` queries, neither of
 * which can answer "which session is THIS id" alone. Tries the deck-scoped
 * table first (attaches `deckId`/`deckTitle`), then the cross-deck due-review
 * table -- the two entities remain separate (keep 2 BE tables, unify
 * only FE), this resolver is the seam that hides that split from the client.
 */
export class MyFlashcardReviewSessionBySessionIdResolver {
    constructor(
        private readonly flashcardReviewSessionService: FlashcardReviewSessionService,
        private readonly flashcardDueReviewSessionService: FlashcardDueReviewSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard session fetched successfully",
        [Locale.Vi]: "Lấy phiên ôn thẻ thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFlashcardReviewSessionBySessionIdResponse,
        {
            name: "myFlashcardReviewSessionBySessionId",
            description: "A flashcard review/due-review session resolved by its id alone (whichever kind it is), or null when not found/not owned by the caller.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("sessionId",
            {
                type: () => ID,
                description: "Id of the session to resolve.",
            })
            sessionId: string,
    ): Promise<MyFlashcardReviewSessionBySessionIdData | null> {
        const deckSession = await this.flashcardReviewSessionService.findById({
            userId: user.id,
            sessionId,
        })
        if (deckSession) {
            return {
                sessionId: deckSession.sessionId,
                kind: "deck",
                deckId: deckSession.deckId,
                deckTitle: deckSession.deckTitle,
                cardIds: deckSession.cardIds,
                currentIndex: deckSession.currentIndex,
                reviewedCount: deckSession.reviewedCount,
                gradedIndexes: deckSession.gradedIndexes ?? [],
                xpEarned: deckSession.xpEarned,
                updatedAt: deckSession.updatedAt.toISOString(),
            }
        }

        const dueSession = await this.flashcardDueReviewSessionService.findById({
            userId: user.id,
            sessionId,
        })
        if (dueSession) {
            return {
                sessionId: dueSession.sessionId,
                kind: "due",
                cardIds: dueSession.cardIds,
                currentIndex: dueSession.currentIndex,
                reviewedCount: dueSession.reviewedCount,
                gradedIndexes: dueSession.gradedIndexes ?? [],
                xpEarned: dueSession.xpEarned,
                updatedAt: dueSession.updatedAt.toISOString(),
            }
        }

        return null
    }
}
