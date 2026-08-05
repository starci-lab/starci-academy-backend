import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PlatformStatsResponse,
    PlatformStatsData,
} from "./graphql-types/response"
import {
    PlatformStatsService,
} from "./platform-stats.service"

@Resolver()
/**
 * Public GraphQL entry for `platformStats` -- no auth; feeds the landing-page
 * social-proof counters.
 */
export class PlatformStatsResolver {
    constructor(
        private readonly platformStatsService: PlatformStatsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Platform stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê nền tảng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => PlatformStatsResponse,
        {
            name: "platformStats",
            description:
                "Public platform-wide counters (learners, lessons, courses, badges) for the landing page.",
        },
    )
    async execute(
        @GraphQLLocale()
            locale: Locale,
    ): Promise<PlatformStatsData> {
        return this.platformStatsService.execute(
            {
                request: undefined,
                locale,
                user: undefined,
            },
        )
    }
}
