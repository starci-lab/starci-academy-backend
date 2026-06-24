import type {
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import {
    pickLocale,
} from "./pick-locale"

/** Params for {@link enqueueLearnerEmail}. */
export interface EnqueueLearnerEmailParams {
    /** Manager used to resolve the recipient user (read-only). */
    entityManager: EntityManager
    /** Mail enqueue service (BullMQ `send-mail`) — passed in by the caller. */
    enqueueSendMailJobService: EnqueueSendMailJobService
    /** Id of the learner to email. */
    userId: string
    /** Pug template name (without `.pug`). */
    template: string
    /** Localized subject line. */
    subject: {
        vi: string
        en: string
    }
    /** Base URL of the learner web app (exposed to the template as `dashboardUrl`). */
    webBaseUrl: string
    /** Recipient locale for subject + body copy (defaults to English). */
    locale?: Locale | null
    /** Extra template variables merged into the render context. */
    extraContext?: Record<string, unknown>
}

/**
 * Generic best-effort learner notification: resolve the recipient by id, then
 * enqueue a localized transactional email rendering the given Pug template.
 *
 * NEVER throws — designed to be fired AFTER a committed side effect (a graded
 * attempt, a payment, an access change), so a mail failure cannot fail the
 * already-finished work. Skips silently when the user has no email on file.
 *
 * The template always receives `{ name, dashboardUrl, locale }` plus any
 * `extraContext`. `name` falls back username → localized "you".
 *
 * This helper is a pure function (no DI): the caller injects and passes its own
 * {@link EnqueueSendMailJobService}, which keeps this module dependency-light
 * (runtime: `@modules/databases` only) so core modules can import it freely.
 */
export const enqueueLearnerEmail = async (
    params: EnqueueLearnerEmailParams,
): Promise<void> => {
    const {
        entityManager,
        enqueueSendMailJobService,
        userId,
        template,
        subject,
        webBaseUrl,
        locale,
        extraContext,
    } = params
    try {
        const user = await entityManager.findOne(
            UserEntity,
            {
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                },
            },
        )
        if (!user?.email) {
            return
        }
        await enqueueSendMailJobService.enqueue({
            to: [
                {
                    address: user.email,
                },
            ],
            subject: pickLocale(locale,
                subject),
            template,
            context: {
                name:
                    user.displayName ??
                    user.username ??
                    pickLocale(locale,
                        {
                            vi: "bạn",
                            en: "there",
                        }),
                dashboardUrl: webBaseUrl,
                locale: locale ?? Locale.En,
                ...extraContext,
            },
        })
    } catch {
        // best-effort notification — swallow any failure
    }
}
