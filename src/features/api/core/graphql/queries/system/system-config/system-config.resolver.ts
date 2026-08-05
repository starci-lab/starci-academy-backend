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
    SystemConfigResponse,
    SystemConfigData,
} from "./graphql-types/response"
import {
    SystemConfigService,
} from "./system-config.service"

@Resolver()
/**
 * Public GraphQL entry for `systemConfig` -- pass thresholds and Auto-lane caps
 * from the mounted app config.
 */
export class SystemConfigResolver {
    constructor(
        private readonly systemConfigService: SystemConfigService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "System config fetched successfully",
        [Locale.Vi]: "Lấy cấu hình hệ thống thành công", // vn-ok: vi-locale string emitted to clients
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
