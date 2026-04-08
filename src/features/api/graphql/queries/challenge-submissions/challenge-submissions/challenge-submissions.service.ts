import {
    ChallengeSubmissionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionEntity,
    UserEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    In,
    type EntityManager,
    type FindOptionsOrder,
} from "typeorm"
import {
    ChallengeSubmissionsRequest,
    ChallengeSubmissionsResponseData,
    ChallengeSubmissionsSortBy,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../types"

/**
 * Loads all challenge submissions for a challenge; sets userSubmission per row for the current user.
 */
@Injectable()
export class ChallengeSubmissionsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Loads all challenge submissions for a challenge; sets userSubmission per row for the current user.
     * @param request - The request object containing the challenge ID and sorts.
     * @param user - The user object.
     * @returns The challenge submissions data.
     */
    async execute(
        {
            request: {
                challengeId,
                filters: {
                    sorts,
                },
            },
            user,
        }: ExecuteParams<ChallengeSubmissionsRequest>,
    ): Promise<ChallengeSubmissionsResponseData> {
        try {
            const order: FindOptionsOrder<ChallengeSubmissionEntity> = {
            }
            for (const sort of sorts) {
                order[sort.by as ChallengeSubmissionsSortBy] = sort.order
            }
            const challengeSubmissions = await this.entityManager.find(
                ChallengeSubmissionEntity,
                {
                    where: {
                        challenge: {
                            id: challengeId,
                        },
                    },
                    order,
                    relations: {
                        translations: true,
                        challenge: true,
                    },
                },
            )
            if (user && challengeSubmissions.length) {
                await this.attachUserSubmissionForCurrentUser(
                    challengeSubmissions,
                    user,
                )
            }
            return {
                data: challengeSubmissions,
            }
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    /**
     * Attaches the user submission for the current user to the submissions.
     * @param submissions - The submissions to attach the user submission to.
     * @param user - The user object.
     * @returns The submissions with the user submission attached.
     */
    private async attachUserSubmissionForCurrentUser(
        submissions: Array<ChallengeSubmissionEntity>,
        user: UserEntity,
    ): Promise<void> {
        const submissionIds = submissions.map((s) => s.id)
        const joins = await this.entityManager.find(
            UserChallengeSubmissionEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    submission: {
                        id: In(submissionIds),
                    },
                },
            },
        )
        const bySubmissionId = new Map(
            joins.map((join) => [
                join.submissionId,
                join,
            ]),
        )
        for (const submission of submissions) {
            submission.userSubmission = bySubmissionId.get(submission.id)
        }
    }
}
