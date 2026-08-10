import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    MilestoneTaskProgressQuery,
} from "./milestone-task-progress.query"
import {
    MilestoneTaskProgressResponseData,
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
    PersonalProjectProgressService,
} from "@modules/bussiness/progress/personal-project.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"

@QueryHandler(MilestoneTaskProgressQuery)
/**
 * CQRS handler for the `milestoneTaskProgress` query: resolves the viewer's
 * enrollment for the requested course, then delegates to
 * {@link PersonalProjectProgressService} for the cached/recomputed progress.
 */
export class MilestoneTaskProgressHandler
    extends ICQRSHandler<MilestoneTaskProgressQuery, MilestoneTaskProgressResponseData>
    implements IQueryHandler<MilestoneTaskProgressQuery, MilestoneTaskProgressResponseData>
{
    /**
     * Constructor.
     * @param entityManager - The primary PostgreSQL entity manager.
     * @param userService - Resolves the viewer.
     * @param personalProjectProgressService - Cached/recomputed milestone progress.
     */
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
        private readonly personalProjectProgressService: PersonalProjectProgressService,
    ) {
        super()
    }

    /**
     * @param query - Carries the request (courseId) and the authenticated user.
     * @returns Empty completion tasks (and a null current task) when the user
     * has no enrollment in the course.
     */
    protected override async process(
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
