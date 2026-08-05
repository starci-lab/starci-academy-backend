import {
    Args,
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
    CourseQuestionsRequest,
    CourseQuestionsResponse,
} from "./graphql-types"
import type {
    CourseQuestionsPageObject,
} from "./graphql-types"
import {
    CourseQuestionsService,
} from "./course-questions.service"

@Resolver()
/**
 * Login-only (not enrollment-gated) GraphQL entry for `courseQuestions` —
 * aggregates top-level Q&A across every lesson so trial learners can browse.
 */
export class CourseQuestionsResolver {
    constructor(
        private readonly courseQuestionsService: CourseQuestionsService,
    ) {}

    /**
     * Aggregates a course's top-level questions across all its lessons. Login-only
     * (NOT enrollment-gated) so trial learners can browse the Q&A roll-up.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course questions fetched successfully",
        [Locale.Vi]: "Lấy câu hỏi khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CourseQuestionsResponse,
        {
            name: "courseQuestions",
            description: "Aggregates a course's top-level questions across all lessons.",
        },
    )
    async execute(
        @Args("request")
            request: CourseQuestionsRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CourseQuestionsPageObject> {
        return this.courseQuestionsService.execute({
            request,
            user,
        })
    }
}
