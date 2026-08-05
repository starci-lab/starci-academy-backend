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
    PayNextInstallmentRequest,
} from "./graphql-types/request"
import {
    PayNextInstallmentResponse,
    PayNextInstallmentResponseData,
} from "./graphql-types/response"
import {
    PayNextInstallmentService,
} from "./pay-next-installment.service"

@Resolver()
/**
 * GraphQL entry for paying the current cycle of an installment plan.
 */
export class PayNextInstallmentResolver {
    constructor(
        private readonly payNextInstallmentService: PayNextInstallmentService,
    ) { }

    /**
     * Creates a PayOS/Sepay checkout for the plan's current minimum payment.
     * The learner reaches this from the reminder email or the installment-plans
     * surface, which opens the existing PaymentModal in installment mode.
     *
     * @param user - Authenticated user from Keycloak (must own the plan).
     * @param request - Plan id, payment type, and redirect URLs.
     * @param locale - Active locale for the success message.
     * @returns Checkout payload for the client to redirect / POST.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Installment payment checkout created successfully",
        [Locale.Vi]: "Tạo thanh toán trả góp thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => PayNextInstallmentResponse,
        {
            name: "payNextInstallment",
            description: "Creates a checkout for the current cycle of an installment plan.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Plan id, payment type, and redirect URLs.",
            },
        )
            request: PayNextInstallmentRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<PayNextInstallmentResponseData> {
        return this.payNextInstallmentService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
