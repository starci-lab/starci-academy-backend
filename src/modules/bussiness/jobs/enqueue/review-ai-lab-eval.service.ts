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
    JobEntity,
    JobCategory,
} from "@modules/databases"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    bullData,
    BullQueueName,
} from "@modules/bullmq"
import type {
    ReviewAiLabEvalPayload,
} from "@modules/bullmq"
import SuperJSON from "superjson"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
} from "../atomic"
import {
    sleepEnqueueUxDelay,
} from "../utils"
import type {
    EnqueueReviewAiLabEvalParams,
} from "../types"

/**
 * Service for enqueueing review-ai-lab-eval jobs.
 *
 * Mirrors {@link EnqueueReviewPersonalProjectTaskJobService}: it persists a job
 * row (so the FE can subscribe over the existing job-notifications socket) and
 * then enqueues the grading payload into BullMQ after a short UX delay.
 */
@Injectable()
export class EnqueueReviewAiLabEvalJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ReviewAiLabEval].name)
        private readonly queue: Queue<string>,
    ) { }

    /**
     * Persist a job row and enqueue the eval-grading payload into BullMQ.
     *
     * @param params - Eval run / set ids, learner + enrollment, submitted prompt
     *   template + params, locale, and the validated AI lane selection.
     * @returns The persisted job row (its id links back to the eval run).
     */
    async enqueue(
        params: EnqueueReviewAiLabEvalParams,
    ): Promise<JobEntity> {
        const {
            evalRunId,
            evalSetId,
            userId,
            enrollmentId,
            submittedSystemPrompt,
            submittedUserTemplate,
            params: runParams,
            locale,
            ai,
        } = params
        // assemble the worker payload; omit optional fields the caller did not set
        const payload: ReviewAiLabEvalPayload = {
            evalRunId,
            evalSetId,
            userId,
            enrollmentId,
            submittedUserTemplate,
            params: runParams,
            ...(submittedSystemPrompt !== undefined ? {
                submittedSystemPrompt,
            } : {
            }),
            ...(locale !== undefined ? {
                locale,
            } : {
            }),
            ...(ai !== undefined ? {
                ai,
            } : {
            }),
        }
        // persist the job row first so the eval run can link to it synchronously
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            userId,
            actionType: ActionType.ReviewAiLabEval,
            category: JobCategory.ReviewTask,
            maxSteps: 2,
            payload: this.superJson.stringify(payload),
        })
        // enqueue after a short delay so the UI can show the job before it starts
        void sleepEnqueueUxDelay().then(() =>
            this.queue.add(
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
