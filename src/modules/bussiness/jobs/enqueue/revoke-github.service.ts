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
    EnqueueRevokeGithubPayload,
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
    MissingRequiredParameterException,
} from "@modules/exceptions"
import {
    sleepEnqueueUxDelay,
} from "../utils"
import type {
    EnqueueRevokeGithubParams,
} from "../types"

/**
 * Service for enqueueing revoke-github jobs (removes a user from a course team).
 */
@Injectable()
export class EnqueueRevokeGithubJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.RevokeGithub].name)
        private readonly revokeGithubQueue: Queue<string>,
    ) {}

    /**
     * Enqueue a revoke-github job.
     * @param params - User ID and GitHub username to remove from the team.
     * @returns The created job.
     */
    async enqueue(
        {
            userId,
            courseId,
            githubUsername,
            teamSlug: inputTeamSlug,
        }: EnqueueRevokeGithubParams,
    ): Promise<JobEntity> {
        let teamSlug = inputTeamSlug
        if (!teamSlug) {
            if (!courseId) {
                throw new MissingRequiredParameterException(
                    {
                        parameter: "courseId",
                    },
                )
            }
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
            teamSlug = envConfig().services.github.teamSlugsByCourseSlug[courseSlug]
            if (!teamSlug) {
                throw new CourseGithubTeamSlugNotMappedException(
                    {
                        courseSlug,
                    },
                )
            }
        }

        const payload: EnqueueRevokeGithubPayload = {
            userId,
            githubUsername,
            teamSlug,
        }

        // Create a new job record
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            userId,
            actionType: ActionType.RevokeGithub,
            maxSteps: 1,
            payload: this.superJson.stringify(payload),
        })

        // Push the job to the queue
        void sleepEnqueueUxDelay().then(() =>
            this.revokeGithubQueue.add(
                job.id,
                job.payload,
                {
                    jobId: job.id,
                },
            ),
        )

        return job
    }
}
