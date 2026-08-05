import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Cron,
    CronExpression,
} from "@nestjs/schedule"
import {
    In,
    LessThan,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    InstallmentPlanEntity,
    InstallmentPlanStatus,
} from "@modules/databases"
import {
    DayjsService,
} from "@modules/mixin"
// value import (NOT `import type`) — Nest DI needs the class at runtime; deep path
// avoids the circular @modules/bussiness barrel (this file lives inside it)
import {
    EnqueueSendMailJobService,
} from "../jobs/enqueue/send-mail.service"
import {
    enqueueInstallmentDefaultedEmail,
    enqueueInstallmentDueEmail,
    enqueueInstallmentFinalWarningEmail,
} from "@modules/transactional-email"
import {
    envConfig,
} from "@modules/env"
import {
    InstallmentPlanService,
} from "./installment-plan.service"

@Injectable()
/**
 * Daily enforcement sweep for installment plans (§2.4 of
 * `docs/installment-payment-plan.md`) — mirrors {@link import("../streak/streak-freeze-cron.service").StreakFreezeCronService}'s
 * shape (find candidates → process each → log → swallow failures).
 *
 * Three stages past `nextDueAt`, shared by BOTH `Fixed` and `FlexiblePool`
 * plans (only the minimum-payment FORMULA differs — see
 * {@link InstallmentPlanService.computeMinPaymentVnd}):
 * - **Day 0** (due) — send the first reminder, flip `Active` → `Overdue`.
 * - **`secondReminderAfterDays`** (default 7) — send the final-warning reminder.
 * - **`lockoutAfterDays`** (default 14) — flip to `Defaulted` and lock every
 *   enrollment in `lockedCourseIds`. No late fee — locking access is the only
 *   enforcement (2026-07-05 decision, v1).
 *
 * Every reminder is guarded by its own `*RemindedAt` timestamp so a daily
 * re-run never re-sends the same stage twice — `InstallmentPlanService.recordPayment`
 * clears both timestamps whenever a cycle is paid off.
 */
export class InstallmentPlanEnforcementCronService {
    /** Logger scoped to this service for easy grep of enforcement runs. */
    private readonly logger = new Logger(InstallmentPlanEnforcementCronService.name)

    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
        private readonly installmentPlanService: InstallmentPlanService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) { }

    /**
     * Run the enforcement sweep once per day (01:00 Asia/Ho_Chi_Minh). Any
     * failure is logged and swallowed so a bad run can never crash the
     * scheduler — every step here is idempotent, so the next day self-heals.
     */
    @Cron(
        CronExpression.EVERY_DAY_AT_1AM,
        {
            name: "installment-plan-enforcement",
            timeZone: "Asia/Ho_Chi_Minh",
        },
    )
    async enforceOverduePlans(): Promise<void> {
        try {
            const now = this.dayjsService.now().toDate()
            const duePlans = await this.entityManager.find(
                InstallmentPlanEntity,
                {
                    where: {
                        status: In([
                            InstallmentPlanStatus.Active,
                            InstallmentPlanStatus.Overdue,
                        ]),
                        nextDueAt: LessThan(now),
                    },
                },
            )
            for (const plan of duePlans) {
                await this.enforceOne(plan)
            }
            this.logger.log(`Installment-plan enforcement processed ${duePlans.length} plan(s)`)
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error))
            this.logger.error(
                cause.message,
                cause.stack,
            )
        }
    }

    /**
     * Enforce ONE overdue plan against the three stages described above.
     *
     * The stages are checked highest-first (3 → 2 → 1) and each branch
     * unconditionally `return`s — that is what keeps them MUTUALLY EXCLUSIVE
     * for a single run. Stage 1 only runs when the plan is below the
     * `secondReminderAfterDays` threshold precisely because stage 2's `if`
     * already returned for anything at or past it. Adding a 4th stage or
     * dropping any of these `return`s would let more than one stage fire for
     * the same plan in the same sweep (e.g. re-sending the day-0 reminder on
     * a plan that already got the final warning).
     *
     * @param plan - The overdue plan (already known `nextDueAt < now`).
     */
    private async enforceOne(plan: InstallmentPlanEntity): Promise<void> {
        const daysPastDue = this.dayjsService.now().diff(
            this.dayjsService.from(plan.nextDueAt),
            "day",
        )
        const minPaymentVnd = this.installmentPlanService.computeMinPaymentVnd(plan)
        const webBaseUrl = envConfig().web.baseUrl

        // stage 3 — past the full grace period: lock (idempotent — only acts once)
        if (daysPastDue >= plan.lockoutAfterDays) {
            if (plan.status === InstallmentPlanStatus.Defaulted) {
                return
            }
            await this.entityManager.update(
                InstallmentPlanEntity,
                {
                    id: plan.id,
                },
                {
                    status: InstallmentPlanStatus.Defaulted,
                },
            )
            await this.installmentPlanService.lockGatedEnrollments(plan)
            await enqueueInstallmentDefaultedEmail({
                entityManager: this.entityManager,
                enqueueSendMailJobService: this.enqueueSendMailJobService,
                userId: plan.userId,
                webBaseUrl,
                minPaymentVnd,
            })
            return
        }

        // stage 2 — past the second-reminder threshold: final warning (once per cycle)
        if (daysPastDue >= plan.secondReminderAfterDays) {
            if (!plan.secondRemindedAt) {
                await enqueueInstallmentFinalWarningEmail({
                    entityManager: this.entityManager,
                    enqueueSendMailJobService: this.enqueueSendMailJobService,
                    userId: plan.userId,
                    webBaseUrl,
                    minPaymentVnd,
                    daysUntilLockout: plan.lockoutAfterDays - daysPastDue,
                })
                await this.entityManager.update(
                    InstallmentPlanEntity,
                    {
                        id: plan.id,
                    },
                    {
                        status: InstallmentPlanStatus.Overdue,
                        secondRemindedAt: this.dayjsService.now().toDate(),
                    },
                )
            }
            return
        }

        // stage 1 — day 0..secondReminderAfterDays: first "it's due" reminder (once per cycle)
        if (!plan.dueRemindedAt) {
            await enqueueInstallmentDueEmail({
                entityManager: this.entityManager,
                enqueueSendMailJobService: this.enqueueSendMailJobService,
                userId: plan.userId,
                webBaseUrl,
                minPaymentVnd,
            })
            await this.entityManager.update(
                InstallmentPlanEntity,
                {
                    id: plan.id,
                },
                {
                    status: InstallmentPlanStatus.Overdue,
                    dueRemindedAt: this.dayjsService.now().toDate(),
                },
            )
        }
    }
}
