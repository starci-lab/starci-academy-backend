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
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KpiRewardService,
} from "@modules/bussiness"
import {
    ClaimKpiRewardData,
    ClaimKpiRewardRequest,
    ClaimKpiRewardResponse,
} from "./graphql-types"

/**
 * Claim the authenticated user's coin reward for one weekly KPI whose floor
 * target has been met. Delegates the eligibility + already-claimed checks,
 * the reward grant, and the floor-row update to {@link KpiRewardService} (one
 * atomic transaction). A typed exception surfaces when the KPI isn't eligible
 * yet or was already claimed this week.
 */
@Resolver()
export class ClaimKpiRewardResolver {
    constructor(
        private readonly kpiRewardService: KpiRewardService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "KPI reward claimed successfully",
        [Locale.Vi]: "Nhận thưởng KPI thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ClaimKpiRewardResponse,
        {
            name: "claimKpiReward",
            description: "Claim the current user's coin reward for one met weekly KPI.",
        },
    )
    async execute(
        @Args("request")
            request: ClaimKpiRewardRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ClaimKpiRewardData> {
        return this.kpiRewardService.claimReward({
            userId: user.id,
            key: request.key,
        })
    }
}
