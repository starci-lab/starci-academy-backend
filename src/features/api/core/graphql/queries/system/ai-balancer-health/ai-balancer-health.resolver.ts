import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
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
} from "@features/ai-balancer"
import {
    AiBalancerHealthResponse,
    AiBalancerHealthResponseData,
} from "./graphql-types"

/**
 * Read-only GraphQL surface for the AI Balancer health snapshot.
 *
 * Returns per-provider + per-key health derived from in-memory state
 * (no DB read). Safe to call freely; raw API key values never leave the
 * server — only the 4-char suffix is exposed.
 */
@Resolver()
export class AiBalancerHealthResolver {
    constructor(
        private readonly aiBalancerService: AiBalancerService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI balancer health fetched successfully",
        [Locale.Vi]: "Lấy trạng thái AI balancer thành công",
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
        } = this.aiBalancerService.healthSnapshot()
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
