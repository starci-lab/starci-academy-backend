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
    GraphQLMustEnrolledGuard,
    InterviewHistoryService,
} from "@modules/bussiness"
import {
    InterviewSessionAttemptsData,
    InterviewSessionAttemptsResponse,
} from "./graphql-types"

/**
 * The answered questions of ONE mock-interview run (session), in answer order —
 * each with its grade (score/verdict), the question prompt, and the persisted
 * feedback (strengths/gaps/hint). Powers the run-detail drawer in interview history.
 */
@Resolver()
export class InterviewSessionAttemptsResolver {
    constructor(
        private readonly interviewHistoryService: InterviewHistoryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Interview run detail fetched successfully",
        [Locale.Vi]: "Lấy chi tiết phiên phỏng vấn thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => InterviewSessionAttemptsResponse,
        {
            name: "interviewSessionAttempts",
            description: "The answered questions of one mock-interview run (with grade + feedback).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("sessionId",
            {
                type: () => ID,
                description: "The run (session) whose answers to list.",
            })
            sessionId: string,
        @Args("courseId",
            {
                type: () => ID,
                nullable: true,
                description: "Optional course scope (random-interview mode = course-wide).",
            })
            courseId: string | null,
        @Args("flashcardDeckId",
            {
                type: () => ID,
                nullable: true,
                description: "Optional deck scope (takes precedence over courseId).",
            })
            flashcardDeckId: string | null,
    ): Promise<InterviewSessionAttemptsData> {
        const attempts = await this.interviewHistoryService.getSessionAttempts({
            userId: user.id,
            flashcardDeckId,
            courseId,
            sessionId,
        })
        return {
            items: attempts.map((attempt) => ({
                id: attempt.id,
                score: attempt.score,
                verdict: attempt.verdict,
                level: attempt.level,
                tags: attempt.tags,
                question: attempt.question,
                strengths: attempt.strengths,
                gaps: attempt.gaps,
                modelAnswerHint: attempt.modelAnswerHint,
                createdAt: attempt.createdAt.toISOString(),
            })),
        }
    }
}
