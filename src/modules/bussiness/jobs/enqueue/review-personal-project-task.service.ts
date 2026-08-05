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
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    JobCategory,
} from "@modules/databases/postgresql/primary/enums/job-category"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import type {
    ReviewPersonalProjectTaskPayload,
} from "@modules/integrations/bullmq/types/payloads/review-personal-project-task"
import SuperJSON from "superjson"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
} from "../atomic/job-action.service"
import {
    sleepEnqueueUxDelay,
} from "../utils/enqueue-ux-delay"
import type {
    EnqueueReviewPersonalProjectTaskParams,
} from "../types/enqueue"

@Injectable()
/**
 * Service for enqueueing review-personal-project-task jobs.
 */
export class EnqueueReviewPersonalProjectTaskJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ReviewPersonalProjectTask].name)
        private readonly queue: Queue<string>,
    ) { }

    /**
     * Persist a job row and enqueue the payload into BullMQ.
     */
    async enqueue(
        params: EnqueueReviewPersonalProjectTaskParams,
    ): Promise<JobEntity> {
        const {
            enrollmentId,
            githubUrl,
            taskId,
            branch,
            userId,
            locale,
            lang,
            ai,
        } = params
        const payload: ReviewPersonalProjectTaskPayload = {
            enrollmentId,
            githubUrl,
            taskId,
            branch: branch ?? "main",
            locale,
            ...(lang !== undefined ? {
                lang,
            } : {
            }),
            ...(ai !== undefined ? {
                ai,
            } : {
            }),
        }
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            userId,
            actionType: ActionType.ReviewPersonalProjectTask,
            category: JobCategory.ReviewTask,
            maxSteps: 2,
            payload: this.superJson.stringify(payload),
        })
        void sleepEnqueueUxDelay().then(() =>
            this.queue.add(
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
