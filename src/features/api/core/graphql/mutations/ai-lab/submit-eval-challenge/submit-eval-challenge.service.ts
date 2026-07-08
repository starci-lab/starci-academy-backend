import {
    createHash,
} from "node:crypto"
import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AiLabEvalRunEntity,
    AiLabEvalRunStatus,
    AiLabEvalSetEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    EnqueueReviewAiLabEvalJobService,
} from "@modules/bussiness"
import {
    flatFieldsToAiJobSelection,
} from "@modules/ai"
import {
    AiLabEvalSetNotFoundException,
} from "@modules/exceptions"
import type {
    SubmitEvalChallengeParams,
    SubmitEvalChallengeResult,
} from "./types"

/**
 * Thin GraphQL-layer service for the submitEvalChallenge mutation. It persists a
 * `Pending` eval run, enqueues the async grading job (whose worker fills in the
 * verdict), links the job back onto the run, and returns both ids. The actual
 * grading runs in the eval-runner processor; the FE subscribes to the job over
 * the existing job-notifications socket and polls `aiLabEvalResult` on complete.
 */
@Injectable()
export class SubmitEvalChallengeService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueReviewAiLabEvalJobService: EnqueueReviewAiLabEvalJobService,
    ) { }

    /**
     * Persist a Pending eval run, enqueue its grading job, and return both ids.
     *
     * @param params - The mutation input, learner id, and request locale.
     * @returns The created eval run id and the enqueued grading job id.
     * @throws AiLabEvalSetNotFoundException when the eval set does not exist.
     */
    async execute(
        {
            input,
            userId,
            locale,
        }: SubmitEvalChallengeParams,
    ): Promise<SubmitEvalChallengeResult> {
        const {
            evalSetId,
            enrollmentId,
            systemPrompt,
            userTemplate,
            params,
            selectedModel,
            selectedModelProvider,
        } = input
        // guard: the eval set must exist before we persist a run against it
        const evalSet = await this.entityManager.findOne(
            AiLabEvalSetEntity,
            {
                where: {
                    id: evalSetId,
                },
                select: {
                    id: true,
                },
            },
        )
        if (!evalSet) {
            throw new AiLabEvalSetNotFoundException({
                evalSetId,
            })
        }
        // collapse the loose model-pick fields into the selection (undefined → balancer picks)
        const ai = flatFieldsToAiJobSelection({
            selectedModel,
            selectedModelProvider,
        })
        // normalize the submitted params so the non-null jsonb column always has a value
        const submittedParams = params ?? {
        }
        // deterministic hash of every input that decides the verdict (prompts + params
        // + model pick)
        const submittedHash = createHash("sha256")
            .update(JSON.stringify({
                systemPrompt: systemPrompt ?? "",
                userTemplate,
                temperature: params?.temperature ?? null,
                topP: params?.topP ?? null,
                maxTokens: params?.maxTokens ?? null,
                model: selectedModel ?? null,
                provider: selectedModelProvider ?? null,
            }))
            .digest("hex")
        // verdict cache / dedupe: an identical resubmission (same eval set, learner,
        // and input hash) reuses the existing run + job instead of grading again
        const existing = await this.entityManager.findOne(
            AiLabEvalRunEntity,
            {
                where: {
                    evalSet: {
                        id: evalSetId,
                    },
                    user: {
                        id: userId,
                    },
                    submittedHash,
                },
            },
        )
        if (existing) {
            return {
                evalRunId: existing.id,
                jobId: existing.jobId,
            }
        }
        // persist the Pending eval run first so the enqueued job can link back to a real row
        const evalRun = this.entityManager.create(
            AiLabEvalRunEntity,
            {
                user: {
                    id: userId,
                },
                enrollment: {
                    id: enrollmentId,
                },
                evalSet: {
                    id: evalSetId,
                },
                // job is linked after the enqueue returns its id
                job: null,
                submittedSystemPrompt: systemPrompt ?? null,
                submittedUserTemplate: userTemplate,
                submittedParams,
                submittedHash,
                // model / provider are resolved by the grading worker
                model: null,
                provider: null,
                totalScore: 0,
                maxScore: 0,
                passed: false,
                status: AiLabEvalRunStatus.Pending,
            },
        )
        const savedEvalRun = await this.entityManager.save(evalRun)
        // enqueue the grading job (persists a job row + queues the payload)
        const job = await this.enqueueReviewAiLabEvalJobService.enqueue({
            evalRunId: savedEvalRun.id,
            evalSetId,
            userId,
            enrollmentId,
            ...(systemPrompt !== undefined ? {
                submittedSystemPrompt: systemPrompt,
            } : {
            }),
            submittedUserTemplate: userTemplate,
            params: submittedParams,
            locale,
            ...(ai !== undefined ? {
                ai,
            } : {
            }),
        })
        // link the grading job back onto the eval run so the verdict has a job reference
        await this.entityManager.update(
            AiLabEvalRunEntity,
            {
                id: savedEvalRun.id,
            },
            {
                job: {
                    id: job.id,
                },
            },
        )
        return {
            evalRunId: savedEvalRun.id,
            jobId: job.id,
        }
    }
}
