import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    MilestoneTaskProgressQuery,
} from "./milestone-task-progress.query"
import {
    MilestoneTaskProgressResponseData,
} from "./graphql-types"
import {
    InjectPrimaryPostgreSQLEntityManager,
    EnrollmentEntity,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    UserService,
    PersonalProjectProgressService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"

/**
 * CQRS handler for the `milestoneTaskProgress` query: resolves the viewer's
 * enrollment for the requested course, then delegates to
 * {@link PersonalProjectProgressService} for the cached/recomputed progress.
 */
@QueryHandler(MilestoneTaskProgressQuery)
export class MilestoneTaskProgressHandler
implements IQueryHandler<MilestoneTaskProgressQuery, MilestoneTaskProgressResponseData>
{
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
        private readonly personalProjectProgressService: PersonalProjectProgressService,
    ) {}

    /**
     * @param query - Carries the request (courseId) and the authenticated user.
     * @returns Empty completion tasks (and a null current task) when the user
     * has no enrollment in the course.
     */
    async execute(
        query: MilestoneTaskProgressQuery,
    ): Promise<MilestoneTaskProgressResponseData> {
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

        /** Delegate to the progress service (cache-first) */
        return this.personalProjectProgressService.getProgress({
            enrollmentId: enrollment.id,
            courseId,
        })
    }
}
