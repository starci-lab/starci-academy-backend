import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    BullQueueName,
    bullData,
} from "@modules/bullmq"
import type {
    ProcessPersonalProjectPayload,
} from "@modules/bullmq"
import {
    ActionType,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    PersonalProjectAttemptEntity,
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
    InjectQueue,
} from "@nestjs/bullmq"
import type {
    Queue,
} from "bullmq"
import {
    InjectSuperJson,
} from "@modules/mixin"
import SuperJSON from "superjson"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    v4 as uuidv4,
} from "uuid"
import {
    ReviewPersonalProjectForTaskCommand,
} from "./review-personal-project-for-task.command"

@CommandHandler(ReviewPersonalProjectForTaskCommand)
@Injectable()
export class ReviewPersonalProjectForTaskHandler
    extends ICQRSHandler<ReviewPersonalProjectForTaskCommand, PersonalProjectAttemptEntity>
    implements ICommandHandler<ReviewPersonalProjectForTaskCommand, PersonalProjectAttemptEntity> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectQueue(bullData[BullQueueName.ProcessPersonalProject].name)
        private readonly queue: Queue,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly jobActionService: JobActionService,
    ) {
        super()
    }

    protected override async process(
        command: ReviewPersonalProjectForTaskCommand,
    ): Promise<PersonalProjectAttemptEntity> {
        const { request, user } = command.params

        /** Update githubUrl on enrollment */
        const enrollment = await this.entityManager.findOneOrFail(
            EnrollmentEntity,
            {
                where: {
                    id: request.enrollmentId,
                },
            },
        )
        enrollment.personalProjectGithubUrl = request.githubUrl
        await this.entityManager.save(
            EnrollmentEntity,
            enrollment
        )

        /** Count existing attempts to determine attempt number */
        const existingAttempts = await this.entityManager.count(
            PersonalProjectAttemptEntity,
            {
                where: {
                    enrollmentId: request.enrollmentId,
                },
            },
        )

        /** Create new attempt */
        const attempt = await this.entityManager.save(
            PersonalProjectAttemptEntity,
            {
                enrollmentId: request.enrollmentId,
                attemptNumber: existingAttempts + 1,
                submissionUrl: request.githubUrl,
            } as Partial<PersonalProjectAttemptEntity>,
        )

        /** Enqueue grading job */
        const payload: ProcessPersonalProjectPayload = {
            attemptId: attempt.id,
            branch: request.branch ?? "main",
        }

        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            maxSteps: 2,
            actionType: ActionType.ProcessPersonalProject,
            payload: this.superJson.stringify(payload),
            userId: user?.id,
        })

        await this.queue.add(
            job.id,
            this.superJson.stringify(payload),
            {
                jobId: job.id,
            },
        )

        return attempt
    }
}
