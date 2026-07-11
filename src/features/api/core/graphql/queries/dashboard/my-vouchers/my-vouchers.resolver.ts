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
    VoucherStatus,
} from "@modules/databases"
import {
    VoucherService,
} from "@modules/bussiness"
import {
    MyVoucherObject,
    MyVouchersResponse,
} from "./graphql-types"

/**
 * The authenticated viewer's Coin-shop vouchers, newest first — the "Ví của
 * tôi" list (code, discount, scope, status, expiry). A stale `unused` row past
 * its `expiresAt` is surfaced here as `expired` even though no cron has
 * flipped the stored column (see {@link VoucherService.isEffectivelyExpired}).
 */
@Resolver()
export class MyVouchersResolver {
    constructor(
        private readonly voucherService: VoucherService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Vouchers fetched successfully",
        [Locale.Vi]: "Lấy danh sách voucher thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyVouchersResponse,
        {
            name: "myVouchers",
            description: "The viewer's Coin-shop vouchers, newest first.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<Array<MyVoucherObject>> {
        const vouchers = await this.voucherService.listForUser(user.id)
        return vouchers.map((voucher) => ({
            id: voucher.id,
            code: voucher.code,
            discountType: voucher.discountType,
            value: voucher.value,
            courseId: voucher.courseId,
            courseTitle: voucher.course?.title ?? null,
            courseDisplayId: voucher.course?.displayId ?? null,
            status: this.voucherService.isEffectivelyExpired(voucher)
                ? VoucherStatus.Expired
                : voucher.status,
            expiresAt: voucher.expiresAt,
            usedAt: voucher.usedAt,
            createdAt: voucher.createdAt,
        }))
    }
}
