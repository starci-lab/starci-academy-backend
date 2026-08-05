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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    FlashcardReviewSessionService,
} from "@modules/bussiness/flashcard/flashcard-review-session.service"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    MyInProgressFlashcardReviewSessionData,
    MyInProgressFlashcardReviewSessionResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The learner's most recent RESUMABLE flashcard review session
 * for one deck -- so the FE can offer "resume review?" instead of forcing a
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
        [Locale.Vi]: "Lấy phiên ôn tập đang dang dở thành công", // vn-ok: vi-locale string emitted to clients
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
