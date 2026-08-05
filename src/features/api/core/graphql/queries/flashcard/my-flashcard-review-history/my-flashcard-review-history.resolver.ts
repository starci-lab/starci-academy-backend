import {
    Args,
    ID,
    Int,
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
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    MyFlashcardReviewHistoryService,
} from "./my-flashcard-review-history.service"
import {
    MY_FLASHCARD_REVIEW_HISTORY_DEFAULT_LIMIT,
    MY_FLASHCARD_REVIEW_HISTORY_MAX_LIMIT,
} from "./constants/pagination"
import {
    MyFlashcardReviewHistoryData,
    MyFlashcardReviewHistoryResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The viewer's flashcard review HISTORY for one course -- every
 * past completed session (newest first), paginated, so the recap surface's
 * "past sessions" can list them. Mirrors `myFlashcardQuizHistory`.
 * Enrollment-scoped, same as `myInProgressFlashcardReviewSession`.
 */
export class MyFlashcardReviewHistoryResolver {
    constructor(
        private readonly myFlashcardReviewHistoryService: MyFlashcardReviewHistoryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard review history fetched successfully",
        [Locale.Vi]: "Lấy lịch sử ôn tập thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFlashcardReviewHistoryResponse,
        {
            name: "myFlashcardReviewHistory",
            description: "The viewer's paginated flashcard review history for one course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose flashcard review history to fetch.",
            })
            courseId: string,
        @Args("limit",
            {
                type: () => Int,
                nullable: true,
                description: "Page size (sessions per page); defaults to 10, capped at 50.",
            })
            limit: number | null,
        @Args("offset",
            {
                type: () => Int,
                nullable: true,
                description: "Page offset (sessions to skip); defaults to 0.",
            })
            offset: number | null,
    ): Promise<MyFlashcardReviewHistoryData> {
        // clamp the client-provided page window so a bad request can't force a
        // huge unpaginated scan
        const safeLimit = Math.min(
            MY_FLASHCARD_REVIEW_HISTORY_MAX_LIMIT,
            Math.max(1,
                limit ?? MY_FLASHCARD_REVIEW_HISTORY_DEFAULT_LIMIT),
        )
        const safeOffset = Math.max(0,
            offset ?? 0)
        const result = await this.myFlashcardReviewHistoryService.list({
            userId: user.id,
            courseId,
            limit: safeLimit,
            offset: safeOffset,
        })
        return {
            totalCount: result.totalCount,
            items: result.items.map((item) => ({
                id: item.id,
                updatedAt: item.updatedAt.toISOString(),
                deckId: item.deckId,
                deckTitle: item.deckTitle,
                cardCount: item.cardCount,
                reviewedCount: item.reviewedCount,
                xpEarned: item.xpEarned,
            })),
        }
    }
}
