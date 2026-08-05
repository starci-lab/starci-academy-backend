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
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    MyMockInterviewAttemptsService,
} from "./my-mock-interview-attempts.service"
import {
    MOCK_INTERVIEW_ATTEMPTS_DEFAULT_LIMIT,
    MOCK_INTERVIEW_ATTEMPTS_MAX_LIMIT,
} from "./constants"
import {
    MyMockInterviewAttemptsData,
    MyMockInterviewAttemptsResponse,
} from "./graphql-types"

@Resolver()
/**
 * The viewer's mock-interview HISTORY for one course — every past graded
 * session (newest first), paginated, so the scorecard's "past attempts" can
 * list and re-open them. Enrolled-only (the same surface that spends AI
 * credits to grade a session).
 */
export class MyMockInterviewAttemptsResolver {
    constructor(
        private readonly myMockInterviewAttemptsService: MyMockInterviewAttemptsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Mock interview history fetched successfully",
        [Locale.Vi]: "Lấy lịch sử phỏng vấn thử thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyMockInterviewAttemptsResponse,
        {
            name: "myMockInterviewAttempts",
            description: "The viewer's paginated mock-interview history for one course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose mock-interview history to fetch.",
            })
            courseId: string,
        @Args("limit",
            {
                type: () => Int,
                nullable: true,
                description: "Page size (attempts per page); defaults to 10, capped at 50.",
            })
            limit: number | null,
        @Args("offset",
            {
                type: () => Int,
                nullable: true,
                description: "Page offset (attempts to skip); defaults to 0.",
            })
            offset: number | null,
        @Args("mode",
            {
                type: () => String,
                nullable: true,
                description: "Optional mode filter (\"qna\" | \"design\"); omitted = every mode.",
            })
            mode: string | null,
    ): Promise<MyMockInterviewAttemptsData> {
        // clamp the client-provided page window so a bad request can't force a
        // huge unpaginated scan
        const safeLimit = Math.min(
            MOCK_INTERVIEW_ATTEMPTS_MAX_LIMIT,
            Math.max(1,
                limit ?? MOCK_INTERVIEW_ATTEMPTS_DEFAULT_LIMIT),
        )
        const safeOffset = Math.max(0,
            offset ?? 0)
        const result = await this.myMockInterviewAttemptsService.list({
            userId: user.id,
            courseId,
            limit: safeLimit,
            offset: safeOffset,
            mode: mode ?? undefined,
        })
        // project to the GraphQL shape — serialize each attempt's timestamp
        return {
            totalCount: result.totalCount,
            items: result.items.map((attempt) => ({
                id: attempt.id,
                sessionId: attempt.sessionId,
                promptId: attempt.promptId,
                promptTitle: attempt.promptTitle,
                level: attempt.level,
                mode: attempt.mode,
                overallScore: attempt.overallScore,
                verdict: attempt.verdict,
                phaseScores: attempt.phaseScores,
                attributeScores: attempt.attributeScores,
                strengths: attempt.strengths,
                gaps: attempt.gaps,
                followUpQuestion: attempt.followUpQuestion,
                matchedContentIds: attempt.matchedContentIds,
                questionReviews: attempt.questionReviews,
                createdAt: attempt.createdAt.toISOString(),
                name: attempt.name,
            })),
        }
    }
}
