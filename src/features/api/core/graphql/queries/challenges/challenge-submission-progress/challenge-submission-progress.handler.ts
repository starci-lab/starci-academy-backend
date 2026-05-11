import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ChallengeSubmissionProgressQuery,
} from "./challenge-submission-progress.query"
import {
    ChallengeSubmissionProgressResponseData,
} from "./graphql-types"
import {
    InjectPrimaryPostgreSQLEntityManager,
    EnrollmentEntity,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    ChallengeProgressService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"

@QueryHandler(ChallengeSubmissionProgressQuery)
export class ChallengeSubmissionProgressHandler
implements IQueryHandler<ChallengeSubmissionProgressQuery, ChallengeSubmissionProgressResponseData>
{
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly challengeProgressService: ChallengeProgressService,
    ) {}

    async execute(
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
                currentTask: null,  
            }
        }

        return this.challengeProgressService.getProgress({
            enrollmentId: enrollment.id,
            courseId,
        })
    }
}
