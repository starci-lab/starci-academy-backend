import {
    Args,
    ID,
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
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    AchievementsService,
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness"
import {
    MyAchievementItemData,
} from "../../achievements/my-achievements/graphql-types"
import {
    UserAchievementsResponse,
} from "./graphql-types"

@Resolver()
/**
 * Public profile query: every achievement with a given user's earned status +
 * live progress. Mirrors `myAchievements` but reads for the user named in the
 * route (id from args) rather than the authenticated viewer, so a profile page
 * can render anyone's badge wall. Optional auth — anonymous viewers may call it;
 * a locked profile is withheld from non-owners by {@link GraphQLProfileVisibilityGuard}.
 */
export class UserAchievementsResolver {
    constructor(
        private readonly achievementsService: AchievementsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Achievements fetched successfully",
        [Locale.Vi]: "Lấy thành tích thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserAchievementsResponse,
        {
            name: "userAchievements",
            description: "Every achievement with a user's earned status + progress, by user id.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose achievements to fetch.",
            },
        )
            userId: string,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<Array<MyAchievementItemData>> {
        // service computes the badge wall for the named user — same code path as
        // the viewer's own achievements; a public profile only needs the list
        // (the newly-earned subset / congrats modal is for the owner's own view)
        const result = await this.achievementsService.getMyAchievements(userId)
        // resolve the inline bilingual text to the request locale
        const lang = locale === Locale.Vi ? "vi" : "en"
        // map each result row to the localized GraphQL item
        return result.data.map((achievement) => ({
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
        }))
    }
}
