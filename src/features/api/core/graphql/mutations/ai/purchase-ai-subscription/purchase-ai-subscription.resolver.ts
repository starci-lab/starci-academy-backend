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
    PurchaseAiSubscriptionRequest,
    PurchaseAiSubscriptionResponse,
} from "./graphql-types"
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
