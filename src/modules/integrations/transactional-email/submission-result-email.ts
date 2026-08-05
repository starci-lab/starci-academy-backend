import type {
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    Locale,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import {
    pickLocale,
} from "./pick-locale"

/** Params for {@link enqueueSubmissionResultEmail}. */
export interface EnqueueSubmissionResultEmailParams {
    /** Manager used to load the recipient + challenge (read-only). */
    entityManager: EntityManager
    /** Mail enqueue service (BullMQ `send-mail`). */
    enqueueSendMailJobService: EnqueueSendMailJobService
    /** The graded user-challenge-submission. */
    userChallengeSubmissionId: string
    /** Final score (0–100) of the attempt. */
    score: number
    /** Short, human-readable feedback shown in the email body. */
    feedback?: string | null
    /** Base URL of the learner web app, used for the "View dashboard" link. */
    webBaseUrl: string
    /** Recipient locale for subject + body copy (defaults to English). */
    locale?: Locale | null
}

/**
 * Best-effort: email the learner their graded challenge result (score + short
 * feedback) with a link back to the dashboard. Renders the `submission-result`
 * Pug template. Unlike {@link enqueueLearnerEmail} this loads the challenge
 * title via the submission relation.
 *
 * NEVER throws — fired AFTER the grading transaction commits, so a mail failure
 * cannot fail an already-finished grading job. Skips silently when the
 * recipient email or the challenge title cannot be resolved.
 */
export const enqueueSubmissionResultEmail = async (
    params: EnqueueSubmissionResultEmailParams,
): Promise<void> => {
    const {
        entityManager,
        enqueueSendMailJobService,
        userChallengeSubmissionId,
        score,
        feedback,
        webBaseUrl,
        locale,
    } = params
    try {
        const userChallengeSubmission = await entityManager.findOne(
            UserChallengeSubmissionEntity,
            {
                where: {
                    id: userChallengeSubmissionId,
                },
                relations: {
                    user: true,
                    submission: {
                        challenge: true,
                    },
                },
            },
        )
        const email = userChallengeSubmission?.user?.email
        const challengeTitle = userChallengeSubmission?.submission?.challenge?.title
        if (!email || !challengeTitle) {
            return
        }
        await enqueueSendMailJobService.enqueue({
            to: [
                {
                    address: email,
                },
            ],
            subject: pickLocale(locale,
                {
                    vi: `Bài nộp đã được chấm: ${challengeTitle}`, // vn-ok: vi-locale string emitted to clients
                    en: `Your submission was graded: ${challengeTitle}`,
                }),
            template: "submission-result",
            context: {
                name:
                    userChallengeSubmission?.user?.displayName ??
                    userChallengeSubmission?.user?.username ??
                    pickLocale(locale,
                        {
                            vi: "bạn", // vn-ok: vi-locale string emitted to clients
                            en: "there",
                        }),
                challengeTitle,
                score,
                feedback: feedback ?? "",
                dashboardUrl: webBaseUrl,
                locale: locale ?? Locale.En,
            },
        })
    } catch {
        // best-effort notification — swallow any failure
    }
}
