import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    GraphQLAdminAccessGuard,
} from "@modules/bussiness/guards/graphql-admin-access.guard"
import {
    RewardsService,
} from "@modules/bussiness/rewards/rewards.service"
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
    CancelRedemptionRequest,
} from "./graphql-types/request"
import {
    CancelRedemptionData,
    CancelRedemptionResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Ops mutation: void a reward redemption -- sets it `cancelled`. The
 * spendable-balance derivation (`RewardsService.computeSpent`) EXCLUDES
 * `cancelled` rows from the spent sum, so this status flip alone IS the
 * refund; `user.coin_balance` is never touched (no separate credit is issued,
 * so there is no double-refund). Admin-only -- gated behind the
 * `x-admin-api-key` header (same {@link GraphQLAdminAccessGuard} as the other
 * operator-only surfaces), NOT the learner auth guard, since this mutates
 * another user's redemption.
 */
export class CancelRedemptionResolver {
    constructor(
        private readonly rewardsService: RewardsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(GraphQLAdminAccessGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Redemption cancelled successfully",
        [Locale.Vi]: "Đã huỷ đổi quà", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CancelRedemptionResponse,
        {
            name: "cancelRedemption",
            description: "Ops: cancel a reward redemption, refunding its cost to the user's spendable balance.",
        },
    )
    async execute(
        @Args("request")
            request: CancelRedemptionRequest,
    ): Promise<CancelRedemptionData> {
        const redemption = await this.rewardsService.cancelRedemption(request.redemptionId)
        return {
            redemptionId: redemption.id,
            status: redemption.status,
        }
    }
}
