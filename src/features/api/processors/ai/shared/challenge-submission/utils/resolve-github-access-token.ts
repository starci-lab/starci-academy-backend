import type {
    EntityManager,
} from "typeorm"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import type {
    EncryptionService,
} from "@modules/crypto/encryption.service"

/** Params for {@link resolveGithubAccessToken}. */
export interface ResolveGithubAccessTokenParams {
    /** Entity manager the enrollment lookup runs on. */
    entityManager: EntityManager
    /** Decrypts a stored per-enrollment token. */
    encryptionService: EncryptionService
    /** Org-wide token to fall back to when the learner has none, or theirs fails to decrypt. */
    fallbackAccessToken: string
    /** Enrollment whose (possibly absent) personal token should authenticate the clone. */
    enrollmentId: string
}

/**
 * Resolve the GitHub access token to clone a submission repo with: the learner's own (decrypted)
 * per-enrollment token when they stored one for a PRIVATE repo, otherwise the org token. A token
 * that fails to decrypt falls back to the org token rather than aborting the grade. Shared between
 * challenge-submission grading and personal-project (milestone-task) grading -- one token per
 * enrollment covers both the challenge repo and the capstone repo.
 *
 * @param params - {@link ResolveGithubAccessTokenParams}
 * @returns The resolved access token.
 */
export const resolveGithubAccessToken = async (
    {
        entityManager,
        encryptionService,
        fallbackAccessToken,
        enrollmentId,
    }: ResolveGithubAccessTokenParams,
): Promise<string> => {
    const enrollment = await entityManager.findOne(
        EnrollmentEntity,
        {
            where: {
                id: enrollmentId,
            },
            select: {
                id: true,
                personalProjectGithubTokenEncrypted: true,
            },
        },
    )
    const encrypted = enrollment?.personalProjectGithubTokenEncrypted
    if (!encrypted) {
        return fallbackAccessToken
    }
    try {
        return encryptionService.decrypt({
            payload: JSON.parse(encrypted),
        })
    } catch {
        return fallbackAccessToken
    }
}
