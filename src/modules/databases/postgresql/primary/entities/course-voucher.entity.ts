import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeVoucherDiscountType,
    GraphQLTypeVoucherStatus,
    VoucherDiscountType,
    VoucherStatus,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CourseEntity,
} from "./course.entity"
import {
    RewardRedemptionEntity,
} from "./reward-redemption.entity"
import {
    UserEntity,
} from "./user.entity"

/**
 * One discount voucher minted by redeeming a `kind: "voucher"` Coin-shop
 * reward. Percent- or flat-VND-off, scoped to one course or any course
 * (`course = null`), redeemable once. `status` tracks its lifecycle across a
 * checkout attempt: `unused` → `reserved` (a pending transaction claimed it) →
 * `used` (that transaction succeeded) or back to `unused` (it failed/expired).
 */
@Index(["user"])
@Index(
    "uq_course_vouchers_code",
    ["code"],
    {
        unique: true,
    },
)
@ObjectType({
    description: "A discount voucher minted from the Coin shop.",
})
@Entity("course_vouchers")
export class CourseVoucherEntity extends UuidAbstractEntity {
    /** The user who redeemed the reward that minted this voucher. */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_course_vouchers_users",
    })
        user: UserEntity

    /** Owning user id. */
    @Column({
        name: "user_id",
        type: "uuid",
    })
    @RelationId(
        (voucher: CourseVoucherEntity) => voucher.user,
    )
        userId: string

    /** The reward-redemption row that minted this voucher (1-1, audit trail). */
    @ManyToOne(
        () => RewardRedemptionEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "redemption_id",
        foreignKeyConstraintName: "fk_redemption_id_course_vouchers_reward_redemptions",
    })
        redemption: RewardRedemptionEntity

    /** Owning redemption id. */
    @Column({
        name: "redemption_id",
        type: "uuid",
    })
    @RelationId(
        (voucher: CourseVoucherEntity) => voucher.redemption,
    )
        redemptionId: string

    /**
     * Course this voucher discounts; `null` = redeemable against ANY course
     * (a general-purpose voucher, not tied to a single course at mint time).
     */
    @Field(
        () => CourseEntity,
        {
            nullable: true,
            description: "Course this voucher discounts; null = any course.",
        },
    )
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_course_vouchers_courses",
    })
        course: CourseEntity | null

    /** Owning course id; null = any course. */
    @Column({
        name: "course_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (voucher: CourseVoucherEntity) => voucher.course,
    )
        courseId: string | null

    /** The redeemable code (opaque, unique; the FE submits this at checkout). */
    @Field(
        () => String,
        {
            description: "The redeemable voucher code.",
        },
    )
    @Column({
        name: "code",
        type: "varchar",
        length: 32,
    })
        code: string

    /** Percent-off or flat-VND-off. */
    @Field(
        () => GraphQLTypeVoucherDiscountType,
        {
            description: "Percent-off or flat-VND-off.",
        },
    )
    @Column({
        name: "discount_type",
        type: "enum",
        enum: VoucherDiscountType,
        enumName: "voucher_discount_type",
    })
        discountType: VoucherDiscountType

    /** Percent (0-100) or flat VND amount, depending on {@link discountType}. */
    @Field(
        () => Int,
        {
            description: "Percent (0-100) or flat VND amount.",
        },
    )
    @Column({
        name: "value",
        type: "int",
    })
        value: number

    /** Lifecycle status of the voucher. */
    @Field(
        () => GraphQLTypeVoucherStatus,
        {
            description: "Lifecycle status of the voucher.",
        },
    )
    @Column({
        name: "status",
        type: "enum",
        enum: VoucherStatus,
        enumName: "voucher_status",
        default: VoucherStatus.Unused,
    })
        status: VoucherStatus

    /** When the voucher stops being redeemable (independent of use). */
    @Field(
        () => Date,
        {
            description: "When the voucher stops being redeemable.",
        },
    )
    @Column({
        name: "expires_at",
        type: "timestamptz",
    })
        expiresAt: Date

    /** When the voucher was actually spent on a succeeded checkout; null until then. */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the voucher was spent; null until used.",
        },
    )
    @Column({
        name: "used_at",
        type: "timestamptz",
        nullable: true,
    })
        usedAt: Date | null

    /**
     * The transaction currently holding this voucher — set when a checkout
     * reserves it, cleared when that checkout fails/expires (releasing the
     * code), left set once it transitions to `used`.
     */
    @Column({
        name: "reserved_transaction_id",
        type: "uuid",
        nullable: true,
    })
        reservedTransactionId: string | null
}
