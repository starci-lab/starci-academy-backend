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
    FulfillRedemptionRequest,
} from "./graphql-types/request"
import {
    FulfillRedemptionData,
    FulfillRedemptionResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Ops mutation: mark a `pending` physical reward redemption `fulfilled` once
 * it has shipped. Admin-only -- gated behind the `x-admin-api-key` header
 * (same {@link GraphQLAdminAccessGuard} as the other operator-only surfaces),
 * NOT the learner auth guard, since this mutates another user's redemption.
 * Delegates the status transition + guard to {@link RewardsService.fulfillRedemption}.
 */
export class FulfillRedemptionResolver {
    constructor(
        private readonly rewardsService: RewardsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(GraphQLAdminAccessGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Redemption fulfilled successfully",
        [Locale.Vi]: "Đã xác nhận giao quà", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => FulfillRedemptionResponse,
        {
            name: "fulfillRedemption",
            description: "Ops: mark a pending physical reward redemption as fulfilled (shipped).",
        },
    )
    async execute(
        @Args("request")
            request: FulfillRedemptionRequest,
    ): Promise<FulfillRedemptionData> {
        const redemption = await this.rewardsService.fulfillRedemption(request.redemptionId)
        return {
            redemptionId: redemption.id,
            status: redemption.status,
        }
    }
}
