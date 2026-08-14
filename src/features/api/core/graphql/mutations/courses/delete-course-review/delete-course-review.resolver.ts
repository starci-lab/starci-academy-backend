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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    DeleteCourseReviewRequest,
} from "./graphql-types/request"
import {
    DeleteCourseReviewResponse,
    DeleteCourseReviewResponseData,
} from "./graphql-types/response"
import {
    DeleteCourseReviewService,
} from "./delete-course-review.service"

@Resolver()
/**
 * GraphQL entry for deleting a review the caller wrote.
 */
export class DeleteCourseReviewResolver {
    constructor(
        private readonly deleteCourseReviewService: DeleteCourseReviewService,
    ) {}

    /**
     * Deletes the requested review.
     *
     * @param user - Authenticated user from Keycloak.
     * @param request - Review id to delete.
     * @returns The removed review id and its course.
     */
    @UseThrottler(ThrottlerConfig.Strict)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Review deleted successfully",
        [Locale.Vi]: "Xóa đánh giá thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => DeleteCourseReviewResponse,
        {
            name: "deleteCourseReview",
            description: "Delete a review the caller wrote.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Review id to delete.",
            },
        )
            request: DeleteCourseReviewRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<DeleteCourseReviewResponseData> {
        return this.deleteCourseReviewService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
