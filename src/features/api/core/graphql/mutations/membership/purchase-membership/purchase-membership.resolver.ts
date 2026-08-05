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
    PurchaseMembershipRequest,
    PurchaseMembershipResponse,
} from "./graphql-types"
import {
    PurchaseMembershipService,
} from "./purchase-membership.service"

@Resolver()
/**
 * GraphQL leaf for community-membership checkout. Auth + throttle live
 * here; provider selection stays in the handler.
 */
export class PurchaseMembershipResolver {
    constructor(
        private readonly purchaseMembershipService: PurchaseMembershipService,
    ) { }

    /**
     * Starts community-membership checkout (PayOS / Sepay / Stripe / PayPal /
     * Crypto) and returns the checkout URL.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Membership checkout created successfully",
        [Locale.Vi]: "Tạo thanh toán hội viên thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => PurchaseMembershipResponse,
        {
            name: "purchaseMembership",
            description: "Creates a checkout for a community membership.",
        },
    )
    async execute(
        @Args("request")
            request: PurchaseMembershipRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.purchaseMembershipService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
