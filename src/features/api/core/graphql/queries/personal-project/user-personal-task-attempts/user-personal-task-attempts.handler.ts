import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserMilestoneTaskAttemptEntity,
    UserMilestoneTaskEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    type EntityManager,
    type FindOptionsOrder,
} from "typeorm"
import {
    UserPersonalTaskAttemptsQuery,
} from "./user-personal-task-attempts.query"
import {
    UserPersonalTaskAttemptsResponseData,
    UserPersonalTaskAttemptsSortBy,
} from "./graphql-types"
import {
    UserNotFoundException,
} from "@modules/exceptions"

@QueryHandler(UserPersonalTaskAttemptsQuery)
@Injectable()
/**
 * Pages the caller's UserMilestoneTaskAttempt rows for a course+task via
 * enrollment → userMilestoneTask; empty when not enrolled / no task progress.
 */
export class UserPersonalTaskAttemptsHandler
    extends ICQRSHandler<UserPersonalTaskAttemptsQuery, UserPersonalTaskAttemptsResponseData>
    implements IQueryHandler<UserPersonalTaskAttemptsQuery, UserPersonalTaskAttemptsResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: UserPersonalTaskAttemptsQuery,
    ): Promise<UserPersonalTaskAttemptsResponseData> {
        const {
            user,
            request: {
                courseId,
                taskId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
        } = query.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const order: FindOptionsOrder<UserMilestoneTaskAttemptEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as UserPersonalTaskAttemptsSortBy] = sort.order
        }
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
                data: [],
                count: 0,
            }
        }
        const userMilestoneTask = await this.entityManager.findOne(
            UserMilestoneTaskEntity,
            {
                where: {
                    enrollment: {
                        id: enrollment.id,
                    },
                    milestoneTask: {
                        id: taskId,
                    },
                },
                select: {
                    id: true,
                },
            },
        )
        if (!userMilestoneTask) {
            return {
                data: [],
                count: 0,
            }
        }
        const [
            data,
            count,
        ] = await this.entityManager.findAndCount(
            UserMilestoneTaskAttemptEntity,
            {
                where: {
                    userMilestoneTask: {
                        id: userMilestoneTask.id,
                    },
                },
                order,
                skip: pageNumber * limit,
                take: limit,
            },
        )
        return {
            data,
            count,
        }
    }
}
