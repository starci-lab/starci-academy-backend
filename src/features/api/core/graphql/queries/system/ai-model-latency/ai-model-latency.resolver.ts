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
    AiModelCategory,
    Locale,
} from "@modules/databases"
import {
    AiModelLatencyCacheService,
} from "@modules/cache"
import {
    AiModelCatalogService,
} from "@modules/ai"
import {
    AiModelLatencyResponse,
    AiModelLatencyResponseData,
} from "./graphql-types"

@Resolver()
/**
 * PUBLIC "build in public" AI model latency — the latest per-model probe
 * snapshot (up/down + latency + freshness) read from the latency cache. The
 * category is joined from the enabled catalog. No guard, no raw keys: safe to
 * render on a public status page. The realtime counterpart is the
 * `system_health` Socket.IO namespace.
 */
export class AiModelLatencyResolver {
    constructor(
        private readonly aiModelLatencyCacheService: AiModelLatencyCacheService,
        private readonly aiModelCatalogService: AiModelCatalogService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI model latency fetched successfully",
        [Locale.Vi]: "Lấy độ trễ mô hình AI thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => AiModelLatencyResponse,
        {
            name: "aiModelLatency",
            description:
                "Public, masked AI model latency — per-model up/down + latency + freshness. "
                + "No guard; no raw keys or operational counters.",
        },
    )
    async execute(): Promise<AiModelLatencyResponseData> {
        // read the latest per-model probe snapshots written by the scheduler
        const latencyMap = await this.aiModelLatencyCacheService.getAll()
        // category lives in the catalog, not the latency cache — index enabled
        // models by name so we can attach it to each snapshot
        const enabled = await this.aiModelCatalogService.enabledModels()
        const categoryByName = new Map<string, AiModelCategory>(
            enabled.map((model) => [
                model.name,
                model.category,
            ]),
        )
        // shape the public-safe payload, keeping only models still in the catalog
        // (a disabled/removed model lingering in the cache is dropped)
        return {
            models: Object.entries(latencyMap)
                .filter(([
                    name,
                ]) => categoryByName.has(name))
                .map(([
                    name,
                    entry,
                ]) => ({
                    name,
                    provider: entry.provider,
                    // safe: filtered above to names present in the category map
                    category: categoryByName.get(name) as AiModelCategory,
                    ok: entry.ok,
                    latencyMs: entry.latencyMs,
                    // cache stores ISO-8601; the GraphQL Date scalar wants a Date
                    checkedAt: new Date(entry.checkedAt),
                    errorMessage: entry.errorMessage,
                })),
        }
    }
}
