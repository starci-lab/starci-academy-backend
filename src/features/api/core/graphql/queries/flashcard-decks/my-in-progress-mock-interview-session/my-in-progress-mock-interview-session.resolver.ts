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
    MOCK_INTERVIEW_SESSION_DURATION_MS,
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
import {
    MyInProgressMockInterviewSessionService,
} from "./my-in-progress-mock-interview-session.service"
import {
    MyInProgressMockInterviewSessionData,
    MyInProgressMockInterviewSessionResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The learner's most recent RESUMABLE mock-interview session for one course --
 * "resume mock interview session" (2026-07-08) -- so the FE can offer
 * "resume mock interview?" instead of forcing a fresh draw. Null when
 * there is none. Enrolled-only, mirroring `myMockInterviewAttempts`.
 */
export class MyInProgressMockInterviewSessionResolver {
    constructor(
        private readonly myInProgressMockInterviewSessionService: MyInProgressMockInterviewSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "In-progress mock interview session fetched successfully",
        [Locale.Vi]: "Lấy phiên phỏng vấn thử đang dang dở thành công", // vn-ok: vi-locale string emitted to clients
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
            status: result.status,
            revision: result.revision,
            rubricVersion: result.rubricVersion,
            gradingJobId: result.gradingJobId,
            gradingJobStatus: result.gradingJobStatus,
            gradingAttemptCount: result.gradingAttemptCount,
            gradingMaxAttempts: result.gradingMaxAttempts,
            gradingLastError: result.gradingLastError,
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
            name: result.name,
        }
    }
}
