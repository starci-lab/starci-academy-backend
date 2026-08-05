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
    FLASHCARD_QUIZ_SESSION_DURATION_MS,
} from "@modules/databases/postgresql/primary/entities/flashcard-quiz-session.entity"
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
    MyInProgressFlashcardQuizSessionService,
} from "./my-in-progress-flashcard-quiz-session.service"
import {
    MyInProgressFlashcardQuizSessionData,
    MyInProgressFlashcardQuizSessionResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The learner's most recent RESUMABLE flashcard quick-quiz session for one
 * course -- "resume flashcard quiz session" (2026-07-08) -- so the FE can
 * offer "resume quick-quiz session?" instead of forcing a fresh draw. Null
 * when there is none. Mirrors `myInProgressMockInterviewSession`.
 */
export class MyInProgressFlashcardQuizSessionResolver {
    constructor(
        private readonly myInProgressFlashcardQuizSessionService: MyInProgressFlashcardQuizSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "In-progress flashcard quiz session fetched successfully",
        [Locale.Vi]: "Lấy phiên hỏi nhanh đang dang dở thành công", // vn-ok: vi-locale string emitted to clients
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
            deadlineAt: new Date(result.createdAt.getTime() + FLASHCARD_QUIZ_SESSION_DURATION_MS).toISOString(),
            name: result.name,
        }
    }
}
