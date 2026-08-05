import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
    Not,
} from "typeorm"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    InstallmentPlanEntity,
    InstallmentPlanStatus,
} from "@modules/databases"
import {
    InstallmentPlanService,
} from "@modules/bussiness"
import type {
    InstallmentPlanItem,
} from "./graphql-types"

@Injectable()
/**
 * Reads a viewer's installment ("trả góp") plans for the "Kế hoạch trả góp của
 * tôi" surface — a per-viewer single-list read (exempt from the CQRS-projection
 * rule, like `MyMockInterviewAttemptBySessionService`), NOT an aggregate. Each
 * plan is enriched with THIS cycle's minimum payment (via the shared
 * {@link InstallmentPlanService.computeMinPaymentVnd}, so the surface and the
 * `payNextInstallment` charge always agree) and the titles of the courses it
 * gates.
 */
export class MyInstallmentPlansService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly installmentPlanService: InstallmentPlanService,
    ) {}

    /**
     * List the viewer's non-completed installment plans (newest first).
     *
     * @param userId - The viewer whose plans to list.
     * @returns The plans, each enriched with the current cycle's minimum + course titles.
     */
    async list(
        userId: string,
    ): Promise<Array<InstallmentPlanItem>> {
        const plans = await this.entityManager.find(
            InstallmentPlanEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    // a finished plan has nothing to pay — hide it from the "plans to pay" surface
                    status: Not(InstallmentPlanStatus.Completed),
                },
                order: {
                    createdAt: "DESC",
                },
            },
        )
        if (plans.length === 0) {
            return []
        }

        // resolve every gated course's title in ONE query (id → title)
        const courseIds = [...new Set(plans.flatMap((plan) => plan.lockedCourseIds))]
        const courses = courseIds.length > 0
            ? await this.entityManager.find(
                CourseEntity,
                {
                    where: {
                        id: In(courseIds),
                    },
                    select: {
                        id: true,
                        title: true,
                    },
                },
            )
            : []
        const titleById = new Map(courses.map((course) => [course.id,
            course.title]))

        return plans.map((plan) => ({
            id: plan.id,
            planType: plan.planType,
            status: plan.status,
            nextDueAt: plan.nextDueAt?.toISOString() ?? "",
            minPaymentVnd: this.installmentPlanService.computeMinPaymentVnd(plan),
            months: plan.months,
            installmentsPaid: plan.installmentsPaid,
            monthlyAmountVnd: plan.monthlyAmountVnd,
            totalAmountVnd: plan.totalAmountVnd,
            markupPercent: plan.markupPercent,
            remainingVnd: plan.remainingVnd,
            minPaymentPercent: plan.minPaymentPercent,
            minPaymentFloorVnd: plan.minPaymentFloorVnd,
            courses: plan.lockedCourseIds.map((id) => ({
                id,
                title: titleById.get(id) ?? "",
            })),
            createdAt: plan.createdAt.toISOString(),
        }))
    }
}
