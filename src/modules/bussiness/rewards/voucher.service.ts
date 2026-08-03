import {
    randomBytes,
} from "crypto"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseVoucherEntity,
    InjectPrimaryPostgreSQLEntityManager,
    VoucherDiscountType,
    VoucherStatus,
} from "@modules/databases"
import {
    InvalidVoucherException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import type {
    RewardVoucherConfig,
} from "./types"

/** A validated (but not yet consumed) voucher, resolved for one course. */
export interface VoucherPreview {
    /** The voucher row backing this preview. */
    voucher: CourseVoucherEntity
    /** Percent-off or flat-VND-off. */
    discountType: VoucherDiscountType
    /** Percent (0-100) or flat VND amount. */
    value: number
}

/** Params shared by {@link VoucherService.previewDiscount} and {@link VoucherService.reserve}. */
export interface ResolveVoucherParams {
    /** The redeemer who must own the code. */
    userId: string
    /** The code the buyer typed in at checkout. */
    code: string
    /** The course being checked out (validated against the voucher's scope). */
    courseId: string
}

/**
 * Coin-shop voucher lifecycle: mint on redemption, preview + reserve at
 * checkout, settle (used/released) once the funding transaction resolves.
 *
 * Lifecycle: `unused` --reserve()--> `reserved` --markUsed()--> `used`
 *                                        `-- release() --> `unused` (back)
 *
 * `reserved` exists so a pending (not-yet-confirmed) checkout claims the code
 * without letting a SECOND concurrent checkout also spend it, while a
 * failed/expired first checkout still gives the code back instead of burning it.
 */
@Injectable()
export class VoucherService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) {}

    /**
     * Mint a fresh voucher from a redeemed `kind: "voucher"` reward. Runs in the
     * caller's transaction (the same one inserting the {@link RewardRedemptionEntity}
     * row) so the mint is atomic with the spend.
     *
     * @param params - the redeemer, the redemption row funding it, and the reward's
     * voucher config.
     * @returns the freshly-minted, `unused` voucher.
     */
    async mint(
        {
            entityManager,
            userId,
            redemptionId,
            config,
        }: {
            entityManager: EntityManager
            userId: string
            redemptionId: string
            config: RewardVoucherConfig
        },
    ): Promise<CourseVoucherEntity> {
        const code = this.generateCode()
        const expiresAt = this.dayjsService.now()
            .add(config.validityDays,
                "day")
            .toDate()
        const created = entityManager.create(
            CourseVoucherEntity,
            {
                user: {
                    id: userId,
                },
                redemption: {
                    id: redemptionId,
                },
                course: null,
                code,
                discountType: config.discountType === "percent"
                    ? VoucherDiscountType.Percent
                    : VoucherDiscountType.Flat,
                value: config.value,
                status: VoucherStatus.Unused,
                expiresAt,
                usedAt: null,
                reservedTransactionId: null,
            },
        )
        return entityManager.save(created)
    }

    /**
     * Look up + validate one voucher code for a course, WITHOUT mutating it —
     * safe to call repeatedly from a price-preview endpoint. Throws
     * {@link InvalidVoucherException} when the code is unknown, not owned by
     * this user, expired, already reserved/used, or scoped to a different course.
     */
    async previewDiscount(
        {
            userId,
            code,
            courseId,
        }: ResolveVoucherParams,
    ): Promise<VoucherPreview> {
        const voucher = await this.entityManager.findOne(
            CourseVoucherEntity,
            {
                where: {
                    code,
                },
            },
        )
        this.assertRedeemable(voucher,
            userId,
            courseId)
        // `assertRedeemable` narrows `voucher` to non-null on success
        const validated = voucher as CourseVoucherEntity
        return {
            voucher: validated,
            discountType: validated.discountType,
            value: validated.value,
        }
    }

    /**
     * Claim a voucher for a PENDING checkout: validates it (same rules as
     * {@link previewDiscount}) then locks + flips it to `reserved`, stamping the
     * claiming transaction id. Must run in the SAME transaction that persists
     * the pending {@link TransactionEntity} row, so a concurrent second checkout
     * cannot also reserve the same code.
     *
     * @returns the voucher's discount (for the caller to price the checkout).
     */
    async reserve(
        {
            entityManager,
            userId,
            code,
            courseId,
            transactionId,
        }: ResolveVoucherParams & {
            entityManager: EntityManager
            transactionId: string
        },
    ): Promise<VoucherPreview> {
        const voucher = await entityManager
            .createQueryBuilder(CourseVoucherEntity,
                "voucher")
            .setLock("pessimistic_write")
            .where("voucher.code = :code",
                {
                    code,
                })
            .getOne()
        this.assertRedeemable(voucher,
            userId,
            courseId)
        const validated = voucher as CourseVoucherEntity
        validated.status = VoucherStatus.Reserved
        validated.reservedTransactionId = transactionId
        await entityManager.save(validated)
        return {
            voucher: validated,
            discountType: validated.discountType,
            value: validated.value,
        }
    }

    /**
     * Settle a voucher as SPENT once its claiming transaction succeeds. No-op
     * when the transaction reserved no voucher. Idempotent (a `used` row is
     * left untouched on a retried finalize).
     */
    async markUsed(
        {
            entityManager,
            transactionId,
        }: {
            entityManager: EntityManager
            transactionId: string
        },
    ): Promise<void> {
        const voucher = await entityManager.findOne(
            CourseVoucherEntity,
            {
                where: {
                    reservedTransactionId: transactionId,
                    status: VoucherStatus.Reserved,
                },
            },
        )
        if (!voucher) {
            return
        }
        voucher.status = VoucherStatus.Used
        voucher.usedAt = this.dayjsService.now().toDate()
        await entityManager.save(voucher)
    }

    /**
     * Release a voucher reserved by a transaction that ultimately failed/expired
     * — gives the code back (`unused`) instead of burning it. No-op when the
     * transaction reserved no voucher (or it was already settled `used`).
     */
    async release(
        {
            entityManager,
            transactionId,
        }: {
            entityManager: EntityManager
            transactionId: string
        },
    ): Promise<void> {
        const voucher = await entityManager.findOne(
            CourseVoucherEntity,
            {
                where: {
                    reservedTransactionId: transactionId,
                    status: VoucherStatus.Reserved,
                },
            },
        )
        if (!voucher) {
            return
        }
        voucher.status = VoucherStatus.Unused
        voucher.reservedTransactionId = null
        await entityManager.save(voucher)
    }

    /** Shared ownership/expiry/status/scope checks for preview + reserve. */
    private assertRedeemable(
        voucher: CourseVoucherEntity | null,
        userId: string,
        courseId: string,
    ): void {
        if (!voucher) {
            throw new InvalidVoucherException({
                reason: "unknown",
            })
        }
        if (voucher.userId !== userId) {
            throw new InvalidVoucherException({
                reason: "unknown",
            })
        }
        if (voucher.status !== VoucherStatus.Unused) {
            throw new InvalidVoucherException({
                reason: voucher.status === VoucherStatus.Expired
                    ? "expired"
                    : "alreadyUsed",
            })
        }
        if (this.dayjsService.now().isAfter(voucher.expiresAt)) {
            throw new InvalidVoucherException({
                reason: "expired",
            })
        }
        if (voucher.courseId && voucher.courseId !== courseId) {
            throw new InvalidVoucherException({
                reason: "wrongCourse",
            })
        }
    }

    /**
     * List a user's minted vouchers, newest first, with the scoped course
     * (when any) eager-loaded for display. Read-only — does NOT lazily flip a
     * past-expiry `unused` row to `expired` in the DB; the resolver derives the
     * DISPLAYED status from `expiresAt` instead (see {@link isEffectivelyExpired}),
     * so an unused-but-past-expiry voucher still can't be redeemed elsewhere
     * (checkout re-validates `expiresAt` itself) without needing a cron sweep.
     *
     * @param userId - the owning user.
     * @returns the user's vouchers, newest first.
     */
    async listForUser(userId: string): Promise<Array<CourseVoucherEntity>> {
        return this.entityManager.find(
            CourseVoucherEntity,
            {
                where: {
                    userId,
                },
                relations: {
                    course: true,
                },
                order: {
                    createdAt: "DESC",
                },
            },
        )
    }

    /**
     * Whether a voucher should be DISPLAYED as expired even though its stored
     * `status` is still `unused` (no cron flips it) — past `expiresAt`.
     *
     * @param voucher - the voucher to check.
     * @returns true when unused but past its expiry.
     */
    isEffectivelyExpired(voucher: CourseVoucherEntity): boolean {
        return voucher.status === VoucherStatus.Unused
            && this.dayjsService.now().isAfter(voucher.expiresAt)
    }

    /**
     * Apply a resolved voucher discount ON TOP OF an already-loyalty-discounted
     * price: percent takes a further percent off the remaining price (currency-
     * agnostic — safe for a VND `amount` OR a USD `priceUsd`, per
     * `PAYMENT_MODIFIER_CAPABILITY`); flat subtracts a flat VND amount, so it
     * must only ever be called with a VND `amount` (the caller is expected to
     * have already rejected a Flat voucher on a USD gateway — see
     * `VoucherNotSupportedForGatewayException`). Floored at 0 either way
     * (never negative).
     *
     * @param amount - the price to discount further (post-loyalty), in whatever
     * currency the caller's gateway charges.
     * @returns the final amount, floored at 0.
     */
    applyToAmount(
        amount: number,
        discount: {
            discountType: VoucherDiscountType
            value: number
        },
    ): number {
        if (discount.discountType === VoucherDiscountType.Percent) {
            return Math.max(
                0,
                Math.round(amount * (1 - discount.value / 100)),
            )
        }
        return Math.max(
            0,
            amount - discount.value,
        )
    }

    /** A short, unambiguous (no 0/O/1/I) uppercase code, e.g. "7K4P-QX9M". */
    private generateCode(): string {
        const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
        const bytes = randomBytes(8)
        let raw = ""
        for (const byte of bytes) {
            raw += alphabet[byte % alphabet.length]
        }
        return `${raw.slice(0,
            4)}-${raw.slice(4,
            8)}`
    }
}
