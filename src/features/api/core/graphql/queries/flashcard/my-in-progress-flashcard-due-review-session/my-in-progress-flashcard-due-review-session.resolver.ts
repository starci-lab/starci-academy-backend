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
    FlashcardDueReviewSessionService,
} from "@modules/bussiness/flashcard/flashcard-due-review-session.service"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    MyInProgressFlashcardDueReviewSessionData,
    MyInProgressFlashcardDueReviewSessionResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The learner's most recent RESUMABLE cross-deck due-review batch session
 * for one course -- so the FE can silently resume the batch instead of
 * re-drawing. Null when there is none. Mirrors
 * `myInProgressFlashcardReviewSession`, scoped by course instead of deck
 * (a due-review batch spans multiple decks).
 */
export class MyInProgressFlashcardDueReviewSessionResolver {
    constructor(
        private readonly flashcardDueReviewSessionService: FlashcardDueReviewSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "In-progress flashcard due-review session fetched successfully",
        [Locale.Vi]: "Lấy phiên ôn tập đến hạn đang dang dở thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyInProgressFlashcardDueReviewSessionResponse,
        {
            name: "myInProgressFlashcardDueReviewSession",
            description: "The viewer's most recent resumable (\"in_progress\", synced within the last 24h) cross-deck due-review batch session for one course, or null when there is none.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose in-progress due-review batch session to look up.",
            })
            courseId: string,
    ): Promise<MyInProgressFlashcardDueReviewSessionData | null> {
        const result = await this.flashcardDueReviewSessionService.findInProgress({
            userId: user.id,
            courseId,
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
