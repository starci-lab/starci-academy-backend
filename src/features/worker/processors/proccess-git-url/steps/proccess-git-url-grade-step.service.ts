import type {
    ProccessGitUrlPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    ChatGoogleGenerativeAI,
} from "@langchain/google-genai"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "../../abstracts"
import type {
    JobContext,
} from "../../types"
import type {
    ProccessGitUrlPipelineContext,
} from "../types"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"

function clampScore(
    value: number,
): number {
    return Math.min(
        20,
        Math.max(
            1,
            Math.round(value),
        ),
    )
}

function parseScoreFromModelText(text: string): number {
    const brace = text.match(/\{[\s\S]*?\}/)
    if (brace) {
        try {
            const parsed = JSON.parse(brace[0]) as {
                score?: unknown
            }
            if (typeof parsed.score === "number") {
                return clampScore(parsed.score)
            }
            if (typeof parsed.score === "string") {
                const n = Number.parseInt(
                    parsed.score,
                    10,
                )
                if (!Number.isNaN(n)) {
                    return clampScore(n)
                }
            }
        } catch {
            // fall through
        }
    }
    const m = text.match(/\b([12]?\d|20)\b/)
    if (m) {
        return clampScore(Number.parseInt(
            m[1],
            10,
        ))
    }
    throw new Error(
        "Could not parse a numeric score (1–20) from the grading model output.",
    )
}

/**
 * Step 4: grade with Gemini using DB prompts, then update `user_challenge_submissions`.
 */
@Injectable()
export class ProccessGitUrlGradeStepService extends AbstractStepService<ProccessGitUrlPayload> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    stepIndex = 4

    stepName = "grade-and-persist"

    async process(
        context: JobContext<ProccessGitUrlPayload>,
    ): Promise<void> {
        const pipeline = context as ProccessGitUrlPipelineContext
        await this.execute(pipeline)
        await this.finalize(pipeline)
    }

    private async execute(
        context: ProccessGitUrlPipelineContext,
    ): Promise<void> {
        const chunks = context.chunks
        const prompts = context.gradingPrompts
        const ucs = context.userChallengeSubmission
        if (!chunks?.length) {
            throw new Error(
                "No source chunks available for grading.",
            )
        }
        if (!prompts?.length) {
            throw new Error(
                "No grading prompts loaded from the database.",
            )
        }
        if (!ucs) {
            throw new Error(
                "User challenge submission row missing from context.",
            )
        }
        const cfg = envConfig().services.githubWorker.processGitUrl
        if (!cfg.genAiApiKey?.trim()) {
            throw new Error(
                "GITHUB_WORKER_PROCESS_GIT_URL_GENAI_API_KEY is not configured.",
            )
        }
        const maxChars = cfg.gradingMaxSourceChars
        let sourceExcerpt = chunks.map((c) => c.pageContent).join("\n\n")
        if (sourceExcerpt.length > maxChars) {
            sourceExcerpt = sourceExcerpt.slice(
                0,
                maxChars,
            )
        }
        const rubric = prompts.map(
            (
                p,
                i,
            ) => {
                const label = p.name
                    ? ` (${p.name})`
                    : ""
                return `### Criterion ${i + 1}${label}\n${p.promptEn}`
            },
        ).join("\n\n")
        const systemText = [
            "You are an expert reviewer grading a learner's homework repository for a programming course.",
            "Apply the following rubric (stored in the course database).",
            "",
            rubric,
            "",
            "Respond with JSON only — no markdown fences, no extra text. Shape:",
            "{\"score\": <integer from 1 to 20>}",
            "The score must be a whole number from 1 (poor) to 20 (excellent) following the rubric.",
        ].join("\n")
        const humanText = [
            "Below is an excerpt of files loaded from the submitted GitHub repository (may be truncated):",
            "",
            sourceExcerpt,
        ].join("\n")
        const model = new ChatGoogleGenerativeAI({
            model: cfg.gradingModel,
            apiKey: cfg.genAiApiKey,
        })
        const response = await model.invoke(
            [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
        )
        const raw = typeof response.content === "string"
            ? response.content
            : String(response.content)
        const score = parseScoreFromModelText(raw)
        context.score = score
        const row = await this.entityManager.findOne(
            UserChallengeSubmissionEntity,
            {
                where: {
                    id: ucs.id,
                },
            },
        )
        if (!row) {
            throw new Error(
                "User challenge submission row no longer exists.",
            )
        }
        row.score = score
        row.processed = true
        row.processedAt = new Date()
        row.attempts = row.attempts + 1
        await this.entityManager.save(
            UserChallengeSubmissionEntity,
            row,
        )
    }

    private async finalize(
        context: ProccessGitUrlPipelineContext,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        const score = context.score
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob(
                    {
                        job,
                        entityManager,
                    },
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult: {
                            score,
                        },
                        entityManager,
                    },
                )
            },
        )
        this.winstonService.log(
            WinstonLog.ProcessGitUrlStepExecuted,
            {
                jobId: job.id ?? "",
                queueName,
                step: this.stepName,
                stepIndex: this.stepIndex,
                payload,
                success: true,
                meta: {
                    score,
                },
            },
        )
    }
}
