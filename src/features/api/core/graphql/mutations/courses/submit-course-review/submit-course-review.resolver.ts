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
} from "@modules/api/apollo/server/decorators/locale.decorators"
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
    CourseReviewEntity,
} from "@modules/databases/postgresql/primary/entities/course-review.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    SubmitCourseReviewRequest,
} from "./graphql-types/request"
import {
    SubmitCourseReviewResponse,
} from "./graphql-types/response"
import {
    SubmitCourseReviewService,
} from "./submit-course-review.service"

@Resolver()
/**
 * GraphQL entry for writing a review on a course the caller has bought.
 */
export class SubmitCourseReviewResolver {
    constructor(
        private readonly submitCourseReviewService: SubmitCourseReviewService,
    ) {}

    /**
     * Writes a review on the requested course.
     *
     * @param user - Authenticated user from Keycloak.
     * @param request - Course id, star score and optional written review.
     * @returns The review row that was created.
     */
    @UseThrottler(ThrottlerConfig.Strict)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Review submitted successfully",
        [Locale.Vi]: "Gửi đánh giá thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SubmitCourseReviewResponse,
        {
            name: "submitCourseReview",
            description: "Write a review on a course the caller holds a paid enrollment on.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course id, star score and optional written review.",
            },
        )
            request: SubmitCourseReviewRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CourseReviewEntity> {
        return this.submitCourseReviewService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
