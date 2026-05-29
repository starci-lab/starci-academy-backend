import {
    JobActionService,
    JobStalledService
} from "../atomic"
import {
    Injectable,
} from "@nestjs/common"
import {
    ActionType,
    JobEntity
} from "@modules/databases"
import {
    InjectSuperJson
} from "@modules/mixin"
import SuperJSON from "superjson"
import {
    v4 as uuidv4
} from "uuid"
import {
    Queue
} from "bullmq"
import {
    InjectQueue
} from "@nestjs/bullmq"
import {
    bullData,
    BullQueueName
} from "@modules/bullmq"
import {
    EnqueueEnrollJobParams
} from "../types"
import {
    envConfig 
} from "@modules/env"
import {
    sleepEnqueueUxDelay,
} from "../utils"

/**
 * Service for enqueuing an enroll job.
 */
@Injectable()
export class EnqueueEnrollJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        private readonly jobStalledService: JobStalledService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.Enroll].name)
        private readonly enrollQueue: Queue<string>,
    ) { }

    /**
     * Enqueue an enroll job.
     * @param params - The parameters for enqueuing an enroll job.
     * @param params.userId - The ID of the user to enroll.
     * @param params.courseId - The ID of the course to enroll in.
     * @param params.jobId - The ID of the job to requeue.
     * @returns The job.
     */
    async enqueue(
        {
            transactionId,
            userId,
            courseId,
            jobId,
        }: EnqueueEnrollJobParams,
    ) {
        // get the job record
        let job: JobEntity | null = null
        if (jobId) {
            // requeue the job
            job = await this.jobStalledService.requeueJob(
                {
                    id: jobId,
                }
            )
        } else {
            // create a new job record
            job = await this.jobActionService.createJob({
                id: uuidv4(),
                userId,
                actionType: ActionType.Enroll,
                maxSteps: envConfig().job.enroll.maxSteps,
                payload: this.superJson.stringify(
                    {
                        transactionId,
                        userId,
                        courseId,
                    }
                ),
            })
        }
        // push the job to the queue (UX delay immediately before BullMQ so DB work is not stalled)
        void sleepEnqueueUxDelay().then(() =>
            this.enrollQueue.add(
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