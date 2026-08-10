import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ChallengeSubmissionProgressQuery,
} from "./challenge-submission-progress.query"
import {
    ChallengeSubmissionProgressResponseData,
} from "./graphql-types/response"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    EntityManager,
} from "typeorm"
import {
    ChallengeProgressService,
} from "@modules/bussiness/progress/challenge.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"

@QueryHandler(ChallengeSubmissionProgressQuery)
/**
 * CQRS handler for the `challengeSubmissionProgress` query: resolves the
 * viewer's enrollment for the requested course, then delegates to
 * {@link ChallengeProgressService} for the cached/recomputed progress.
 */
export class ChallengeSubmissionProgressHandler
    extends ICQRSHandler<ChallengeSubmissionProgressQuery, ChallengeSubmissionProgressResponseData>
    implements IQueryHandler<ChallengeSubmissionProgressQuery, ChallengeSubmissionProgressResponseData>
{
    /**
     * Constructor.
     * @param entityManager - The primary PostgreSQL entity manager.
     * @param challengeProgressService - Cached/recomputed challenge progress.
     */
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly challengeProgressService: ChallengeProgressService,
    ) {
        super()
    }

    /**
     * @param query - Carries the request (courseId) and the authenticated user.
     * @returns Empty completion tasks when the user has no enrollment in the course.
     */
    protected override async process(
        query: ChallengeSubmissionProgressQuery,
    ): Promise<ChallengeSubmissionProgressResponseData> {
        const { request, user } = query.params
        const { courseId } = request
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        /** Find enrollment */
        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    course: {
                        id: courseId,
                    },
                },
                select: {
                    id: true,
                },
            },
        )
        if (!enrollment) {
            return {
                completionTasks: [],
            }
        }

        return this.challengeProgressService.getProgress({
            enrollmentId: enrollment.id,
            courseId,
        })
    }
}
