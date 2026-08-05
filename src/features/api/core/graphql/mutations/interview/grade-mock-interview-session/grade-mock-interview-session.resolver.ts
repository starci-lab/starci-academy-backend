import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    GradeMockInterviewSessionRequest,
    GradeMockInterviewSessionResponse,
} from "./graphql-types"
import {
    GradeMockInterviewSessionService,
} from "./grade-mock-interview-session.service"

@Resolver()
/**
 * GraphQL entry for grading a finished mock interview. Enrolment is required
 * because RAG grounding is course-scoped; unenrolled callers must not see
 * course-private model answers.
 */
export class GradeMockInterviewSessionResolver {
    constructor(
        private readonly gradeMockInterviewSessionService: GradeMockInterviewSessionService,
    ) { }

    /**
     * Grades a WHOLE completed mock-interview session (all 5 phases, one
     * conversation) against the 5-phase rubric, grounded in what the course
     * actually taught via RAG. Persists the graded attempt for cross-session
     * history.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Mock interview session graded successfully",
        [Locale.Vi]: "Chấm phiên phỏng vấn thử thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => GradeMockInterviewSessionResponse,
        {
            name: "gradeMockInterviewSession",
            description: "Grades a whole mock-interview session against the 5-phase rubric.",
        },
    )
    async execute(
        @Args("request")
            request: GradeMockInterviewSessionRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.gradeMockInterviewSessionService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
