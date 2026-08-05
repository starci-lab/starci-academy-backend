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
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    KpiRewardService,
} from "@modules/bussiness"
import {
    SetKpiTargetRequest,
    SetKpiTargetResponse,
} from "./graphql-types"

@Resolver()
/**
 * Set one of the authenticated user's weekly KPI targets.
 *
 * Delegates the clamp + the atomic `jsonb_set` write (and the matching
 * anti-gaming floor update) to {@link KpiRewardService.setTarget}.
 */
export class SetKpiTargetResolver {
    constructor(
        private readonly kpiRewardService: KpiRewardService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "KPI target updated successfully",
        [Locale.Vi]: "Cập nhật mục tiêu KPI thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SetKpiTargetResponse,
        {
            name: "setKpiTarget",
            description: "Set one of the current user's weekly KPI targets.",
        },
    )
    async execute(
        @Args("request")
            request: SetKpiTargetRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<SetKpiTargetResponse> {
        await this.kpiRewardService.setTarget({
            userId: user.id,
            key: request.key,
            target: request.target,
        })
        // no payload -- the client already knows the value it sent (post-clamp it can
        // re-fetch via myKpis if it needs the canonical number)
        return {
        } as SetKpiTargetResponse
    }
}
