import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    InjectQdrantClient,
    ModelProvider,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "@modules/bullmq"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ProcessGoogleDocsSubmissionGradeStepExecuteResult,
    ExtendedProcessGoogleDocsSubmissionContext,
} from "../types"
import {
    JobExtendedContext,
} from "@modules/bullmq"
import {
    envConfig,
} from "@modules/env"
import {
    ModelService,
    EmbeddingModelService,
} from "@modules/langchain"
import {
    GoogleDriverAPIService,
} from "@modules/googleapis"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    InvalidModelGradeScoreException,
    ParsingScoreFromModelTextException,
} from "@modules/exceptions"
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    QdrantClient,
} from "@qdrant/qdrant-js"

/**
 * Step 1: grade the submission using database prompts.
 */
@Injectable()
export class ProcessGoogleDocsSubmissionGradeStepService extends AbstractStepService<
    ProcessGoogleDocsSubmissionPayload,
    ExtendedProcessGoogleDocsSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly googleDriverApiService: GoogleDriverAPIService,
        private readonly embeddingModelService: EmbeddingModelService,
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        private readonly modelService: ModelService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "grade"
    /** Process the step. */
    async process(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        const executionResult = await this.execute(context)
        await this.finalize(
            executionResult,
            context,
        )
    }

    /** Execute the step. */
    private async execute(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<ProcessGoogleDocsSubmissionGradeStepExecuteResult> {
        /** Submission URL. */
        const url = context.extended?.userChallengeSubmission.submissionUrl ?? ""
        const {
            text,
        } = await this.googleDriverApiService.fetchGoogleDocsText(
            {
                urlOrId: url,
            }
        )

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.githubWorker.processGitSubmission.chunkSize,
            chunkOverlap: envConfig().services.githubWorker.processGitSubmission.chunkOverlap,
        })
        const docs = await splitter.createDocuments(
            [
                text,
            ],
            [
                {
                    source: url,
                },
            ],
        )
        const chunks = await splitter.splitDocuments(docs)

        // Optional: vectorize into Qdrant for later inspection (not required for grading)
        const collectionName = `grading-${context.payload.userChallengeSubmissionId}`
        const embeddingModel = this.embeddingModelService.get({
            model:
                context.payload.embeddingModel ??
                envConfig().services.githubWorker.processGitSubmission.embedding.model,
            provider:
                (context.payload.embeddingProvider ??
                    envConfig().services.githubWorker.processGitSubmission.embedding.provider) as ModelProvider,
        })
        await this.qdrantClient.deleteCollection(collectionName)
        await QdrantVectorStore.fromDocuments(
            chunks,
            embeddingModel,
            {
                client: this.qdrantClient,
                collectionName,
            },
        )

        let sourceExcerpt = chunks
            .map((chunk) => chunk.pageContent)
            .join("\n\n")

        const maxChars = envConfig().services.githubWorker.processGitSubmission.gradingMaxSourceChars

        if (sourceExcerpt.length > maxChars) {
            sourceExcerpt = sourceExcerpt.slice(0,
                maxChars)
        }

        const challengeSubmission = context.extended?.challengeSubmission
        const submissionScore = challengeSubmission?.score ?? 100

        const rubric = (context.extended?.prompts ?? [])
            .map(
                (prompt, index) => {
                    const label = prompt.title ? ` (${prompt.title})` : ""
                    return `### Criterion ${index + 1}${label}\n${prompt.promptText}`
                },
            )
            .join("\n\n")

        const systemText = [
            "You are an expert principal educator grading a learner's submitted document for a specific course requirement.",
            "Apply the following rubric (stored in the course database).",
            "",
            rubric || "No specific criteria provided. Grade based on overall quality and completeness.",
            "",
            "Respond with JSON only — no markdown fences, no extra text.",
            "Shape:",
            `{"score": <integer from 1 to ${submissionScore}>, "feedbacks": ["..."]}`,
            "",
            "Rules:",
            `- score must be a whole number from 1 (poor) to ${submissionScore} (excellent).`,
            "- feedbacks must be an array of concise, specific, actionable comments.",
            "- every feedback item must be grounded only in the submitted document content.",
            "- do not invent information, sections, or behavior not present in the excerpt.",
            "- return 2 to 5 feedback items.",
            "- each feedback item should be a single sentence when possible.",
        ].join("\n")

        const humanText = [
            "Below is the content loaded from the submitted document (may be truncated):",
            "",
            sourceExcerpt || "(empty document content)",
        ].join("\n")

        const model = this.modelService.get({
            model: context.payload.gradingModel ?? envConfig().services.githubWorker.processGitSubmission.grading.model,
            provider: (context.payload.gradingProvider ?? envConfig().services.githubWorker.processGitSubmission.grading.provider) as ModelProvider,
        })

        const response = await model.invoke([
            new SystemMessage(systemText),
            new HumanMessage(humanText),
        ])

        const raw = (typeof response.content === "string" ? response.content : String(response.content)) as string

        return this.parseGradeFromModelText(raw,
            submissionScore)
    }

    private async finalize(
        executionResult: ProcessGoogleDocsSubmissionGradeStepExecuteResult,
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context

        await this.entityManager.transaction(async (entityManager) => {
            await this.jobActionService.increaseJob({
                job,
                entityManager,
            })

            await this.jobActionService.saveExecutionResult({
                job,
                key: this.stepName,
                executionResult,
                entityManager,
            })
        })

        this.winstonService.log(
            WinstonLog.ProcessGitSubmissionStepExecuted,
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

    private parseGradeFromModelText(
        text: string,
        maxScore: number,
    ): ProcessGoogleDocsSubmissionGradeStepExecuteResult {
        const brace = text.match(/\{[\s\S]*?\}/)

        if (brace) {
            try {
                const parsed = JSON.parse(brace[0]) as {
                    score?: unknown
                    feedbacks?: unknown
                }

                const score = this.parseScore(parsed.score,
                    maxScore)
                const feedbacks = this.parseFeedbacks(parsed.feedbacks)

                return {
                    score,
                    feedbacks,
                }
            } catch {
                // fall through
            }
        }
        throw new ParsingScoreFromModelTextException({
            text,
        })
    }

    private parseScore(value: unknown, maxScore: number): number {
        if (typeof value === "number") {
            return this.clampScore(value,
                maxScore)
        }

        if (typeof value === "string") {
            const parsed = Number.parseInt(value,
                10)
            if (!Number.isNaN(parsed)) {
                return this.clampScore(parsed,
                    maxScore)
            }
        }

        throw new InvalidModelGradeScoreException({
            rawValue: value,
        })
    }

    private parseFeedbacks(value: unknown): string[] {
        if (!Array.isArray(value)) {
            return []
        }
        return value.filter((v): v is string => typeof v === "string" && !!v.trim())
    }

    private clampScore(value: number, maxScore: number): number {
        return Math.min(
            maxScore,
            Math.max(
                1,
                Math.round(value),
            ),
        )
    }
}
