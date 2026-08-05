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
    RecommendedCoursesData,
    RecommendedCoursesResponse,
} from "./graphql-types/response"
import {
    RecommendedCoursesService,
} from "./recommended-courses.service"

@Resolver()
/**
 * Recommended-courses query: the most popular courses the viewer does not
 * already own, each priced with the SAME engagement loyalty discount applied at
 * checkout (so the shown price equals the eventual charge).
 */
export class RecommendedCoursesResolver {
    constructor(
        private readonly recommendedCoursesService: RecommendedCoursesService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Recommended courses fetched successfully",
        [Locale.Vi]: "Lấy khóa học gợi ý thành công", // vn-ok: vi-locale string emitted to clients
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
