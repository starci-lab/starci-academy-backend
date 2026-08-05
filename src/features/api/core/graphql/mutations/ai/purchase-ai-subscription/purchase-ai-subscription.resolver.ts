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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    PurchaseAiSubscriptionRequest,
} from "./graphql-types/request"
import {
    PurchaseAiSubscriptionResponse,
} from "./graphql-types/response"
import {
    PurchaseAiSubscriptionService,
} from "./purchase-ai-subscription.service"

@Resolver()
/**
 * GraphQL leaf for AI-tier checkout. Auth + throttle live here; provider
 * selection stays in the handler so the schema does not leak PayOS vs SePay.
 */
export class PurchaseAiSubscriptionResolver {
    constructor(
        private readonly purchaseAiSubscriptionService: PurchaseAiSubscriptionService,
    ) { }

    /**
     * Starts AI subscription checkout (PayOS / Sepay) and returns the checkout URL.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI subscription checkout created successfully",
        [Locale.Vi]: "Tạo thanh toán gói AI thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => PurchaseAiSubscriptionResponse,
        {
            name: "purchaseAiSubscription",
            description: "Creates a checkout (PayOS / Sepay) for an AI subscription tier.",
        },
    )
    async execute(
        @Args("request")
            request: PurchaseAiSubscriptionRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.purchaseAiSubscriptionService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
