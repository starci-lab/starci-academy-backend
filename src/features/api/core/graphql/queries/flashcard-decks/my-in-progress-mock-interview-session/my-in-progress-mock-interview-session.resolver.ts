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
    MOCK_INTERVIEW_SESSION_DURATION_MS,
    UserEntity,
} from "@modules/databases"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    MyInProgressMockInterviewSessionService,
} from "./my-in-progress-mock-interview-session.service"
import {
    MyInProgressMockInterviewSessionData,
    MyInProgressMockInterviewSessionResponse,
} from "./graphql-types"

/**
 * The learner's most recent RESUMABLE mock-interview session for one course —
 * "resume mock interview session" (2026-07-08) — so the FE can offer
 * "Tiếp tục phiên phỏng vấn?" instead of forcing a fresh draw. Null when
 * there is none. Enrolled-only, mirroring `myMockInterviewAttempts`.
 */
@Resolver()
export class MyInProgressMockInterviewSessionResolver {
    constructor(
        private readonly myInProgressMockInterviewSessionService: MyInProgressMockInterviewSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "In-progress mock interview session fetched successfully",
        [Locale.Vi]: "Lấy phiên phỏng vấn thử đang dang dở thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyInProgressMockInterviewSessionResponse,
        {
            name: "myInProgressMockInterviewSession",
            description: "The viewer's most recent resumable (\"in_progress\", synced within the last 24h) mock-interview session for one course, or null when there is none.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose in-progress mock-interview session to look up.",
            })
            courseId: string,
    ): Promise<MyInProgressMockInterviewSessionData | null> {
        const result = await this.myInProgressMockInterviewSessionService.find({
            userId: user.id,
            courseId,
        })
        if (!result) {
            return null
        }
        return {
            sessionId: result.sessionId,
            promptId: result.promptId,
            promptTitle: result.promptTitle,
            level: result.level,
            difficulty: result.difficulty,
            source: result.source,
            mode: result.mode,
            seedQuestions: result.seedQuestions,
            turns: result.turns,
            questionIndex: result.questionIndex,
            phaseIndex: result.phaseIndex,
            updatedAt: result.updatedAt.toISOString(),
            deadlineAt: new Date(result.createdAt.getTime() + MOCK_INTERVIEW_SESSION_DURATION_MS).toISOString(),
        }
    }
}
