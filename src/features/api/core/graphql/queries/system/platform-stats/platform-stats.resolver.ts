import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
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
    Locale,
} from "@modules/databases"
import {
    PlatformStatsResponse,
    PlatformStatsData,
} from "./graphql-types"
import {
    PlatformStatsService,
} from "./platform-stats.service"

@Resolver()
export class PlatformStatsResolver {
    constructor(
        private readonly platformStatsService: PlatformStatsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Platform stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê nền tảng thành công",
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
