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
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    MyFlashcardQuizHistoryService,
} from "./my-flashcard-quiz-history.service"
import {
    MY_FLASHCARD_QUIZ_HISTORY_DEFAULT_LIMIT,
    MY_FLASHCARD_QUIZ_HISTORY_MAX_LIMIT,
} from "./constants"
import {
    MyFlashcardQuizHistoryData,
    MyFlashcardQuizHistoryResponse,
} from "./graphql-types"

@Resolver()
/**
 * The viewer's flashcard quick-quiz HISTORY for one course --
 * every past completed session (newest first), paginated, so the recap
 * surface's "past sessions" can list them without re-deriving coverage or
 * joining `xp_histories`. Enrollment-scoped, same as
 * `myInProgressFlashcardQuizSession`.
 */
export class MyFlashcardQuizHistoryResolver {
    constructor(
        private readonly myFlashcardQuizHistoryService: MyFlashcardQuizHistoryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard quiz history fetched successfully",
        [Locale.Vi]: "Lấy lịch sử hỏi nhanh thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFlashcardQuizHistoryResponse,
        {
            name: "myFlashcardQuizHistory",
            description: "The viewer's paginated flashcard quick-quiz history for one course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose flashcard quiz history to fetch.",
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
    ): Promise<MyFlashcardQuizHistoryData> {
        // clamp the client-provided page window so a bad request can't force a
        // huge unpaginated scan
        const safeLimit = Math.min(
            MY_FLASHCARD_QUIZ_HISTORY_MAX_LIMIT,
            Math.max(1,
                limit ?? MY_FLASHCARD_QUIZ_HISTORY_DEFAULT_LIMIT),
        )
        const safeOffset = Math.max(0,
            offset ?? 0)
        const result = await this.myFlashcardQuizHistoryService.list({
            userId: user.id,
            courseId,
            limit: safeLimit,
            offset: safeOffset,
        })
        // project to the GraphQL shape -- serialize each session's timestamp
        return {
            totalCount: result.totalCount,
            items: result.items.map((item) => ({
                id: item.id,
                updatedAt: item.updatedAt.toISOString(),
                mode: item.mode,
                level: item.level,
                cardCount: item.cardCount,
                correctCount: item.correctCount,
                coverage: item.coverage,
                xpEarned: item.xpEarned,
                weakTags: item.weakTags,
                name: item.name,
            })),
        }
    }
}
