import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MyPickableCvAchievementsResponse,
    MyPickableCvAchievementsViewData,
} from "./graphql-types/response"
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
 * Resolver for the authenticated user's pickable StarCi achievements -- the CV
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
