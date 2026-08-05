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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KpiRewardService,
} from "@modules/bussiness/kpi-reward/kpi-reward.service"
import {
    ClaimKpiRewardRequest,
} from "./graphql-types/request"
import {
    ClaimKpiRewardData,
    ClaimKpiRewardResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Claim the authenticated user's coin reward for one weekly KPI whose floor
 * target has been met. Delegates the eligibility + already-claimed checks,
 * the reward grant, and the floor-row update to {@link KpiRewardService} (one
 * atomic transaction). A typed exception surfaces when the KPI isn't eligible
 * yet or was already claimed this week.
 */
export class ClaimKpiRewardResolver {
    constructor(
        private readonly kpiRewardService: KpiRewardService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "KPI reward claimed successfully",
        [Locale.Vi]: "Nhận thưởng KPI thành công", // vn-ok: vi-locale string emitted to clients
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
