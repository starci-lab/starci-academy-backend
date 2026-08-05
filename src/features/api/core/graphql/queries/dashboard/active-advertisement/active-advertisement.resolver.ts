import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
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
    KeycloakGraphQLUser,
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UserService,
} from "@modules/bussiness"
import {
    MembershipService,
} from "@modules/membership"
import {
    AdvertisementEntity,
    AdvertisementPlacement,
    GraphQLTypeAdvertisementPlacement,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    ActiveAdvertisementResponse,
    ActiveAdvertisementResponseData,
} from "./graphql-types"

@Resolver()
/**
 * Public query returning the single banner to show in a placement right now.
 *
 * Picks an active ad inside its display window, preferring paid slots over the
 * internal "advertise here" house ad (order: paid-first, then priority, then
 * newest). Returns null when nothing is active. `title`/`ctaText` are resolved
 * to the request locale; `media` is handed back as the raw discriminated jsonb.
 *
 * Ad-free exemptions are enforced here (single policy gate) so the client only
 * needs `ad != null ? render : hide`: active community members see no ads at
 * all, and a viewer already enrolled in the supplied `courseId` is not shown a
 * lesson ad. Auth is optional — anonymous viewers always see ads.
 */
export class ActiveAdvertisementResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly membershipService: MembershipService,
        private readonly userService: UserService,
        private readonly winstonService: WinstonService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
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
        @KeycloakGraphQLUser()
            user: UserEntity | undefined,
        @Args("placement",
            {
                type: () => GraphQLTypeAdvertisementPlacement,
                nullable: true,
                defaultValue: AdvertisementPlacement.DashboardRight,
                description: "UI slot to fetch the banner for.",
            })
            placement: AdvertisementPlacement,
        @Args("courseId",
            {
                type: () => String,
                nullable: true,
                description: "Course context for lesson placements (enrolled viewers are exempt).",
            })
            courseId?: string,
    ): Promise<ActiveAdvertisementResponseData | null> {
        // ad-free exemptions (single policy gate). active members never see ads;
        // a viewer already enrolled in this course is not shown a lesson ad.
        // this is a SOFT filter: if the lookup fails (e.g. the membership tables
        // are not yet deployed) we must not break ad serving, so fail open and
        // still return the banner
        if (user) {
            try {
                if (await this.membershipService.isActive(user.id)) {
                    return null
                }
                if (courseId && await this.userService.checkEnrollment(user.id,
                    courseId)) {
                    return null
                }
            } catch (error) {
                this.winstonService.log(
                    WinstonLog.BestEffortOperationFailed,
                    {
                        op: "active-advertisement.exemption-check",
                        userId: user.id,
                        error: error instanceof Error ? error.message : String(error),
                        meta: {
                            courseId,
                        },
                    },
                )
            }
        }
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
