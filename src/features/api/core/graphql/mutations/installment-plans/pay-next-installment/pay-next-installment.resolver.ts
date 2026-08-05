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
    PayNextInstallmentRequest,
    PayNextInstallmentResponse,
    PayNextInstallmentResponseData,
} from "./graphql-types"
import {
    PayNextInstallmentService,
} from "./pay-next-installment.service"

@Resolver()
/**
 * GraphQL entry for paying the current cycle of an installment (trả góp) plan.
 */
export class PayNextInstallmentResolver {
    constructor(
        private readonly payNextInstallmentService: PayNextInstallmentService,
    ) { }

    /**
     * Creates a PayOS/Sepay checkout for the plan's current minimum payment.
     * The learner reaches this from the reminder email or the "Kế hoạch trả
     * góp" surface, which opens the existing PaymentModal in installment mode.
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
        [Locale.Vi]: "Tạo thanh toán trả góp thành công",
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
