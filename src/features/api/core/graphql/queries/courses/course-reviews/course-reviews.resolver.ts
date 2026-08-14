import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
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
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CourseReviewsRequest,
} from "./graphql-types/request"
import {
    CourseReviewsResponse,
} from "./graphql-types/response"
import type {
    CourseReviewsPageObject,
} from "./graphql-types/course-reviews-page.object"
import {
    CourseReviewsService,
} from "./course-reviews.service"

@Resolver()
/**
 * GraphQL entry for reading a course's reviews.
 *
 * Deliberately unguarded, and it reads no identity: reviews are what somebody consults BEFORE
 * buying, so a session requirement would hide them from the reader they exist for. AUTHZ-2 binds
 * a door that READS an identity, and this one does not.
 */
export class CourseReviewsResolver {
    constructor(
        private readonly courseReviewsService: CourseReviewsService,
    ) {}

    /**
     * Lists a page of the requested course's reviews.
     *
     * @param request - Course id, and the window of reviews to return.
     * @returns The page of reviews and the course's mean score.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course reviews fetched successfully",
        [Locale.Vi]: "Lấy đánh giá khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CourseReviewsResponse,
        {
            name: "courseReviews",
            description: "One page of a course's reviews, with the course's mean score.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Course id and the window of reviews to return.",
            },
        )
            request: CourseReviewsRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CourseReviewsPageObject> {
        return this.courseReviewsService.execute(
            {
                request,
                locale,
            },
        )
    }
}
