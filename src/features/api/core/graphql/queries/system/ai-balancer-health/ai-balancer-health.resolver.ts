import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLAdminAccessGuard,
} from "@modules/bussiness"
import {
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
    AiBalancerService,
} from "@modules/ai/balancer/ai-balancer.service"
import {
    AiBalancerHealthResponse,
    AiBalancerHealthResponseData,
} from "./graphql-types"

@Resolver()
/**
 * Read-only GraphQL surface for the AI Balancer health snapshot.
 *
 * Returns per-provider + per-key health derived from in-memory state
 * (no DB read). ADMIN-ONLY: live key status is an attacker signal (which
 * provider is degraded / out of keys), so it is gated behind the
 * `x-admin-api-key` header. Raw API key values never leave the server -- only
 * the 4-char suffix is exposed.
 */
export class AiBalancerHealthResolver {
    constructor(
        private readonly aiBalancerService: AiBalancerService,
    ) {}

    @UseGuards(GraphQLAdminAccessGuard)
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI balancer health fetched successfully",
        [Locale.Vi]: "Lấy trạng thái AI balancer thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => AiBalancerHealthResponse,
        {
            name: "aiBalancerHealth",
            description:
                "Returns the live AI Balancer health snapshot — per-provider key pool status, "
                + "active/disabled counts, and per-key fail counters.",
        },
    )
    async execute(): Promise<AiBalancerHealthResponseData> {
        const {
            providers,
        } = await this.aiBalancerService.healthSnapshot()
        return {
            providers: providers.map((provider) => ({
                provider: provider.provider,
                keysFilePath: provider.keysFilePath,
                totalKeys: provider.totalKeys,
                activeKeys: provider.activeKeys,
                disabledKeys: provider.disabledKeys,
                keys: provider.keys.map((key) => ({
                    provider: key.provider,
                    keySuffix: key.keySuffix,
                    status: key.status,
                    failCount: key.failCount,
                    lastUsedAt: key.lastUsedAt,
                    lastHealthCheckAt: key.lastHealthCheckAt,
                    disabledAt: key.disabledAt,
                })),
            })),
        }
    }
}
