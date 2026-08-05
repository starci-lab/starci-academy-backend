import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
    UserMilestoneTaskAttemptEntity,
    UserMilestoneTaskAttemptFeedbackEntity,
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
    UserMilestoneTaskFeedbacksQuery,
} from "./user-milestone-task-feedbacks.query"
import {
    UserMilestoneTaskFeedbacksResponseData,
    UserMilestoneTaskFeedbacksSortBy,
} from "./graphql-types"
import {
    UserNotFoundException,
} from "@modules/exceptions"

@QueryHandler(UserMilestoneTaskFeedbacksQuery)
@Injectable()
/**
 * Resolves the caller's latest attempt for course+task, then pages its feedback
 * rows; empty page when not enrolled / no attempts yet.
 */
export class UserMilestoneTaskFeedbacksHandler
    extends ICQRSHandler<UserMilestoneTaskFeedbacksQuery, UserMilestoneTaskFeedbacksResponseData>
    implements IQueryHandler<UserMilestoneTaskFeedbacksQuery, UserMilestoneTaskFeedbacksResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: UserMilestoneTaskFeedbacksQuery,
    ): Promise<UserMilestoneTaskFeedbacksResponseData> {
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
        const latestAttemptId = await this.resolveLatestAttemptId(
            user,
            courseId,
            taskId,
        )
        if (!latestAttemptId) {
            return {
                data: [],
                count: 0,
            }
        }
        const order: FindOptionsOrder<UserMilestoneTaskAttemptFeedbackEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as UserMilestoneTaskFeedbacksSortBy] = sort.order
        }
        const [
            data,
            count,
        ] = await this.entityManager.findAndCount(
            UserMilestoneTaskAttemptFeedbackEntity,
            {
                where: {
                    attempt: {
                        id: latestAttemptId,
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

    private async resolveLatestAttemptId(
        user: UserEntity,
        courseId: string,
        taskId: string,
    ): Promise<string | undefined> {
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
            return undefined
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
            return undefined
        }
        const latestAttempt = await this.entityManager.findOne(
            UserMilestoneTaskAttemptEntity,
            {
                where: {
                    userMilestoneTask: {
                        id: userMilestoneTask.id,
                    },
                },
                order: {
                    attemptNumber: "DESC",
                },
                select: {
                    id: true,
                    attemptNumber: true,
                },
            },
        )
        return latestAttempt?.id
    }
}
