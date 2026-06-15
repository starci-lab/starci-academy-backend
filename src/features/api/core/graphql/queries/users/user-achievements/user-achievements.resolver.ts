import {
    Args,
    Context,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
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
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    AchievementsService,
} from "@modules/bussiness"
import {
    MyAchievementItemData,
} from "../../achievements/my-achievements/graphql-types"
import {
    isProfileHiddenFromViewer,
} from "../utils"
import {
    UserAchievementsResponse,
} from "./graphql-types"

/**
 * Public profile query: every achievement with a given user's earned status +
 * live progress. Mirrors `myAchievements` but reads for the user named in the
 * route (id from args) rather than the authenticated viewer, so a profile page
 * can render anyone's badge wall. Optional auth — anonymous viewers may call it.
 */
@Resolver()
export class UserAchievementsResolver {
    constructor(
        private readonly achievementsService: AchievementsService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Achievements fetched successfully",
        [Locale.Vi]: "Lấy thành tích thành công",
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
        @Context()
            context: { req?: { user?: { id?: string } } },
    ): Promise<Array<MyAchievementItemData>> {
        // locked profile → withhold the badge wall from everyone but the owner
        if (await isProfileHiddenFromViewer({
            entityManager: this.entityManager,
            userId,
            viewerId: context.req?.user?.id,
        })) {
            return []
        }
        // service computes the badge wall for the named user — same code path as
        // the viewer's own achievements; a public profile only needs the list
        // (the newly-earned subset / congrats modal is for the owner's own view)
        const result = await this.achievementsService.getMyAchievements(userId)
        // resolve the inline bilingual text to the request locale
        const lang = locale === Locale.Vi ? "vi" : "en"
        // map each result row to the localized GraphQL item
        return result.achievements.map((achievement) => ({
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
        }))
    }
}
