import type {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    EntityManager,
} from "typeorm"
import {
    enqueueLearnerEmail,
} from "./enqueue-learner-email"

/** Shared shape for the transaction-finalize notification helpers. */
export interface GrantEmailParams {
    /** Manager used to resolve the recipient user (read-only). */
    entityManager: EntityManager
    /** Mail enqueue service (BullMQ `send-mail`). */
    enqueueSendMailJobService: EnqueueSendMailJobService
    /** Id of the buyer to notify. */
    userId: string
    /** Base URL of the learner web app. */
    webBaseUrl: string
    /** Recipient locale (defaults to English). */
    locale?: Locale | null
}

/** Params for {@link enqueueSubscriptionActiveEmail}. */
export interface SubscriptionActiveEmailParams extends GrantEmailParams {
    /** The newly-active tier, when known (display only). */
    tier?: string | null
}

/**
 * Email the buyer that their paid AI tier is now active. Best-effort -- call
 * ONLY when {@link AiEntitlementService.grantTier} returned `true` (a new grant),
 * so payment-webhook retries / reconcile polls never re-notify.
 */
export const enqueueSubscriptionActiveEmail = async (
    params: SubscriptionActiveEmailParams,
): Promise<void> => {
    await enqueueLearnerEmail({
        entityManager: params.entityManager,
        enqueueSendMailJobService: params.enqueueSendMailJobService,
        userId: params.userId,
        template: "subscription-active",
        locale: params.locale,
        webBaseUrl: params.webBaseUrl,
        subject: {
            vi: "Gói AI của bạn đã được kích hoạt", // vn-ok: vi-locale string emitted to clients
            en: "Your AI plan is now active",
        },
        extraContext: {
            tier: params.tier ?? null,
        },
    })
}

/**
 * Email the buyer that their community membership is now active. Best-effort --
 * call ONLY when {@link MembershipService.grantMembership} returned `true`.
 */
export const enqueueMembershipActiveEmail = async (
    params: GrantEmailParams,
): Promise<void> => {
    await enqueueLearnerEmail({
        entityManager: params.entityManager,
        enqueueSendMailJobService: params.enqueueSendMailJobService,
        userId: params.userId,
        template: "membership-active",
        locale: params.locale,
        webBaseUrl: params.webBaseUrl,
        subject: {
            vi: "Chào mừng bạn trở thành thành viên", // vn-ok: vi-locale string emitted to clients
            en: "Welcome to membership",
        },
    })
}

/**
 * Email the buyer that a payment did not complete (the transaction was marked
 * unpaid). Best-effort -- call when a pending transaction terminally fails.
 */
export const enqueuePaymentFailedEmail = async (
    params: GrantEmailParams,
): Promise<void> => {
    await enqueueLearnerEmail({
        entityManager: params.entityManager,
        enqueueSendMailJobService: params.enqueueSendMailJobService,
        userId: params.userId,
        template: "payment-failed",
        locale: params.locale,
        webBaseUrl: params.webBaseUrl,
        subject: {
            vi: "Thanh toán của bạn chưa hoàn tất", // vn-ok: vi-locale string emitted to clients
            en: "Your payment didn’t go through",
        },
    })
}

/** Params for {@link enqueueInstallmentDueEmail}. */
export interface InstallmentDueEmailParams extends GrantEmailParams {
    /** The minimum amount due, shown in the reminder copy. */
    minPaymentVnd: number
}

/**
 * Day-0 "your installment cycle is due" reminder. Best-effort -- fired once per
 * cycle by {@link import("@modules/bussiness").InstallmentPlanEnforcementCronService}
 * (idempotent via `InstallmentPlanEntity.dueRemindedAt`).
 */
export const enqueueInstallmentDueEmail = async (
    params: InstallmentDueEmailParams,
): Promise<void> => {
    await enqueueLearnerEmail({
        entityManager: params.entityManager,
        enqueueSendMailJobService: params.enqueueSendMailJobService,
        userId: params.userId,
        template: "installment-due",
        locale: params.locale,
        webBaseUrl: params.webBaseUrl,
        subject: {
            vi: "Kỳ thanh toán trả góp sắp đến hạn", // vn-ok: vi-locale string emitted to clients
            en: "Your installment payment is due soon",
        },
        extraContext: {
            minPaymentVnd: params.minPaymentVnd,
        },
    })
}

/** Params for {@link enqueueInstallmentFinalWarningEmail}. */
export interface InstallmentFinalWarningEmailParams extends GrantEmailParams {
    /** The minimum amount due, shown in the reminder copy. */
    minPaymentVnd: number
    /** Days remaining before course access locks, shown in the reminder copy. */
    daysUntilLockout: number
}

/**
 * Second (final-warning) reminder, sent `secondReminderAfterDays` past due --
 * "pay now or your course access gets locked in N days". Best-effort, fired
 * once per cycle (idempotent via `InstallmentPlanEntity.secondRemindedAt`).
 */
export const enqueueInstallmentFinalWarningEmail = async (
    params: InstallmentFinalWarningEmailParams,
): Promise<void> => {
    await enqueueLearnerEmail({
        entityManager: params.entityManager,
        enqueueSendMailJobService: params.enqueueSendMailJobService,
        userId: params.userId,
        template: "installment-final-warning",
        locale: params.locale,
        webBaseUrl: params.webBaseUrl,
        subject: {
            vi: "Sắp bị khoá quyền truy cập khóa học", // vn-ok: vi-locale string emitted to clients
            en: "Your course access is about to be locked",
        },
        extraContext: {
            minPaymentVnd: params.minPaymentVnd,
            daysUntilLockout: params.daysUntilLockout,
        },
    })
}

/** Params for {@link enqueueInstallmentDefaultedEmail}. */
export interface InstallmentDefaultedEmailParams extends GrantEmailParams {
    /** The minimum amount that was due, shown in the notice copy. */
    minPaymentVnd: number
}

/**
 * The plan just defaulted -- course access has been locked. Best-effort, fired
 * exactly once at the moment the enforcement cron flips the plan to `Defaulted`.
 */
export const enqueueInstallmentDefaultedEmail = async (
    params: InstallmentDefaultedEmailParams,
): Promise<void> => {
    await enqueueLearnerEmail({
        entityManager: params.entityManager,
        enqueueSendMailJobService: params.enqueueSendMailJobService,
        userId: params.userId,
        template: "installment-defaulted",
        locale: params.locale,
        webBaseUrl: params.webBaseUrl,
        subject: {
            vi: "Quyền truy cập khóa học đã bị tạm khoá", // vn-ok: vi-locale string emitted to clients
            en: "Your course access has been locked",
        },
        extraContext: {
            minPaymentVnd: params.minPaymentVnd,
        },
    })
}
