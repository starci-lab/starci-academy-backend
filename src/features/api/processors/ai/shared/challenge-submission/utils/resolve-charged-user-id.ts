import type {
    EntityManager,
} from "typeorm"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    SubmissionOwnerMissingException,
} from "@modules/platform/exceptions/errors/submission-review/submission-owner-missing"
import type {
    AbstractSubmissionCompletionPayload,
} from "../abstract-submission-complete-step.service"

/**
 * Resolve who a graded challenge-submission completion is FOR -- the actual debit
 * (via {@link AiEntitlementService.consume}) and the learner notification both key off
 * this id, but neither writes it; this only identifies the owner.
 *
 * Shared between {@link AbstractSubmissionCompleteStepService} (on its transactional
 * entity manager, mid-transaction) and the post-commit collaborators that read after
 * the transaction has already committed (on their own, non-transactional entity manager)
 * -- the caller decides which manager is appropriate for its own moment.
 * @param entityManager - Entity manager to read with (transactional or not, per caller).
 * @param payload - Job payload carrying the submission id.
 * @returns The id of the user the submission belongs to.
 */
export async function resolveChargedUserId<
    TPayload extends AbstractSubmissionCompletionPayload,
>(
    entityManager: EntityManager,
    payload: TPayload,
): Promise<string> {
    const userChallengeSubmission = await entityManager.findOneOrFail(
        UserChallengeSubmissionEntity,
        {
            where: {
                id: payload.userChallengeSubmissionId,
            },
        },
    )
    // user_id is nullable after the enrollment-centric migration; an AI-graded
    // submission always has an owner -- guard so the caller stays typed.
    const submissionUserId = userChallengeSubmission.userId
    if (!submissionUserId) {
        throw new SubmissionOwnerMissingException({
            userChallengeSubmissionId: payload.userChallengeSubmissionId,
        })
    }
    return submissionUserId
}
