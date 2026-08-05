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
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    SetAiCeilRequest,
    SetAiCeilResponse,
} from "./graphql-types"

@Resolver()
/**
 * Set the current user's AI model CEILING for one surface (or the global
 * default) -- the per-category cap the learner uses for cost control. Writes the
 * `ai_subscriptions.ceil_overrides` jsonb; clients refetch `myAiQuota` after.
 */
export class SetAiCeilResolver {
    constructor(
        private readonly aiEntitlementService: AiEntitlementService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI ceiling updated successfully",
        [Locale.Vi]: "Cập nhật trần AI thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SetAiCeilResponse,
        {
            name: "setAiCeil",
            description: "Set the user's AI model ceiling for a surface (or the global default).",
        },
    )
    async execute(
        @Args("request")
            request: SetAiCeilRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<Record<string, never>> {
        await this.aiEntitlementService.setCeil({
            userId: user.id,
            surface: request.surface ?? null,
            category: request.category ?? null,
        })
        // no data -- the client refetches myAiQuota for the refreshed state
        return {
        }
    }
}
