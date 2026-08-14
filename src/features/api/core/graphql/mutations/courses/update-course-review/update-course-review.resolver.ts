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
    UpdateCourseReviewRequest,
} from "./graphql-types/request"
import {
    UpdateCourseReviewResponse,
} from "./graphql-types/response"
import {
    UpdateCourseReviewService,
} from "./update-course-review.service"

@Resolver()
/**
 * GraphQL entry for editing a review the caller wrote.
 */
export class UpdateCourseReviewResolver {
    constructor(
        private readonly updateCourseReviewService: UpdateCourseReviewService,
    ) {}

    /**
     * Edits the requested review.
     *
     * @param user - Authenticated user from Keycloak.
     * @param request - Review id, and the score or body being changed.
     * @returns The review row as it now stands.
     */
    @UseThrottler(ThrottlerConfig.Strict)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Review updated successfully",
        [Locale.Vi]: "Cập nhật đánh giá thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => UpdateCourseReviewResponse,
        {
            name: "updateCourseReview",
            description: "Edit a review the caller wrote.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Review id, and the score or body being changed.",
            },
        )
            request: UpdateCourseReviewRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CourseReviewEntity> {
        return this.updateCourseReviewService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
