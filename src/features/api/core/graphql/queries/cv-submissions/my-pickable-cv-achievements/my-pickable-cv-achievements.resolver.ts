import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    MyPickableCvAchievementsResponse,
    MyPickableCvAchievementsViewData,
} from "./graphql-types"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    MyPickableCvAchievementsService,
} from "./my-pickable-cv-achievements.service"

@Resolver()
/**
 * Resolver for the authenticated user's pickable StarCi achievements — the CV
 * block editor's "pick from StarCi" data source.
 */
export class MyPickableCvAchievementsResolver {
    constructor(
        private readonly myPickableCvAchievementsService: MyPickableCvAchievementsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Pickable achievements fetched successfully",
        [Locale.Vi]: "Lấy danh sách thành tích thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyPickableCvAchievementsResponse,
        {
            name: "myPickableCvAchievements",
            description: "Returns the current user's passed capstone tasks + graded challenge submissions, pickable into CV blocks.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<MyPickableCvAchievementsViewData> {
        return this.myPickableCvAchievementsService.execute(
            {
                request: {
                },
                locale,
                user,
            },
        )
    }
}
