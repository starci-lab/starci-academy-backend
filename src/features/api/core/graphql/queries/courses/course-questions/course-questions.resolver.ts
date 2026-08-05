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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    CourseQuestionsRequest,
} from "./graphql-types/request"
import {
    CourseQuestionsResponse,
} from "./graphql-types/response"
import type {
    CourseQuestionsPageObject,
} from "./graphql-types/course-questions-page.object"
import {
    CourseQuestionsService,
} from "./course-questions.service"

@Resolver()
/**
 * Login-only (not enrollment-gated) GraphQL entry for `courseQuestions` --
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
