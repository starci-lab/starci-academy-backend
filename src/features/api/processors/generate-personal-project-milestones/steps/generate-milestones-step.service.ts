import type {
    GeneratePersonalProjectMilestonesPayload,
} from "@modules/bullmq"
import {
    AbstractStepService,
    JobActionService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    ModelProvider,
    PersonalProjectContextEntity,
    PersonalProjectContextResolverService,
} from "@modules/databases"
import {
    ModelService,
} from "@modules/langchain"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"

@Injectable()
export class GenerateMilestonesStepService extends AbstractStepService<
    GeneratePersonalProjectMilestonesPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly modelService: ModelService,
        private readonly personalProjectContextResolverService: PersonalProjectContextResolverService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "generate-milestones"

    async process(
        context: JobExtendedContext<GeneratePersonalProjectMilestonesPayload, EmptyObject>,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(context)
            await this.finalize(
                executionResult,
                context,
            )
        } catch (error) {
            await this.jobActionService.failJob({
                job: context.job,
                error: error.message,
                emitChangeEvent: false,
            })
            throw error
        }
    }

    /**
     * Execute the step.
     * @param context The job context.
     * @returns A promise that resolves with the execution result.
     */
    private async execute(
        context: JobExtendedContext<GeneratePersonalProjectMilestonesPayload, EmptyObject>,
    ): Promise<GenerateMilestonesExecutionResult> {
        const { payload } = context
        const enrollment = await this.entityManager.findOneOrFail(
            EnrollmentEntity,
            {
                where: {
                    id: payload.enrollmentId,
                },
                relations: {
                    course: true,
                },
            },
        )

        const personalProjectContext = await this.entityManager.findOneOrFail(
            PersonalProjectContextEntity,
            {
                where: {
                    course: {
                        id: enrollment.courseId,
                    },
                },
                relations: {
                    translations: true,
                },
            },
        )

        const locale = payload.locale ?? Locale.En
        const translatedPersonalProjectContext = this.personalProjectContextResolverService.transform(
            personalProjectContext,
            locale,
        )
        const requirements = translatedPersonalProjectContext.requirements ?? "(no requirements context)"
        const roadmap = translatedPersonalProjectContext.roadmap ?? "(no roadmap context)"
        const ideaText = enrollment.ideaText ?? "(no idea submitted)"
        const courseTitle = enrollment.course?.title ?? "Unknown Course"
        /** Map locale code to full language name for the LLM prompt. */
        const localeLanguageMap: Record<string, string> = {
            en: "English",
            vi: "Vietnamese (Tiếng Việt)",
        }
        const targetLanguage = localeLanguageMap[locale] ?? "English"

        const systemText = [
            "You are an expert course mentor designing personalized project milestones for a student.",
            `The student is enrolled in: "${courseTitle}".`,
            "",
            "### IMPORTANT: Language Requirement",
            `All text content (titles, descriptions, criteria text) MUST be written in **${targetLanguage}**.`,
            `The JSON keys must remain in English, but all human-readable values must be in ${targetLanguage}.`,
            "",
            "### Course Knowledge Requirements",
            requirements,
            "",
            "### Suggested Project Roadmap",
            roadmap,
            "",
            "### Student's Project Idea",
            ideaText,
            "",
            "### Your Task",
            "Generate 4-6 milestones that form a complete project plan for this student.",
            "Each milestone should represent ~1 week of work.",
            "Each milestone must have 2-4 concrete tasks.",
            "Each task must have 2-4 measurable pass criteria.",
            "",
            "Respond with JSON only — no markdown fences, no extra text.",
            "Shape:",
            "[",
            "  {",
            "    \"title\": \"<milestone title>\",",
            "    \"week\": <week number starting from 1>,",
            "    \"orderIndex\": <0-based index>,",
            "    \"tasks\": [",
            "      {",
            "        \"title\": \"<task title>\",",
            "        \"description\": \"<task description>\",",
            "        \"orderIndex\": <0-based index>,",
            "        \"passCriteria\": [",
            "          {",
            "            \"text\": \"<human-readable criterion>\",",
            "            \"promptText\": \"<detailed grading instruction for AI reviewer>\",",
            "            \"orderIndex\": <0-based index>",
            "          }",
            "        ]",
            "      }",
            "    ]",
            "  }",
            "]",
        ].join("\n")

        const humanText = [
            `Please generate personalized milestones for this student now. Write all content in ${targetLanguage}.`,
            `Student's idea: ${ideaText}`,
        ].join("\n")

        const model = this.modelService.get({
            model: payload.model ?? "gemini-2.0-flash",
            provider: (payload.provider ?? "gemini") as ModelProvider,
        })

        const response = await model.invoke([
            new SystemMessage(systemText),
            new HumanMessage(humanText),
        ])

        const raw = typeof response.content === "string"
            ? response.content
            : String(response.content)

        return {
            enrollmentId: enrollment.id,
            milestones: this.parseResult(raw),
        }
    }

    /**
     * Finalize the execution.
     * @param executionResult The execution result.
     * @param context The job context.
     * @returns A promise that resolves when the execution is finalized.
     */
    private async finalize(
        executionResult: GenerateMilestonesExecutionResult,
        context: JobExtendedContext<GeneratePersonalProjectMilestonesPayload, EmptyObject>,
    ): Promise<void> {
        const { job, payload, queueName } = context
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

    /**
     * Parse the result from the model.
     * @param text The raw text from the model.
     * @returns An array of generated milestones.
     */
    private parseResult(text: string): Array<GeneratedMilestone> {
        const first = text.indexOf("[")
        const last = text.lastIndexOf("]")
        if (first === -1 || last === -1 || last <= first) {
            throw new Error(
                `Failed to parse milestone generation result from model output: ${text.slice(
                    0,
                    200,
                )}`,
            )
        }
        const parsed = JSON.parse(
            text.slice(
                first,
                last + 1,
            ),
        ) as Array<GeneratedMilestone>
        if (!Array.isArray(parsed)) {
            throw new Error("Generated milestones payload is not an array")
        }
        return parsed.map((milestone, milestoneIndex) => ({
            title: `${milestone?.title ?? ""}`
                .trim(),
            week: Number(milestone?.week ?? milestoneIndex + 1),
            orderIndex: Number(milestone?.orderIndex ?? milestoneIndex),
            tasks: Array.isArray(milestone?.tasks)
                ? milestone.tasks.map((task, taskIndex) => ({
                    title: `${task?.title ?? ""}`.trim(),
                    description: `${task?.description ?? ""}`.trim(),
                    orderIndex: Number(task?.orderIndex ?? taskIndex),
                    passCriteria: Array.isArray(task?.passCriteria)
                        ? task.passCriteria.map((criteria, criteriaIndex) => ({
                            text: `${criteria?.text ?? ""}`.trim(),
                            promptText: `${criteria?.promptText ?? ""}`.trim(),
                            orderIndex: Number(criteria?.orderIndex ?? criteriaIndex),
                        }))
                        : [],
                }))
                : [],
        }))
    }
}

interface GeneratedPassCriteria {
    text: string
    promptText: string
    orderIndex: number
}

interface GeneratedTask {
    title: string
    description: string
    orderIndex: number
    passCriteria: Array<GeneratedPassCriteria>
}

interface GeneratedMilestone {
    title: string
    week: number
    orderIndex: number
    tasks: Array<GeneratedTask>
}

export interface GenerateMilestonesExecutionResult {
    enrollmentId: string
    milestones: Array<GeneratedMilestone>
}
