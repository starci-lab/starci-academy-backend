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
    FlashcardReviewSessionService,
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    MyInProgressFlashcardReviewSessionData,
    MyInProgressFlashcardReviewSessionResponse,
} from "./graphql-types"

@Resolver()
/**
 * The learner's most recent RESUMABLE flashcard review ("Học thẻ") session
 * for one deck — so the FE can offer "Tiếp tục ôn tập?" instead of forcing a
 * fresh draw. Null when there is none. Mirrors
 * `myInProgressFlashcardQuizSession`, scoped by deck instead of course.
 */
export class MyInProgressFlashcardReviewSessionResolver {
    constructor(
        private readonly flashcardReviewSessionService: FlashcardReviewSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "In-progress flashcard review session fetched successfully",
        [Locale.Vi]: "Lấy phiên ôn tập đang dang dở thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyInProgressFlashcardReviewSessionResponse,
        {
            name: "myInProgressFlashcardReviewSession",
            description: "The viewer's most recent resumable (\"in_progress\", synced within the last 24h) flashcard review session for one deck, or null when there is none.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("deckId",
            {
                type: () => ID,
                description: "Deck whose in-progress flashcard review session to look up.",
            })
            deckId: string,
    ): Promise<MyInProgressFlashcardReviewSessionData | null> {
        const result = await this.flashcardReviewSessionService.findInProgress({
            userId: user.id,
            deckId,
        })
        if (!result) {
            return null
        }
        return {
            sessionId: result.sessionId,
            cardIds: result.cardIds,
            currentIndex: result.currentIndex,
            reviewedCount: result.reviewedCount,
            gradedIndexes: result.gradedIndexes ?? [],
            xpEarned: result.xpEarned,
            updatedAt: result.updatedAt.toISOString(),
        }
    }
}
