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
    KeyStatus,
} from "@modules/ai"
import {
    AiKeyHealthResponse,
    AiKeyHealthResponseData,
} from "./graphql-types"

@Resolver()
/**
 * PUBLIC "build in public" AI key health — masked keys (`abc...def`) grouped per
 * model, with a healthy flag each. No raw values, no fail counts / cooldown /
 * disabled timestamps (those stay behind the admin `aiBalancerHealth` query).
 * Safe to show on a public status page.
 */
export class AiKeyHealthResolver {
    constructor(
        private readonly aiBalancerService: AiBalancerService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI key health fetched successfully",
        [Locale.Vi]: "Lấy trạng thái khoá AI thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => AiKeyHealthResponse,
        {
            name: "aiKeyHealth",
            description:
                "Public, masked AI key health grouped per model — `abc...def` labels + "
                + "healthy flags. No raw values or operational counters.",
        },
    )
    async execute(): Promise<AiKeyHealthResponseData> {
        const {
            groups,
        } = await this.aiBalancerService.modelKeyHealth()
        return {
            groups: groups.map((group) => ({
                provider: group.provider,
                models: [
                    ...group.models,
                ],
                totalKeys: group.totalKeys,
                healthyKeys: group.activeKeys,
                keys: group.keys.map((key) => ({
                    keyMask: key.keyMask,
                    healthy: key.status === KeyStatus.Active,
                })),
            })),
        }
    }
}
