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
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    EntityManager,
} from "typeorm"
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
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    AdvertisementEntity,
} from "@modules/databases/postgresql/primary/entities/advertisement.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    AdvertisementPlacement,
    GraphQLTypeAdvertisementPlacement,
} from "@modules/databases/postgresql/primary/enums/advertisement-placement"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ActiveAdvertisementResponse,
    ActiveAdvertisementResponseData,
} from "./graphql-types/response"

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
 * lesson ad. Auth is optional -- anonymous viewers always see ads.
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
        [Locale.Vi]: "Lấy quảng cáo thành công", // vn-ok: vi-locale string emitted to clients
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
        // nothing active in this slot -> let the client hide the rail block
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
