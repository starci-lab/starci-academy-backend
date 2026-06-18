import {
    Args,
    Int,
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
    RecommendedCoursesData,
    RecommendedCoursesResponse,
} from "./graphql-types"
import {
    RecommendedCoursesService,
} from "./recommended-courses.service"

/**
 * Recommended-courses query: the most popular courses the viewer does not
 * already own, each priced with the SAME engagement loyalty discount applied at
 * checkout (so the shown price equals the eventual charge).
 */
@Resolver()
export class RecommendedCoursesResolver {
    constructor(
        private readonly recommendedCoursesService: RecommendedCoursesService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Recommended courses fetched successfully",
        [Locale.Vi]: "Lấy khóa học gợi ý thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => RecommendedCoursesResponse,
        {
            name: "recommendedCourses",
            description: "Courses the viewer does not own yet, priced with the loyalty discount.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 3,
                description: "Maximum number of recommended courses to return.",
            },
        )
            limit: number,
    ): Promise<RecommendedCoursesData> {
        const items = await this.recommendedCoursesService.list({
            userId: user.id,
            limit,
        })
        return {
            items,
        }
    }
}
