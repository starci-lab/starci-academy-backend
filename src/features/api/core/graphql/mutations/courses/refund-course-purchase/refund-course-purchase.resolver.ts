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
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLAdminAccessGuard,
} from "@modules/bussiness/guards/graphql-admin-access.guard"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    RefundCoursePurchaseRequest,
} from "./graphql-types/request"
import {
    RefundCoursePurchaseData,
    RefundCoursePurchaseResponse,
} from "./graphql-types/response"
import {
    RefundCoursePurchaseService,
} from "./refund-course-purchase.service"

@Resolver()
/**
 * Ops boundary for the local half of a confirmed refund. Learners cannot call
 * it: accepting a transaction id from learner auth would let a buyer revoke
 * access without proving that a provider actually returned the money.
 */
export class RefundCoursePurchaseResolver {
    constructor(
        private readonly refundCoursePurchaseService: RefundCoursePurchaseService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(GraphQLAdminAccessGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course purchase refunded successfully",
        [Locale.Vi]: "Hoàn tiền khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RefundCoursePurchaseResponse,
        {
            name: "refundCoursePurchase",
            description: "Ops: record a confirmed provider refund and atomically revoke its course access.",
        },
    )
    async execute(
        @Args("request")
            request: RefundCoursePurchaseRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<RefundCoursePurchaseData> {
        return this.refundCoursePurchaseService.execute({
            request,
            locale,
        })
    }
}
