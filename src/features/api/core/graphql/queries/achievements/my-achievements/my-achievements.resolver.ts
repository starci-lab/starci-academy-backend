import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
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
    AchievementsService,
} from "@modules/bussiness"
import type {
    MyAchievementResult,
} from "@modules/bussiness"
import {
    MyAchievementItemData,
    MyAchievementsData,
    MyAchievementsResponse,
} from "./graphql-types"

@Resolver()
/**
 * Profile query: every achievement with the viewer's earned status + live
 * progress, PLUS the subset newly earned on this read (award-on-read) so the
 * client can pop a congratulations modal. The service does the heavy lifting
 * (composite metric query + award); the resolver only resolves the bilingual
 * name/description to the request locale. Badge art is fetched from MinIO via
 * `iconKey`.
 */
export class MyAchievementsResolver {
    constructor(
        private readonly achievementsService: AchievementsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Achievements fetched successfully",
        [Locale.Vi]: "Lấy thành tích thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyAchievementsResponse,
        {
            name: "myAchievements",
            description: "Every achievement with the viewer's earned status + progress.",
        },
    )
    async execute(
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyAchievementsData> {
        // service does the heavy lifting (definitions + ledger + composite metric query)
        const result = await this.achievementsService.getMyAchievements(user.id)
        // resolve the inline bilingual text to the request locale
        const lang = locale === Locale.Vi ? "vi" : "en"
        // localize both lists with the same mapper
        const localize = (achievement: MyAchievementResult): MyAchievementItemData => ({
            slug: achievement.slug,
            name: achievement.name[lang],
            description: achievement.description[lang],
            iconKey: achievement.iconKey,
            criteriaType: achievement.criteriaType,
            threshold: achievement.threshold,
            earned: achievement.earned,
            earnedAt: achievement.earnedAt,
            currentValue: achievement.currentValue,
            tierReached: achievement.tierReached,
            rarityPercent: achievement.rarityPercent,
        })
        return {
            data: result.data.map(localize),
            count: result.count,
            newAchievements: result.newAchievements.map(localize),
        }
    }
}
