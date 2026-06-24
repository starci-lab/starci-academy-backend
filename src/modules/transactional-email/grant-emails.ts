import type {
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    Locale,
} from "@modules/databases"
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

/**
 * Email the buyer that their paid AI tier is now active. Best-effort — call
 * ONLY when {@link AiEntitlementService.grantTier} returned `true` (a new grant),
 * so payment-webhook retries / reconcile polls never re-notify.
 */
export const enqueueSubscriptionActiveEmail = async (
    params: GrantEmailParams & { tier?: string | null },
): Promise<void> => {
    await enqueueLearnerEmail({
        entityManager: params.entityManager,
        enqueueSendMailJobService: params.enqueueSendMailJobService,
        userId: params.userId,
        template: "subscription-active",
        locale: params.locale,
        webBaseUrl: params.webBaseUrl,
        subject: {
            vi: "Gói AI của bạn đã được kích hoạt",
            en: "Your AI plan is now active",
        },
        extraContext: {
            tier: params.tier ?? null,
        },
    })
}

/**
 * Email the buyer that their community membership is now active. Best-effort —
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
            vi: "Chào mừng bạn trở thành thành viên",
            en: "Welcome to membership",
        },
    })
}

/**
 * Email the buyer that a payment did not complete (the transaction was marked
 * unpaid). Best-effort — call when a pending transaction terminally fails.
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
            vi: "Thanh toán của bạn chưa hoàn tất",
            en: "Your payment didn’t go through",
        },
    })
}
