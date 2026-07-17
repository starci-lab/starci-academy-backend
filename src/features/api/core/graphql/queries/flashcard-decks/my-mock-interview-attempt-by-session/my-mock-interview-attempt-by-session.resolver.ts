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
} from "@modules/bussiness"
import {
    MyMockInterviewAttemptBySessionService,
} from "./my-mock-interview-attempt-by-session.service"
import {
    MockInterviewAttemptItem,
} from "../my-mock-interview-attempts/graphql-types"
import {
    MyMockInterviewAttemptBySessionResponse,
} from "./graphql-types"

/**
 * Looks up ONE graded mock-interview attempt by its `sessionId` — the
 * fallback read for a resume attempt on a session that's no longer
 * `in_progress` (`myInProgressMockInterviewSession` already returned null):
 * if it was actually graded (finished normally, or auto-graded on the 1-hour
 * timeout), this recovers that result instead of a plain "session expired"
 * error.
 */
@Resolver()
export class MyMockInterviewAttemptBySessionResolver {
    constructor(
        private readonly myMockInterviewAttemptBySessionService: MyMockInterviewAttemptBySessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Mock interview attempt fetched successfully",
        [Locale.Vi]: "Lấy kết quả phỏng vấn thử thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyMockInterviewAttemptBySessionResponse,
        {
            name: "myMockInterviewAttemptBySessionId",
            description: "The viewer's graded mock-interview attempt for one session, or null when none exists yet.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course the session belongs to.",
            })
            courseId: string,
        @Args("sessionId",
            {
                type: () => ID,
                description: "The session id to look up.",
            })
            sessionId: string,
    ): Promise<MockInterviewAttemptItem | null> {
        const attempt = await this.myMockInterviewAttemptBySessionService.find({
            userId: user.id,
            courseId,
            sessionId,
        })

        if (!attempt) {
            return null
        }

        return {
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
        }
    }
}
