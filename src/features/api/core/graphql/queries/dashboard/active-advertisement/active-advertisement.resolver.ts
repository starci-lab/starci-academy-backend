import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    AdvertisementEntity,
    AdvertisementPlacement,
    GraphQLTypeAdvertisementPlacement,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    ActiveAdvertisementResponse,
    ActiveAdvertisementResponseData,
} from "./graphql-types"

/**
 * Public query returning the single banner to show in a placement right now.
 *
 * Picks an active ad inside its display window, preferring paid slots over the
 * internal "advertise here" house ad (order: paid-first, then priority, then
 * newest). Returns null when nothing is active. `title`/`ctaText` are resolved
 * to the request locale; `media` is handed back as the raw discriminated jsonb.
 */
@Resolver()
export class ActiveAdvertisementResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Active advertisement fetched successfully",
        [Locale.Vi]: "Lấy quảng cáo thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ActiveAdvertisementResponse,
        {
            name: "activeAdvertisement",
            description: "Returns the banner to show in a placement (paid first, else house ad), or null.",
        },
    )
    async execute(
        @GraphQLLocale()
            locale: Locale,
        @Args("placement",
            {
                type: () => GraphQLTypeAdvertisementPlacement,
                nullable: true,
                defaultValue: AdvertisementPlacement.DashboardRight,
                description: "UI slot to fetch the banner for.",
            })
            placement: AdvertisementPlacement,
    ): Promise<ActiveAdvertisementResponseData | null> {
        // active ad inside its display window; paid (is_house_ad=false) ranks
        // before the house ad, then higher priority, then newest
        const ad = await this.entityManager
            .createQueryBuilder(AdvertisementEntity,
                "a")
            .where("a.placement = :placement",
                {
                    placement,
                })
            .andWhere("a.isActive = true")
            .andWhere("(a.startsAt IS NULL OR a.startsAt <= now())")
            .andWhere("(a.endsAt IS NULL OR a.endsAt >= now())")
            .orderBy("a.isHouseAd",
                "ASC")
            .addOrderBy("a.priority",
                "DESC")
            .addOrderBy("a.createdAt",
                "DESC")
            .getOne()
        // nothing active in this slot → let the client hide the rail block
        if (!ad) {
            return null
        }
        // resolve the inline bilingual text to the request locale
        const lang = locale === Locale.Vi ? "vi" : "en"
        return {
            id: ad.id,
            mediaType: ad.mediaType,
            media: ad.media,
            title: ad.title[lang],
            ctaText: ad.ctaText ? ad.ctaText[lang] : null,
            linkUrl: ad.linkUrl,
            sponsorName: ad.sponsorName,
        }
    }
}
