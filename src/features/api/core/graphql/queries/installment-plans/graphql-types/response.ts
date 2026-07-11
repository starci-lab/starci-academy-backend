import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    GraphQLTypeInstallmentPlanStatus,
    GraphQLTypeInstallmentPlanType,
    InstallmentPlanStatus,
    InstallmentPlanType,
} from "@modules/databases"

/** One course an installment plan gates access to (id + title, for display). */
@ObjectType({
    description: "One course an installment plan gates access to.",
})
export class InstallmentPlanCourseItem {
    @Field(
        () => ID,
        {
            description: "Course id.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Course title (localized as stored).",
        },
    )
        title: string
}

/**
 * One of the viewer's installment ("trả góp") plans, read back for the "Kế
 * hoạch trả góp của tôi" surface. Fixed vs FlexiblePool fields are both present
 * on the type (nullable) — the FE branches on {@link planType} to render either
 * the "N/M cycles" schedule or the "remaining balance + dynamic minimum" pool.
 */
@ObjectType({
    description: "One of the viewer's installment (trả góp) plans.",
})
export class InstallmentPlanItem {
    @Field(
        () => ID,
        {
            description: "Plan id (pass to payNextInstallment).",
        },
    )
        id: string

    @Field(
        () => GraphQLTypeInstallmentPlanType,
        {
            description: "Fixed (new-buyer schedule) or FlexiblePool (Pioneer arrears).",
        },
    )
        planType: InstallmentPlanType

    @Field(
        () => GraphQLTypeInstallmentPlanStatus,
        {
            description: "Active / Overdue / Defaulted / Completed.",
        },
    )
        status: InstallmentPlanStatus

    @Field(
        () => String,
        {
            description: "ISO timestamp the current cycle is due.",
        },
    )
        nextDueAt: string

    @Field(
        () => Int,
        {
            description: "The minimum VND to pay THIS cycle (Fixed: the fixed monthly; FlexiblePool: max(remaining × %, floor)). The pay button charges at least this.",
        },
    )
        minPaymentVnd: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Fixed only: number of monthly cycles (3/6/12).",
        },
    )
        months: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Fixed only: cycles paid so far (starts at 1 after checkout).",
        },
    )
        installmentsPaid: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Fixed only: the fixed per-cycle amount.",
        },
    )
        monthlyAmountVnd: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Fixed only: whole-schedule total (markup applied).",
        },
    )
        totalAmountVnd: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Fixed only: markup percent snapshot.",
        },
    )
        markupPercent: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "FlexiblePool only: the real remaining arrears balance.",
        },
    )
        remainingVnd: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "FlexiblePool only: percent of remaining owed each cycle.",
        },
    )
        minPaymentPercent: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "FlexiblePool only: absolute per-cycle minimum floor (VND).",
        },
    )
        minPaymentFloorVnd: number | null

    @Field(
        () => [InstallmentPlanCourseItem],
        {
            description: "The courses this plan gates access to (locked together on default).",
        },
    )
        courses: Array<InstallmentPlanCourseItem>

    @Field(
        () => String,
        {
            description: "ISO timestamp the plan was created.",
        },
    )
        createdAt: string
}

/** Payload of the `myInstallmentPlans` query. */
@ObjectType({
    description: "The viewer's installment (trả góp) plans.",
})
export class MyInstallmentPlansData {
    @Field(
        () => [InstallmentPlanItem],
        {
            description: "The viewer's installment plans (newest first).",
        },
    )
        plans: Array<InstallmentPlanItem>
}

/** Response wrapper for the myInstallmentPlans query. */
@ObjectType({
    description: "Response wrapper for the myInstallmentPlans query.",
})
export class MyInstallmentPlansResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyInstallmentPlansData> {
    @Field(
        () => MyInstallmentPlansData,
        {
            nullable: true,
            description: "The viewer's installment plans.",
        },
    )
        data: MyInstallmentPlansData
}
