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
    RewardsService,
} from "@modules/bussiness"
import {
    RewardObject,
    RewardsResponse,
} from "./graphql-types"

/**
 * The redeemable reward catalog ("điểm quà" gifts store), localized to the
 * request locale. Public (no auth) — the catalog is the same for everyone; the
 * viewer's balance lives in the separate `myRewardWallet` query.
 */
@Resolver()
export class RewardsResolver {
    constructor(
        private readonly rewardsService: RewardsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Rewards fetched successfully",
        [Locale.Vi]: "Lấy danh sách quà thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => RewardsResponse,
        {
            name: "rewards",
            description: "The redeemable reward catalog (gifts store).",
        },
    )
    async execute(
        @GraphQLLocale()
            locale: Locale,
    ): Promise<Array<RewardObject>> {
        return this.rewardsService.getCatalog(locale)
    }
}
