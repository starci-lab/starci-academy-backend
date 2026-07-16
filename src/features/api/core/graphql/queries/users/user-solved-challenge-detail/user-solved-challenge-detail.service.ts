import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    UserChallengeSubmissionNotFoundException,
} from "@modules/exceptions"
import {
    UserSolvedChallengeDetailData,
    UserSolvedChallengeDetailRequest,
} from "./graphql-types"

/**
 * Live read of a single passed challenge submission's detail, scoped to the
 * TARGET user (`request.userId`, the profile owner) rather than the caller —
 * this backs the public profile's submission-detail surface, unlike
 * {@link ChallengeSubmissionQueryService} which scopes to the caller. Visibility
 * for locked profiles is enforced upstream by
 * {@link GraphQLProfileVisibilityGuard} on the resolver, not here.
 */
@Injectable()
export class UserSolvedChallengeDetailService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    async execute(
        request: UserSolvedChallengeDetailRequest,
    ): Promise<UserSolvedChallengeDetailData> {
        const {
            userId,
            submissionId,
        } = request

        const userSubmission = await this.entityManager.findOne(
            UserChallengeSubmissionEntity,
            {
                where: {
                    id: submissionId,
                    // scope by the TARGET user, not the caller — this is the
                    // public-profile detail read
                    user: {
                        id: userId,
                    },
                },
                relations: {
                    submission: {
                        challenge: {
                            content: {
                                module: {
                                    course: true,
                                },
                            },
                        },
                    },
                    attempts: {
                        feedbacks: true,
                    },
                },
            },
        )

        if (!userSubmission) {
            throw new UserChallengeSubmissionNotFoundException({
                userChallengeSubmissionId: submissionId,
                userId,
            })
        }

        // the "passing" attempt: graded + score > 0, newest such attempt — same
        // predicate the solved-challenges projection uses (buildPassedAttemptsSubquery),
        // so score/passedAt/feedbacks here mirror what set the list's passedAt.
        const passingAttempt = (userSubmission.attempts ?? [])
            .filter((attempt) => (attempt.score ?? 0) > 0 && attempt.processedAt !== null)
            .sort((a, b) => (b.processedAt?.getTime() ?? 0) - (a.processedAt?.getTime() ?? 0))
            .at(0) ?? null

        const challenge = userSubmission.submission?.challenge ?? null
        const course = challenge?.content?.module?.course ?? null

        return {
            id: userSubmission.id,
            title: challenge?.title ?? userSubmission.submission?.title,
            submissionUrl: userSubmission.submissionUrl,
            submissionType: userSubmission.submission?.type,
            selectedLang: userSubmission.selectedLang ?? null,
            difficulty: challenge?.difficulty ?? null,
            score: passingAttempt?.score ?? null,
            courseTitle: course?.title ?? null,
            passedAt: passingAttempt?.processedAt ?? null,
            feedbacks: (passingAttempt?.feedbacks ?? [])
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((feedback) => ({
                    message: feedback.message,
                    detail: feedback.detail,
                    severity: feedback.severity,
                    location: feedback.location,
                    suggestion: feedback.suggestion,
                })),
        }
    }
}
