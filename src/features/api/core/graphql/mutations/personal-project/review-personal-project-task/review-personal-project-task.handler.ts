import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    EnqueueReviewPersonalProjectTaskJobService,
} from "@modules/bussiness"
import {
    ReviewPersonalProjectTaskCommand,
} from "./review-personal-project-task.command"
import {
    NoPersonalProjectTasksFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ReviewPersonalProjectTaskResponseData,
} from "./graphql-types"

@CommandHandler(ReviewPersonalProjectTaskCommand)
@Injectable()
export class ReviewPersonalProjectTaskHandler
    extends ICQRSHandler<ReviewPersonalProjectTaskCommand, ReviewPersonalProjectTaskResponseData>
    implements ICommandHandler<ReviewPersonalProjectTaskCommand, ReviewPersonalProjectTaskResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueReviewPersonalProjectTaskJobService: EnqueueReviewPersonalProjectTaskJobService,
    ) {
        super()
    }

    protected override async process(
        command: ReviewPersonalProjectTaskCommand,
    ): Promise<ReviewPersonalProjectTaskResponseData> {
        const { request, user, locale } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        /** Find enrollment from courseId + user */
        const enrollment = await this.entityManager.findOneOrFail(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    course: {
                        id: request.courseId,
                    },
                },
                select: {
                    id: true,
                },
            },
        )

        /** Resolve taskId: use provided or default to first milestone task (orderIndex 0) */
        let taskId = request.taskId
        if (!taskId) {
            const firstTask = await this.entityManager.findOne(
                MilestoneTaskEntity,
                {
                    where: {
                        milestone: {
                            course: {
                                id: request.courseId,
                            },
                        },
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                    select: {
                        id: true,
                    },
                },
            )
            if (!firstTask) {
                throw new NoPersonalProjectTasksFoundException({
                    courseId: request.courseId,
                    userId: user.id,
                })
            }
            taskId = firstTask.id
        }

        /** Update githubUrl on enrollment */
        enrollment.personalProjectGithubUrl = request.githubUrl
        await this.entityManager.save(
            EnrollmentEntity,
            enrollment
        )
        /** Enqueue grading job */
        const job = await this.enqueueReviewPersonalProjectTaskJobService.enqueue({
            taskId,
            branch: request.branch,
            userId: user.id,
            locale,
            enrollmentId: enrollment.id,
            githubUrl: request.githubUrl,
        })
        return {
            jobId: job.id,
        }
    }
}
