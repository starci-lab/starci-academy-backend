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
    SystemConfigResponse,
    SystemConfigData,
} from "./graphql-types"
import {
    SystemConfigService,
} from "./system-config.service"

@Resolver()
/**
 * Public GraphQL entry for `systemConfig` — pass thresholds and Auto-lane caps
 * from the mounted app config.
 */
export class SystemConfigResolver {
    constructor(
        private readonly systemConfigService: SystemConfigService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "System config fetched successfully",
        [Locale.Vi]: "Lấy cấu hình hệ thống thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => SystemConfigResponse,
        {
            name: "systemConfig",
            description:
                "Returns `systemConfig.challenge` from mounted `.mount/config/app.json` (e.g. pass threshold).",
        },
    )
    async execute(
        @GraphQLLocale()
            locale: Locale,
    ): Promise<SystemConfigData> {
        return this.systemConfigService.execute(
            {
                request: undefined,
                locale,
                user: undefined,
            },
        )
    }
}
