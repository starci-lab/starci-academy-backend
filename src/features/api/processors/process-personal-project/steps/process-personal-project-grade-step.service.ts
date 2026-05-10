import type {
    ProcessPersonalProjectPayload,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    ModelProvider,
    PersonalProjectAttemptEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    envConfig,
} from "@modules/env"
import {
    ModelService,
} from "@modules/langchain"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    GithubRepoLoader,
} from "@langchain/community/document_loaders/web/github"
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import {
    MountStorageService,
} from "@modules/filesystem"

/**
 * Step 0: Load GitHub repo → split → build prompt from passCriteria → LLM grades.
 */
@Injectable()
export class ProcessPersonalProjectGradeStepService extends AbstractStepService<
    ProcessPersonalProjectPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly mountStorageService: MountStorageService,
        private readonly modelService: ModelService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "grade"

    /** Process the step. */
    async process(
        context: JobExtendedContext<ProcessPersonalProjectPayload, EmptyObject>,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(
                context,
            )
            await this.finalize(
                executionResult,
                context,
            )
        } catch (error) {
            await this.jobActionService.failJob(
                {
                    job: context.job,
                    error: error.message,
                    emitChangeEvent: false,
                },
            )
            throw error
        }
    }

    /**
     * Execute the step.
     */
    private async execute(
        context: JobExtendedContext<ProcessPersonalProjectPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        const { payload } = context
        const branch = payload.branch ?? "main"

        /** Load attempt and related data */
        const attempt = await this.entityManager.findOneOrFail(
            PersonalProjectAttemptEntity,
            {
                where: { id: payload.attemptId },
            },
        )
        const enrollment = await this.entityManager.findOneOrFail(
            EnrollmentEntity,
            {
                where: { id: attempt.enrollmentId },
                relations: {
                    tasks: {
                        criteria: true,
                    },
                },
            },
        )

        /**
         * Collect criteria from flat task entities.
         */
        const passCriteria: Array<{ text: string, promptText: string, orderIndex: number }> = []
        for (const task of (enrollment.tasks ?? [])) {
            for (const criteria of (task.criteria ?? [])) {
                passCriteria.push({
                    text: criteria.text ?? "",
                    promptText: criteria.promptText ?? "",
                    orderIndex: criteria.orderIndex ?? 0,
                })
            }
        }

        const repoUrl = attempt.submissionUrl ?? ""

        /** Load GitHub repo */
        const gitLoader = new GithubRepoLoader(
            repoUrl,
            {
                branch,
                recursive: true,
                accessToken: this.mountStorageService.githubAccessToken,
                verbose: false,
                ignorePaths: [
                    "package-lock.json",
                    "dist",
                    "node_modules",
                    ".git",
                ],
            },
        )
        const loadedDocs = await gitLoader.load()

        /** Split */
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.githubWorker.processGitSubmission.chunkSize,
            chunkOverlap: envConfig().services.githubWorker.processGitSubmission.chunkOverlap,
        })
        const chunks = await splitter.splitDocuments(loadedDocs)

        /** Build source excerpt */
        let sourceExcerpt = chunks
            .map((chunk) => chunk.pageContent)
            .join("\n\n")
        const maxChars = envConfig().services.githubWorker.processGitSubmission.gradingMaxSourceChars
        if (sourceExcerpt.length > maxChars) {
            sourceExcerpt = sourceExcerpt.slice(0, maxChars)
        }

        /** Build criteria prompt sections from passCriteria promptText */
        const criteriaPromptSections = passCriteria
            .filter((c) => c.promptText && c.promptText.trim())
            .map(
                (criterion, index) =>
                    `### Criterion ${index + 1}\nDisplay text: ${criterion.text}\nGrading prompt: ${criterion.promptText}`,
            )
            .join("\n\n")

        const totalCriteria = passCriteria.length
        const maxScore = totalCriteria * 10

        const systemText = [
            "You are a senior engineer reviewing a learner's personal project GitHub repository.",
            "Review the code against the milestone pass criteria below.",
            "Focus on implementation completeness — NOT code style. Identify what is missing or wrong.",
            "",
            "### Pass Criteria (each worth up to 10 points)",
            criteriaPromptSections || "(no criteria provided)",
            "",
            `Total max score: ${maxScore}`,
            "",
            "Respond with JSON only — no markdown fences, no extra text.",
            "Shape:",
            `{"score": <integer 0 to ${maxScore}>, "shortFeedback": "<one sentence summary>", "feedbacks": [{"message": "...", "detail": "...", "severity": "low|medium|high", "suggestion": "..."}]}`,
            "",
            "Rules:",
            `- score must be 0 to ${maxScore}.`,
            "- shortFeedback must be a single short sentence.",
            "- feedbacks: 2 to 8 items, each about missing or wrong implementation.",
            "- severity: low = minor improvement, medium = notable gap, high = critical missing feature.",
            "- do not comment on code style, only on feature completeness.",
            "- output must be STRICT JSON (double quotes only).",
        ].filter(Boolean).join("\n")

        const humanText = [
            "Below is an excerpt of files loaded from the submitted GitHub repository (may be truncated):",
            "",
            sourceExcerpt || "(empty repository excerpt)",
        ].join("\n")

        const model = this.modelService.get({
            model:
                payload.gradingModel ??
                envConfig().services.githubWorker.processGitSubmission.grading.model,
            provider:
                (payload.gradingProvider ??
                    envConfig().services.githubWorker.processGitSubmission.grading.provider) as ModelProvider,
        })

        const response = await model.invoke([
            new SystemMessage(systemText),
            new HumanMessage(humanText),
        ])

        const raw = typeof response.content === "string"
            ? response.content
            : String(response.content)

        const gradeResult = this.parseResult(raw)

        /** Save grading result into attempt via context for the complete step */
        await this.entityManager.update(
            PersonalProjectAttemptEntity,
            { id: attempt.id },
            {
                score: gradeResult.score,
                shortFeedback: gradeResult.shortFeedback,
                processedAt: new Date(),
            },
        )

        return {}
    }

    /** Finalize the step. */
    private async finalize(
        executionResult: EmptyObject,
        context: JobExtendedContext<ProcessPersonalProjectPayload, EmptyObject>,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob(
                    {
                        job,
                        entityManager,
                    }
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    }
                )
            }
        )
        this.winstonService.log(
            WinstonLog.ProcessStepExecuted,
            {
                jobId: job.id ?? "",
                queueName,
                step: this.stepName,
                stepIndex: this.stepIndex,
                payload,
                success: true,
            },
        )
    }

    private parseResult(text: string): { score: number, shortFeedback: string | null, feedbacks: any[] } {
        const first = text.indexOf("{")
        const last = text.lastIndexOf("}")
        if (first !== -1 && last !== -1 && last > first) {
            const parsed = JSON.parse(text.slice(first, last + 1))
            return {
                score: Math.max(0, Math.round(Number(parsed.score) || 0)),
                shortFeedback: typeof parsed.shortFeedback === "string" ? parsed.shortFeedback.trim() : null,
                feedbacks: Array.isArray(parsed.feedbacks)
                    ? parsed.feedbacks
                        .filter((f: any) => typeof f?.message === "string" && f.message.trim())
                        .map((f: any) => ({
                            message: f.message.trim(),
                            detail: typeof f.detail === "string" ? f.detail.trim() : undefined,
                            severity: ["low", "medium", "high"].includes(f.severity) ? f.severity : "medium",
                            suggestion: typeof f.suggestion === "string" ? f.suggestion.trim() : undefined,
                        }))
                    : [],
            }
        }
        throw new Error(`Failed to parse grading result from model output: ${text.slice(0, 200)}`)
    }
}
