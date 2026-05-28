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
    MountFilesystemService,
} from "@modules/filesystem"
import {
    AiSubscriptionTiersResponse,
    AiSubscriptionTiersResponseData,
} from "./graphql-types"

/**
 * Public catalog of purchasable AI subscription tiers, read from the mounted
 * `app.yaml` (`subscriptions.tiers`). Drives the pricing page. Only enabled
 * tiers are returned.
 */
@Resolver()
export class AiSubscriptionTiersResolver {
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI subscription tiers fetched successfully",
        [Locale.Vi]: "Lấy danh sách gói AI thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => AiSubscriptionTiersResponse,
        {
            name: "aiSubscriptionTiers",
            description: "Returns the enabled, purchasable AI subscription tiers.",
        },
    )
    async execute(): Promise<AiSubscriptionTiersResponseData> {
        // map the enabled catalog entries to the GraphQL shape
        const tiers = this.mountFilesystemService
            .appConfig()
            .subscriptions
            .tiers
            .filter((tier) => tier.enabled)
            .map((tier) => ({
                tier: tier.tier,
                displayName: tier.displayName ?? tier.tier,
                priceVnd: tier.priceVnd,
                creditsPer5h: tier.creditsPer5h,
                creditsPerWeek: tier.creditsPerWeek,
                popular: Boolean(tier.popular),
            }))
        return {
            tiers,
        }
    }
}
