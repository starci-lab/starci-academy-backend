import {
    Column,
    Entity,
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
    GraphQLTypeActionType,
    GraphQLTypeTransactionStatus,
    TransactionStatus,
} from "../enums"
import {
    CourseEntity,
} from "./course.entity"
import {
    UserEntity,
} from "./user.entity"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    GraphQLTypePricingPhase,
    GraphQLTypePaymentType,
    PaymentType,
    PricingPhase,
    ActionType,
    AiSubTier,
    GraphQLTypeAiSubTier,
} from "../enums"

/**
 * Transaction entity: capture the payment details of a user for a course (course may be null).
 */
@ObjectType({
    description: "Transaction capture the payment details of a user for a course (course may be null).",
})
@Entity("transactions")
export class TransactionEntity extends UuidAbstractEntity {
    /**
     * The user who made the preflight transaction.
     */
    @Field(
        () => UserEntity,
        {
            nullable: false,
            description: "The user who made the preflight transaction.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_transactions_users",
    })
        user: UserEntity

    /**
     * The course associated with the preflight transaction.
     */
    @Field(
        () => CourseEntity,
        {
            nullable: true,
            description: "The course associated with the preflight transaction.",
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
        foreignKeyConstraintName: "fk_course_id_transactions_courses",
    })
        course: CourseEntity | null

    /**
     * The ID of the user who made the preflight transaction.
     */
    @Field(
        () => String,
        {
            description: "The ID of the user who made the preflight transaction.",
        },
    )
    @RelationId(
        (t: TransactionEntity) => t.user,
    )
        userId: string

    /**
     * The ID of the course associated with the preflight transaction.
     */
    @Field(
        () => String,
        {
            description: "The ID of the course associated with the preflight transaction.",
        },
    )
    @RelationId(
        (transaction: TransactionEntity) => transaction.course,
    )
        courseId: string | null

    /**
     * The order code of the preflight transaction.
     */
    @Field(
        () => String,
        {
            description: "The reference ID of the preflight transaction.",
        },
    )
    @Column({
        name: "reference_id",
        type: "varchar",
        length: 64,
    })
        referenceId: string

    /**
     * Native payment id returned by the gateway at checkout creation, used to
     * poll the gateway for payment status during reconciliation. Holds the Stripe
     * Checkout Session id, the PayPal order id, or the NOWPayments invoice id.
     * Null for PayOS/Sepay, which are reconciled by {@link referenceId} (orderCode).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Native gateway payment id used to poll status during reconciliation (Stripe session / PayPal order / NOWPayments invoice). Null for PayOS/Sepay.",
        },
    )
    @Column({
        name: "provider_payment_id",
        type: "varchar",
        length: 128,
        nullable: true,
    })
        providerPaymentId: string | null

    /**
     * The payment amount of the preflight transaction.
     */
    @Field(
        () => Int,
        {
            description: "The payment amount of the preflight transaction.",
        },
    )
    @Column({
        name: "amount",
        type: "int",
    })
        amount: number

    /**
     * Loyalty discount percent applied at checkout (0–100). The persisted
     * {@link amount} already reflects this discount; stored so the charged price
     * matches what the buyer was shown.
     */
    @Field(
        () => Int,
        {
            description: "Loyalty discount percent applied at checkout (0–100).",
        },
    )
    @Column({
        name: "discount_percent",
        type: "int",
        default: 0,
    })
        discountPercent: number

    /**
     * Coin-shop voucher code applied at checkout, if any (null = no voucher).
     * Reserved on the voucher row the moment this transaction is created;
     * flipped to `used` only once this transaction succeeds (see
     * {@link VoucherService}), so a failed/expired checkout releases the code
     * back to `unused` instead of burning it.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Coin-shop voucher code applied at checkout, if any.",
        },
    )
    @Column({
        name: "voucher_code",
        type: "varchar",
        length: 32,
        nullable: true,
    })
        voucherCode: string | null

    /**
     * The pricing phase applied to the preflight transaction.
     */
    @Field(
        () => GraphQLTypePricingPhase,
        {
            description: "The pricing phase applied to the preflight transaction.",
        },
    )
    @Column({
        name: "pricing_phase",
        type: "enum",
        enum: PricingPhase,
    })
        pricingPhase: PricingPhase

    /**
     * The checkout URL for the preflight transaction.
     */
    @Field(
        () => String,
        {
            description: "The checkout URL for the preflight transaction.",
        },
    )
    @Column({
        name: "checkout_url",
        type: "text",
    })
        checkoutUrl: string

    /**
     * The current status of the transaction.
     */
    @Field(
        () => GraphQLTypeTransactionStatus,
        {
            description: "The current status of the transaction.",
        },
    )
    @Column({
        name: "status",
        type: "enum",
        enum: TransactionStatus,
    })
        status: TransactionStatus

    /**
     * The payment provider type of the preflight transaction.
     */
    @Field(
        () => GraphQLTypePaymentType,
        {
            description: "The payment provider type of the preflight transaction.",
        },
    )
    @Column({
        name: "payment_type",
        type: "enum",
        enum: PaymentType,
    })
        paymentType: PaymentType

    /**
     * The action type of the preflight transaction.
     */
    @Field(
        () => GraphQLTypeActionType,
        {
            description: "The action type of the preflight transaction.",
        },
    )
    @Column({
        name: "action_type",
        type: "enum",
        enum: ActionType,
    })
        actionType: ActionType

    /**
     * Target AI subscription tier when {@link actionType} is
     * `aiSubscriptionPurchase`; null for every other action type.
     */
    @Field(
        () => GraphQLTypeAiSubTier,
        {
            nullable: true,
            description: "AI subscription tier this transaction grants (purchase only).",
        },
    )
    @Column({
        name: "ai_sub_tier",
        type: "enum",
        enum: AiSubTier,
        enumName: "ai_sub_tier",
        nullable: true,
    })
        aiSubTier: AiSubTier | null

    /**
     * The installment plan this transaction pays one cycle of, when
     * {@link actionType} is `installmentPayment`; null for every other action
     * type. Not a relation (the reconcile worker only ever needs the id to
     * call `InstallmentPlanService`) — deliberately a plain column to avoid a
     * circular entity reference (`InstallmentPlanEntity` already points back
     * at a transaction via `originTransaction`).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "The installment plan this transaction pays one cycle of (installment payments only).",
        },
    )
    @Column({
        name: "installment_plan_id",
        type: "uuid",
        nullable: true,
    })
        installmentPlanId: string | null
}
