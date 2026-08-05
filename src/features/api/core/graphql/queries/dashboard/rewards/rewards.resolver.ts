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
    RewardsService,
} from "@modules/bussiness/rewards/rewards.service"
import {
    RewardObject,
    RewardsResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The redeemable reward catalog (the Coin shop), localized to the
 * request locale. Public (no auth) -- the catalog is the same for everyone; the
 * viewer's balance lives in the separate `myRewardWallet` query.
 */
export class RewardsResolver {
    constructor(
        private readonly rewardsService: RewardsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Rewards fetched successfully",
        [Locale.Vi]: "Lấy danh sách quà thành công", // vn-ok: vi-locale string emitted to clients
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
