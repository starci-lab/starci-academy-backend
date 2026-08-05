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
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    EnqueueResolveGithubPayload,
} from "@modules/integrations/bullmq/types/payloads/resolve-github"
import SuperJSON from "superjson"
import {
    EntityManager,
} from "typeorm"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
} from "../atomic/job-action.service"
import {
    CourseGithubTeamSlugNotMappedException,
} from "@modules/platform/exceptions/errors/courses/course-github-team-slug-not-mapped"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    MissingRequiredParameterException,
} from "@modules/platform/exceptions/errors/stdlib/missing-required-parameter"
import {
    sleepEnqueueUxDelay,
} from "../utils/enqueue-ux-delay"
import type {
    EnqueueResolveGithubParams,
} from "../types/enqueue"

@Injectable()
/**
 * Service for enqueueing resolve-github jobs.
 */
export class EnqueueResolveGithubJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ResolveGithub].name)
        private readonly resolveGithubQueue: Queue<string>,
    ) {}

    /**
     * Enqueue a resolve-github job.
     * @param params - User ID and GitHub username to invite.
     * @returns The created job.
     */
    async enqueue(
        {
            userId,
            courseId,
            githubUsername,
            teamSlug: inputTeamSlug,
        }: EnqueueResolveGithubParams,
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

        const payload: EnqueueResolveGithubPayload = {
            userId,
            githubUsername,
            teamSlug,
        }

        // Create a new job record
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            userId,
            actionType: ActionType.ResolveGithub,
            maxSteps: 1,
            payload: this.superJson.stringify(payload),
        })

        // Push the job to the queue
        void sleepEnqueueUxDelay().then(() =>
            this.resolveGithubQueue.add(
                job.id,
                job.payload,
                {
                    jobId: job.id,
                },
            ),
        ).catch((error) =>
            this.jobActionService.failJob({
                job,
                error: `Failed to enqueue job to broker: ${error?.message ?? "unknown error"}`,
            }),
        )

        return job
    }
}

