import {
    Injectable,
} from "@nestjs/common"
import {
    InjectQueue,
} from "@nestjs/bullmq"
import {
    Queue,
} from "bullmq"
import {
    ActionType,
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    JobEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    bullData,
    BullQueueName,
    InviteGithubPayload,
} from "@modules/bullmq"
import SuperJSON from "superjson"
import {
    EntityManager,
} from "typeorm"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
} from "../atomic"
import {
    CourseGithubTeamSlugNotMappedException,
    CourseNotFoundException,
} from "@modules/exceptions"

/**
 * Params for enqueueing a GitHub invite job.
 */
export interface EnqueueInviteGithubParams {
    /**
     * User ID to invite.
     */
    userId: string

    /**
     * Course ID used to resolve the GitHub team slug.
     */
    courseId: string

    /**
     * GitHub username to add to organization/team.
     */
    githubUsername: string
}

/**
 * Service for enqueuing a GitHub team invitation job.
 */
@Injectable()
export class EnqueueInviteGithubJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.InviteGithub].name)
        private readonly inviteGithubQueue: Queue<string>,
    ) {}

    /**
     * Enqueue a GitHub invitation job.
     * @param params - User ID and GitHub username to invite.
     * @returns The created job.
     */
    async enqueue(
        {
            userId,
            courseId,
            githubUsername,
        }: EnqueueInviteGithubParams,
    ): Promise<JobEntity> {
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id: courseId,
                },
            },
        )
        if (!course) {
            throw new CourseNotFoundException(
                {
                    id: courseId,
                },
            )
        }

        const courseSlug = course.displayId
        const teamSlug = envConfig().services.github.teamSlugsByCourseSlug[courseSlug]
        if (!teamSlug) {
            throw new CourseGithubTeamSlugNotMappedException(
                {
                    courseSlug,
                },
            )
        }

        // Create a new job record
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            actionType: ActionType.InviteGithub,
            maxSteps: 1,
            payload: this.superJson.stringify({
                userId,
                githubUsername,
                teamSlug,
            } as InviteGithubPayload),
        })

        // Push the job to the queue
        await this.inviteGithubQueue.add(
            job.id,
            job.payload,
            {
                jobId: job.id,
            },
        )

        return job
    }
}
