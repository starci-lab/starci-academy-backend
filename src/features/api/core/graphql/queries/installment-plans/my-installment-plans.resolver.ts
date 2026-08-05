import {
    Query,
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
    MyInstallmentPlansService,
} from "./my-installment-plans.service"
import {
    MyInstallmentPlansData,
    MyInstallmentPlansResponse,
} from "./graphql-types"

@Resolver()
/**
 * Lists the authenticated viewer's installment ("trả góp") plans for the "Kế
 * hoạch trả góp của tôi" surface. Auth-only (NOT enrollment-scoped — a plan
 * spans whichever courses it gates), a per-viewer single-list read.
 */
export class MyInstallmentPlansResolver {
    constructor(
        private readonly myInstallmentPlansService: MyInstallmentPlansService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Installment plans fetched successfully",
        [Locale.Vi]: "Lấy kế hoạch trả góp thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyInstallmentPlansResponse,
        {
            name: "myInstallmentPlans",
            description: "The viewer's active/overdue/defaulted installment (trả góp) plans.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyInstallmentPlansData> {
        const plans = await this.myInstallmentPlansService.list(user.id)
        return {
            plans,
        }
    }
}
