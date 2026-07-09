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
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    MyInProgressFlashcardQuizSessionService,
} from "./my-in-progress-flashcard-quiz-session.service"
import {
    MyInProgressFlashcardQuizSessionData,
    MyInProgressFlashcardQuizSessionResponse,
} from "./graphql-types"

/**
 * The learner's most recent RESUMABLE flashcard quick-quiz session for one
 * course — "resume flashcard quiz session" (2026-07-08) — so the FE can
 * offer "Tiếp tục phiên hỏi nhanh?" instead of forcing a fresh draw. Null
 * when there is none. Mirrors `myInProgressMockInterviewSession`.
 */
@Resolver()
export class MyInProgressFlashcardQuizSessionResolver {
    constructor(
        private readonly myInProgressFlashcardQuizSessionService: MyInProgressFlashcardQuizSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "In-progress flashcard quiz session fetched successfully",
        [Locale.Vi]: "Lấy phiên hỏi nhanh đang dang dở thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyInProgressFlashcardQuizSessionResponse,
        {
            name: "myInProgressFlashcardQuizSession",
            description: "The viewer's most recent resumable (\"in_progress\", synced within the last 24h) flashcard quick-quiz session for one course, or null when there is none.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose in-progress flashcard quiz session to look up.",
            })
            courseId: string,
    ): Promise<MyInProgressFlashcardQuizSessionData | null> {
        const result = await this.myInProgressFlashcardQuizSessionService.find({
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
            results: result.results,
            updatedAt: result.updatedAt.toISOString(),
        }
    }
}
