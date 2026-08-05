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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
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
    VoucherStatus,
} from "@modules/databases/postgresql/primary/enums/voucher-status"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    MyVoucherObject,
    MyVouchersResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The authenticated viewer's Coin-shop vouchers, newest first -- the my-wallet
 * list (code, discount, scope, status, expiry). A stale `unused` row past
 * its `expiresAt` is surfaced here as `expired` even though no cron has
 * flipped the stored column (see {@link VoucherService.isEffectivelyExpired}).
 */
export class MyVouchersResolver {
    constructor(
        private readonly voucherService: VoucherService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Vouchers fetched successfully",
        [Locale.Vi]: "Lấy danh sách voucher thành công", // vn-ok: vi-locale string emitted to clients
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
