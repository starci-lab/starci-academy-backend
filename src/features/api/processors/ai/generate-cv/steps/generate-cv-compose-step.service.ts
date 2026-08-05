import type {
    GenerateCvPayload,
} from "@modules/integrations/bullmq/types/payloads/generate-cv"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    extractJsonBlock,
} from "@modules/ai/utils/extract-json-block"
import {
    CvRagRetrievalService,
} from "@modules/integrations/rag/cv-rag-retrieval.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    CvGenerationStepResultMissingException,
} from "@modules/platform/exceptions/errors/cv/cv-generation-step-result-missing"
import {
    CvModelOutputParseException,
} from "@modules/platform/exceptions/errors/cv/cv-model-output-parse"
import type {
    BuildRagContextParams,
    BuildSystemPromptParams,
    ComposedEducation,
    ComposedExperience,
    ComposedSkillGroup,
    GenerateCvComposeStepExecuteResult,
    GenerateCvGatherStepExecuteResult,
} from "../types/execute"
import type {
    ExtendedGenerateCvContext,
} from "../types/extended"

/** Number of RAG chunks to pull per CV-context query. */
const RAG_TOP_K = 4

@Injectable()
/**
 * Step 1 -- compose. Builds the CV system prompt from the VERIFIED gathered data
 * + the user's free-text `extraPrompts` + three RAG contexts (rubric / catalog /
 * sample), plus (Revise) the extracted original CV text, invokes the LLM via
 * {@link AiInvokeService} (task `Grading`, floor Balanced -- the app's grading
 * lane already targets Balanced-plus), and parses the STRICT JSON reply into the
 * structured CV. Persisted as this step's execution result for the render step.
 */
export class GenerateCvComposeStepService extends AbstractStepService<
    GenerateCvPayload,
    ExtendedGenerateCvContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly cvRagRetrievalService: CvRagRetrievalService,
    ) {
        super()
    }

    stepIndex = 1
    stepName = "compose"

    /**
     * Process the compose step.
     */
    async process(
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(context)
            await this.finalize(executionResult,
                context)
        } catch (error) {
            await this.jobActionService.failJob(
                {
                    job: context.job,
                    error: error.message,
                },
            )
            throw error
        }
    }

    /**
     * Execute: assemble prompt (gathered data + extraPrompts + RAG + source CV),
     * invoke the LLM, parse STRICT JSON.
     */
    private async execute(
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
    ): Promise<GenerateCvComposeStepExecuteResult> {
        const { payload } = context
        const locale = payload.locale ?? Locale.En
        const targetLanguage = locale === Locale.Vi
            ? "Vietnamese (Tiếng Việt)"
            : "English"

        // read the verified data the gather step persisted
        const gathered = await this.jobActionService.loadExecutionResult<
            GenerateCvGatherStepExecuteResult
        >({
            job: context.job,
            key: "gather",
        })
        if (!gathered) {
            throw new CvGenerationStepResultMissingException({
                step: "gather",
                stage: "compose",
            })
        }

        // infer a rough seniority level + tech stack from the verified signals to
        // steer the three RAG queries
        const inferredLevel = this.inferLevel(gathered)
        const inferredRole = gathered.profile.roleTitle?.trim() || "Software Engineer"
        const techStack = this.inferTechStack(gathered)

        // three RAG contexts, concatenated: rubric (by level), catalog (by stack),
        // sample (by role/level). Best-effort -- RAG failure degrades to no context.
        const ragContext = await this.buildRagContext({
            inferredLevel,
            inferredRole,
            techStack,
        })

        const systemText = this.buildSystemPrompt({
            targetLanguage,
            extraPrompts: payload.extraPrompts ?? "",
            ragContext,
            inferredLevel,
            inferredRole,
            isRevise: payload.mode === CvGenerationMode.Revise,
        })

        const humanText = this.buildHumanPrompt(gathered)

        // invoke the LLM. Dedicated CVGenerating task (floor Balanced -> climb to
        // ceiling, same policy shape as grading); selection carries the user's lane.
        const { text: raw } = await this.aiInvokeService.run({
            userId: payload.userId,
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
            selection: payload.ai,
            floor: AiModelCategory.Medium,
            surface: AiCeilSurface.Grading,
            task: AiModelTask.CVGenerating,
        })

        return this.parseComposedCv(raw)
    }

    /**
     * Call {@link CvRagRetrievalService.retrieveCvContext} three times (rubric /
     * catalog / sample) and concatenate the excerpts. Best-effort: any RAG
     * failure yields an empty context so composition still proceeds.
     */
    private async buildRagContext(
        {
            inferredLevel,
            inferredRole,
            techStack,
        }: BuildRagContextParams,
    ): Promise<string> {
        try {
            const [
                rubric,
                catalog,
                sample,
            ] = await Promise.all([
                this.cvRagRetrievalService.retrieveCvContext({
                    query: `CV quality rubric and expectations for a ${inferredLevel} engineer`,
                    kinds: ["rubric"],
                    topK: RAG_TOP_K,
                }),
                this.cvRagRetrievalService.retrieveCvContext({
                    query: `Skill and technology catalog for: ${techStack.join(", ") || "software engineering"}`,
                    kinds: ["catalog"],
                    topK: RAG_TOP_K,
                }),
                this.cvRagRetrievalService.retrieveCvContext({
                    query: `Sample CV phrasing for a ${inferredLevel} ${inferredRole}`,
                    kinds: ["sample"],
                    topK: RAG_TOP_K,
                }),
            ])
            return [
                rubric.excerpt,
                catalog.excerpt,
                sample.excerpt,
            ].filter((excerpt) => excerpt && excerpt.trim().length > 0)
                .join("\n\n---\n\n")
        } catch {
            // RAG is advisory -- never let a retrieval failure fail CV generation
            return ""
        }
    }

    /**
     * Build the system prompt: verified achievements + free-text prompts + RAG
     * context + (Revise) original CV + STRICT JSON output contract.
     */
    private buildSystemPrompt(
        {
            targetLanguage,
            extraPrompts,
            ragContext,
            inferredLevel,
            inferredRole,
            isRevise,
        }: BuildSystemPromptParams,
    ): string {
        const jsonTemplate = {
            fullName: "string",
            headline: "string",
            summary: "string",
            skillGroups: [
                {
                    category: "string",
                    items: ["string"],
                },
            ],
            experiences: [
                {
                    title: "string",
                    org: "string",
                    location: "string",
                    dateRange: "string",
                    bullets: ["string"],
                },
            ],
            education: [
                {
                    school: "string",
                    degree: "string",
                    dateRange: "string",
                },
            ],
        }
        return [
            `You are an expert technical resume writer building a CV for a ${inferredLevel} ${inferredRole}.`,
            "",
            "## Goal",
            "Produce a concise, achievement-focused CV grounded ONLY in the VERIFIED data and the user's notes below.",
            "Do NOT invent employers, dates, degrees, or metrics that are not supported by the input.",
            "Turn the verified achievements (passed capstone tasks, graded challenges, accepted coding problems) into strong, quantified bullets where possible.",
            "",
            "## IMPORTANT: Language",
            `Write ALL human-readable values (headline, summary, bullets, category names) in **${targetLanguage}**. JSON keys stay in English.`,
            "",
            "## User notes (free text — emphasis, target role, extra projects)",
            extraPrompts.trim() || "(none provided)",
            "",
            ...(isRevise
                ? [
                    "## Revise mode",
                    "The user's ORIGINAL CV text is provided in the human message. Preserve any real experience/education from it, improve the wording, and merge in the verified achievements. Do not fabricate beyond what the original CV or the verified data supports.",
                    "",
                ]
                : []),
            ...(ragContext.trim().length > 0
                ? [
                    "## Reference context (rubric / skill catalog / sample phrasing)",
                    ragContext,
                    "",
                ]
                : []),
            "## Output Format",
            "Respond with a SINGLE JSON object matching this shape exactly (replace the placeholder strings with real content, arrays may have any length):",
            "",
            JSON.stringify(jsonTemplate,
                null,
                2),
            "",
            "## JSON Formatting",
            "- Output STRICT JSON only — no markdown fences, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- If a section has no supporting data, return an empty array for it (do not fabricate).",
        ].join("\n")
    }

    /**
     * Build the human message: the verified data blob (+ original CV text for Revise).
     */
    private buildHumanPrompt(
        gathered: GenerateCvGatherStepExecuteResult,
    ): string {
        const profileLines = [
            `Display name: ${gathered.profile.displayName ?? "(unknown)"}`,
            `Role title: ${gathered.profile.roleTitle ?? "(none)"}`,
            `Location: ${gathered.profile.location ?? "(none)"}`,
            `Bio: ${gathered.profile.bio ?? "(none)"}`,
            `GitHub: ${gathered.profile.githubUsername ?? "(none)"}`,
            `LinkedIn: ${gathered.profile.linkedinUrl ?? "(none)"}`,
            `Website: ${gathered.profile.websiteUrl ?? "(none)"}`,
            `Work mode: ${gathered.profile.workMode ?? "(none)"}`,
            `Open to work: ${gathered.profile.openToWork ? "yes" : "no"}`,
        ].join("\n")

        const milestoneLines = gathered.milestoneTaskAttempts.length > 0
            ? gathered.milestoneTaskAttempts
                .map((attempt) =>
                    `- [${attempt.courseTitle} / ${attempt.milestoneTitle}] ${attempt.taskTitle} (score ${attempt.score})`)
                .join("\n")
            : "(none)"

        const challengeLines = gathered.challengeSubmissions.length > 0
            ? gathered.challengeSubmissions
                .map((submission) =>
                    `- [${submission.courseTitle}] ${submission.challengeTitle} (score ${submission.score}${submission.selectedLang ? `, ${submission.selectedLang}` : ""})`)
                .join("\n")
            : "(none)"

        const codingLines = gathered.codingSolves.length > 0
            ? gathered.codingSolves
                .map((solve) =>
                    `- ${solve.problemTitle} (${solve.difficulty}, ${solve.domain})`)
                .join("\n")
            : "(none)"

        const xpLines = [
            `Challenge XP: ${gathered.xp.challengeXp}`,
            `Milestone/capstone XP: ${gathered.xp.milestoneXp}`,
            `Coding XP: ${gathered.xp.codingXp}`,
            `Lesson XP: ${gathered.xp.lessonXp}`,
        ].join("\n")

        return [
            "## Verified profile",
            profileLines,
            "",
            "## Passed capstone / milestone tasks",
            milestoneLines,
            "",
            "## Graded challenge submissions (score > 0)",
            challengeLines,
            "",
            "## Accepted coding-practice problems",
            codingLines,
            "",
            "## XP breakdown (emphasis signal)",
            xpLines,
            ...(gathered.sourceCvText
                ? [
                    "",
                    "## Original CV text (Revise mode — improve & merge, do not fabricate)",
                    gathered.sourceCvText,
                ]
                : []),
        ].join("\n")
    }

    /**
     * Parse + validate the LLM's STRICT JSON reply into the structured CV
     * (mirrors the challenge-evaluation parse pattern: extract the JSON block,
     * `JSON.parse`, coerce fields to the expected shape).
     */
    private parseComposedCv(
        raw: string,
    ): GenerateCvComposeStepExecuteResult {
        let parsed: Record<string, unknown>
        try {
            parsed = JSON.parse(extractJsonBlock(raw)) as Record<string, unknown>
        } catch (error) {
            throw new CvModelOutputParseException({
                stage: "compose",
                originalError: error instanceof Error ? error : new Error(String(error)),
            })
        }
        const asString = (value: unknown): string =>
            typeof value === "string" ? value : ""
        const asStringArray = (value: unknown): Array<string> =>
            Array.isArray(value)
                ? value.filter((item): item is string => typeof item === "string")
                : []

        const skillGroups: Array<ComposedSkillGroup> = Array.isArray(parsed.skillGroups)
            ? (parsed.skillGroups as Array<Record<string, unknown>>).map((group) => ({
                category: asString(group?.category),
                items: asStringArray(group?.items),
            }))
            : []

        const experiences: Array<ComposedExperience> = Array.isArray(parsed.experiences)
            ? (parsed.experiences as Array<Record<string, unknown>>).map((experience) => ({
                title: asString(experience?.title),
                org: asString(experience?.org),
                location: asString(experience?.location),
                dateRange: asString(experience?.dateRange),
                bullets: asStringArray(experience?.bullets),
            }))
            : []

        const education: Array<ComposedEducation> = Array.isArray(parsed.education)
            ? (parsed.education as Array<Record<string, unknown>>).map((entry) => ({
                school: asString(entry?.school),
                degree: asString(entry?.degree),
                dateRange: asString(entry?.dateRange),
            }))
            : []

        return {
            fullName: asString(parsed.fullName),
            headline: asString(parsed.headline),
            summary: asString(parsed.summary),
            skillGroups,
            experiences,
            education,
        }
    }

    /**
     * Rough seniority signal from the verified achievement volume.
     */
    private inferLevel(
        gathered: GenerateCvGatherStepExecuteResult,
    ): string {
        const totalXp = gathered.xp.challengeXp
            + gathered.xp.milestoneXp
            + gathered.xp.codingXp
            + gathered.xp.lessonXp
        const capstones = gathered.milestoneTaskAttempts.length
        if (capstones >= 10 || totalXp >= 5000) {
            return "senior"
        }
        if (capstones >= 3 || totalXp >= 1500) {
            return "mid-level"
        }
        return "junior"
    }

    /**
     * Derive a tech-stack hint from the languages used in graded challenge
     * submissions + coding-problem domains (drives the catalog RAG query).
     */
    private inferTechStack(
        gathered: GenerateCvGatherStepExecuteResult,
    ): Array<string> {
        const stack = new Set<string>()
        for (const submission of gathered.challengeSubmissions) {
            if (submission.selectedLang) {
                stack.add(submission.selectedLang)
            }
        }
        for (const solve of gathered.codingSolves) {
            if (solve.domain) {
                stack.add(solve.domain)
            }
        }
        return Array.from(stack)
    }

    /**
     * Persist the structured CV as this step's execution result + advance the step.
     */
    private async finalize(
        executionResult: GenerateCvComposeStepExecuteResult,
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
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
                    },
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    },
                )
            },
        )
        this.winstonService.log(
            WinstonLog.ProcessCVSubmissionStepExecuted,
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
}
