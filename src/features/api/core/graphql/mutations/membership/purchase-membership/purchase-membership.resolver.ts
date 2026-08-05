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
    PurchaseMembershipRequest,
} from "./graphql-types/request"
import {
    PurchaseMembershipResponse,
} from "./graphql-types/response"
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
