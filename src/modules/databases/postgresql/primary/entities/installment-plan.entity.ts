import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    GraphQLTypeInstallmentPlanStatus,
    GraphQLTypeInstallmentPlanType,
    InstallmentPlanStatus,
    InstallmentPlanType,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    TransactionEntity,
} from "./transaction.entity"

@ObjectType({
    description: "An installment payment plan — a fixed new-purchase schedule or a legacy flexible arrears pool.",
})
@Entity("installment_plans")
/**
 * An installment payment plan -- either:
 * - `Fixed` -- a NEW purchase paying in installments (fixed 3/6/12-month
 *   schedule, a markup snapshot applied at checkout, `originTransaction` set).
 * - `FlexiblePool` -- a legacy Pioneer arrears balance migrated into the
 *   system (no schedule, no markup -- the original price is honoured;
 *   `originTransaction` is null since no new checkout created it).
 *
 * Both modes share ONE daily enforcement cron (remind -> warn -> lock) -- see
 * `InstallmentPlanEnforcementCronService` -- differing only in how the
 * per-cycle minimum payment is computed (`InstallmentPlanService.computeMinPaymentVnd`).
 * A plan tracks a WHOLE checkout (possibly a multi-course cart), never a
 * single course -- see `originTransaction` (the transaction may itself fan out
 * to several `TransactionItemEntity` lines / enrollments).
 */
export class InstallmentPlanEntity extends UuidAbstractEntity {
    /** The learner this plan belongs to. */
    @Field(
        () => UserEntity,
        {
            description: "The learner this installment plan belongs to.",
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
        foreignKeyConstraintName: "fk_user_id_installment_plans_users",
    })
        user: UserEntity

    /** Id of {@link user}. */
    @Field(
        () => String,
        {
            description: "Id of the learner this installment plan belongs to.",
        },
    )
    @RelationId(
        (plan: InstallmentPlanEntity) => plan.user,
    )
        userId: string

    /**
     * The checkout transaction this plan originated from -- null for a
     * `FlexiblePool` plan backfilled from a legacy Pioneer arrears balance
     * (no new checkout created it). A `Fixed` plan always has one.
     */
    @Field(
        () => TransactionEntity,
        {
            nullable: true,
            description: "The checkout transaction this plan originated from; null for a backfilled legacy arrears plan.",
        },
    )
    @ManyToOne(
        () => TransactionEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "origin_transaction_id",
        foreignKeyConstraintName: "fk_origin_transaction_id_installment_plans_transactions",
    })
        originTransaction: TransactionEntity | null

    /** Id of {@link originTransaction}; null for a backfilled legacy arrears plan. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Id of the originating checkout transaction; null for a backfilled legacy arrears plan.",
        },
    )
    @RelationId(
        (plan: InstallmentPlanEntity) => plan.originTransaction,
    )
        originTransactionId: string | null

    /**
     * Snapshot of every course this plan gates access to -- locked (`is_enrolled
     * = false`) together when the plan defaults, unlocked together when it
     * catches up. For a `Fixed` plan this is copied from `originTransaction`'s
     * course(s) at creation time; for a backfilled `FlexiblePool` plan (no
     * originating transaction -- the legacy purchase happened outside the
     * system) it is supplied explicitly by the backfill script. Snapshotting
     * here (rather than re-deriving from the transaction every cron run) keeps
     * both modes self-contained and immune to a transaction's course list
     * changing shape later.
     */
    @Field(
        () => [String],
        {
            description: "Course ids this plan gates access to (locked/unlocked together).",
        },
    )
    @Column({
        name: "locked_course_ids",
        type: "jsonb",
        default: [],
    })
        lockedCourseIds: Array<string>

    /** Which flavour of installment plan this is -- drives how the minimum payment is computed. */
    @Field(
        () => GraphQLTypeInstallmentPlanType,
        {
            description: "Which flavour of installment plan this is (fixed schedule vs flexible arrears pool).",
        },
    )
    @Column({
        name: "plan_type",
        type: "enum",
        enum: InstallmentPlanType,
        enumName: "installment_plan_type",
    })
        planType: InstallmentPlanType

    /** Lifecycle status, driven by the daily enforcement cron. */
    @Field(
        () => GraphQLTypeInstallmentPlanStatus,
        {
            description: "Lifecycle status of the plan.",
        },
    )
    @Column({
        name: "status",
        type: "enum",
        enum: InstallmentPlanStatus,
        enumName: "installment_plan_status",
        default: InstallmentPlanStatus.Active,
    })
        status: InstallmentPlanStatus

    // ─── Fixed mode only (null for FlexiblePool) ──────────────────────────

    /** Number of months in the fixed schedule (3, 6, or 12). Fixed mode only. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Number of months in the fixed schedule (3, 6, or 12). Fixed mode only.",
        },
    )
    @Column({
        name: "months",
        type: "int",
        nullable: true,
    })
        months: number | null

    /** Fixed per-cycle amount (`totalAmountVnd / months`, remainder folded into the last cycle). Fixed mode only. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Fixed per-cycle amount owed. Fixed mode only.",
        },
    )
    @Column({
        name: "monthly_amount_vnd",
        type: "int",
        nullable: true,
    })
        monthlyAmountVnd: number | null

    /** Total amount owed across the whole schedule, markup already applied. Fixed mode only. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Total amount owed across the whole schedule, markup already applied. Fixed mode only.",
        },
    )
    @Column({
        name: "total_amount_vnd",
        type: "int",
        nullable: true,
    })
        totalAmountVnd: number | null

    /**
     * The markup percent SNAPSHOT applied at checkout (e.g. 5/10/20) -- frozen
     * at purchase time so a later change to the markup schedule never
     * retroactively changes what an existing buyer owes. Fixed mode only.
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Markup percent snapshot applied at checkout (frozen — later schedule changes never apply retroactively). Fixed mode only.",
        },
    )
    @Column({
        name: "markup_percent",
        type: "int",
        nullable: true,
    })
        markupPercent: number | null

    /** How many cycles have been paid so far. Fixed mode only (`FlexiblePool` tracks progress via `remainingVnd` instead). */
    @Field(
        () => Int,
        {
            description: "How many cycles have been paid so far. Fixed mode only (always 0 for FlexiblePool).",
        },
    )
    @Column({
        name: "installments_paid",
        type: "int",
        default: 0,
    })
        installmentsPaid: number

    // ─── FlexiblePool mode only (null for Fixed) ──────────────────────────

    /**
     * The REAL remaining arrears balance (e.g. 5,000,000 / 6,000,000 -- a
     * distinct amount per learner, never split into equal fixed cycles).
     * FlexiblePool mode only.
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Real remaining arrears balance. FlexiblePool mode only.",
        },
    )
    @Column({
        name: "remaining_vnd",
        type: "int",
        nullable: true,
    })
        remainingVnd: number | null

    /**
     * Absolute floor for the per-cycle minimum payment, regardless of how
     * small `remainingVnd` has shrunk. FlexiblePool mode only. Default
     * 500,000 VND per the 2026-07-05 decision.
     */
    @Field(
        () => Int,
        {
            description: "Absolute floor for the per-cycle minimum payment. FlexiblePool mode only.",
        },
    )
    @Column({
        name: "min_payment_floor_vnd",
        type: "int",
        default: 500_000,
    })
        minPaymentFloorVnd: number

    /**
     * Percent of the CURRENT `remainingVnd` owed each cycle (recomputed every
     * cycle against the shrinking balance, never the original amount).
     * FlexiblePool mode only. Default 10% per the 2026-07-05 decision.
     */
    @Field(
        () => Int,
        {
            description: "Percent of the current remaining balance owed each cycle. FlexiblePool mode only.",
        },
    )
    @Column({
        name: "min_payment_percent",
        type: "int",
        default: 10,
    })
        minPaymentPercent: number

    // ─── Shared by both modes ──────────────────────────────────────────────

    /** When the next cycle's minimum payment is due. */
    @Field(
        () => Date,
        {
            description: "When the next cycle's minimum payment is due.",
        },
    )
    @Column({
        name: "next_due_at",
        type: "timestamptz",
    })
        nextDueAt: Date

    /**
     * Days past {@link nextDueAt} before the enforcement cron sends the
     * SECOND (final-warning) reminder. Default 7 per the 2026-07-05 proposal
     * (teacher not yet final -- adjustable per plan without a schema change).
     */
    @Field(
        () => Int,
        {
            description: "Days past due before the second (final-warning) reminder fires.",
        },
    )
    @Column({
        name: "second_reminder_after_days",
        type: "int",
        default: 7,
    })
        secondReminderAfterDays: number

    /**
     * Total days past {@link nextDueAt} before the enforcement cron locks the
     * related enrollment(s) (`status` -> `Defaulted`). Default 14 per the
     * 2026-07-05 proposal.
     */
    @Field(
        () => Int,
        {
            description: "Total days past due before the plan defaults and related enrollments are locked.",
        },
    )
    @Column({
        name: "lockout_after_days",
        type: "int",
        default: 14,
    })
        lockoutAfterDays: number

    /**
     * When the day-0 "due now" reminder last fired for the CURRENT cycle --
     * cleared on every successful payment so a new cycle gets its own
     * reminder. Null = not yet sent for this cycle (keeps the daily cron
     * idempotent instead of re-sending on every run).
     */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the day-0 reminder last fired for the current cycle; null = not sent yet.",
        },
    )
    @Column({
        name: "due_reminded_at",
        type: "timestamptz",
        nullable: true,
    })
        dueRemindedAt: Date | null

    /**
     * When the second (final-warning) reminder last fired for the CURRENT
     * cycle -- same idempotency purpose as {@link dueRemindedAt}.
     */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the second (final-warning) reminder last fired for the current cycle; null = not sent yet.",
        },
    )
    @Column({
        name: "second_reminded_at",
        type: "timestamptz",
        nullable: true,
    })
        secondRemindedAt: Date | null
}
