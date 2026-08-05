import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CvBlockNotFoundException,
} from "@modules/platform/exceptions/errors/cv/cv-block-not-found"
import {
    CvModelOutputParseException,
} from "@modules/platform/exceptions/errors/cv/cv-model-output-parse"
import {
    CvModelOutputShapeException,
} from "@modules/platform/exceptions/errors/cv/cv-model-output-shape"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    extractJsonBlock,
} from "@modules/ai/utils/extract-json-block"
import {
    validatedLaneToAiJobSelection,
} from "@modules/ai/utils/validated-lane-to-ai-job-selection"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import type {
    EntityManager,
} from "typeorm"
import {
    RewriteCvBlockCommand,
} from "./rewrite-cv-block.command"
import {
    RewriteCvBlockData,
} from "./graphql-types/response"
import type {
    BuildSystemPromptParams,
    CapstoneGroundingRow,
    LoadCapstoneGroundingParams,
} from "./types/rewrite-cv-block"

@CommandHandler(RewriteCvBlockCommand)
@Injectable()
/**
 * Handler for `rewriteCvBlock` -- improves a single CV block's item text via a
 * SYNCHRONOUS AI invoke (no BullMQ enqueue). Nothing is persisted; the FE swaps
 * the returned block into the editor.
 *
 * RAG-grounded: when `capstoneAttemptId` is present, the real capstone context
 * (task title + description, milestone, course, the user's score + short
 * feedback) is fetched from Postgres -- scoped to THIS user for security -- and
 * fed as grounding so the AI writes an ACCURATE description of the real StarCi
 * project instead of hallucinating. Without it, the block is rewritten from its
 * own content plus the optional `instruction`.
 *
 * The AI is prompted for STRICT JSON (the single block); the reply is parsed +
 * validated defensively -- a parse failure or a non-object reply throws rather
 * than returning malformed data. Free-tier friendly: no explicit model pinned.
 */
export class RewriteCvBlockHandler
    extends ICQRSHandler<RewriteCvBlockCommand, RewriteCvBlockData>
    implements ICommandHandler<RewriteCvBlockCommand, RewriteCvBlockData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly aiInvokeService: AiInvokeService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
    ) {
        super()
    }

    protected override async process(
        command: RewriteCvBlockCommand,
    ): Promise<RewriteCvBlockData> {
        const {
            request: {
                block,
                capstoneAttemptId,
                instruction,
                selectedModel,
                selectedModelProvider,
            },
            user,
            locale,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        if (!block || typeof block !== "object") {
            throw new CvBlockNotFoundException({
                op: "rewrite",
            })
        }

        // validate the optional model/provider pick against the user's entitlement
        // + the ai_models catalog, then collapse it into the AI job selection.
        // No pick validates to an empty selection (the balancer's Auto lane picks).
        // Mirrors generate-cv / upload-cv.
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId: user.id,
            model: selectedModel,
            provider: selectedModelProvider,
        })
        const selection = validatedLaneToAiJobSelection(validatedLane)

        const targetLanguage = (locale ?? Locale.En) === Locale.Vi
            ? "Vietnamese (Tiếng Việt)"
            : "English"

        // RAG grounding: when a capstone attempt is referenced, pull its REAL
        // context from Postgres (scoped to this user) so the rewrite is accurate.
        const grounding = capstoneAttemptId
            ? await this.loadCapstoneGrounding({
                userId: user.id,
                attemptId: capstoneAttemptId,
            })
            : null

        const systemText = this.buildSystemPrompt({
            targetLanguage,
            instruction: instruction?.trim() ?? "",
            grounding,
        })
        const humanText = [
            "## Block to rewrite (STRICT JSON)",
            JSON.stringify(block),
        ].join("\n")

        // synchronous, inline invoke via the shared balancer path. A validated
        // pick threads through `selection`; no pick -> empty selection -> Auto lane
        // picks (local-first). Behaviour is identical when no model is passed.
        const {
            text: raw,
        } = await this.aiInvokeService.run({
            userId: user.id,
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
            selection,
            surface: AiCeilSurface.Grading,
            task: AiModelTask.CVGenerating,
        })

        const rewritten = this.parseBlock(raw,
            block)

        return {
            block: rewritten,
        }
    }

    /**
     * Fetch the real capstone context for a PASSED attempt owned by the user.
     * Mirrors the `myPickableCvAchievements` join (attempts -> tasks -> milestones
     * -> enrollments -> courses), scoped to `e.user_id = $userId` so a user can
     * only ground on their own capstones, and pulls the task `description` +
     * attempt `short_feedback` for accuracy. Returns null if not found.
     */
    private async loadCapstoneGrounding(
        {
            userId,
            attemptId,
        }: LoadCapstoneGroundingParams,
    ): Promise<CapstoneGroundingRow | null> {
        const rows = await this.entityManager.query(
            `
            SELECT mt.title AS task_title, mt.description AS task_description,
                   m.title AS milestone_title, c.title AS course_title,
                   mta.score AS score, mta.short_feedback AS short_feedback
            FROM user_milestone_task_attempts mta
            JOIN user_milestone_tasks umt ON umt.id = mta.user_milestone_task_id
            JOIN milestone_tasks mt ON mt.id = umt.milestone_task_id
            JOIN milestones m ON m.id = mt.milestone_id
            JOIN enrollments e ON e.id = umt.enrollment_id
            JOIN courses c ON c.id = e.course_id
            WHERE mta.id = $1 AND e.user_id = $2 AND mta.passed = true
            LIMIT 1
            `,
            [
                attemptId,
                userId,
            ],
        ) as Array<CapstoneGroundingRow>

        return rows[0] ?? null
    }

    /**
     * Build the rewrite system prompt: the improvement goal + (optional) real
     * capstone grounding + (optional) user instruction + STRICT JSON contract.
     */
    private buildSystemPrompt(
        {
            targetLanguage,
            instruction,
            grounding,
        }: BuildSystemPromptParams,
    ): string {
        const groundingLines = grounding
            ? [
                "## Real StarCi capstone context (GROUND TRUTH — describe THIS accurately)",
                `Course: ${grounding.course_title}`,
                `Milestone: ${grounding.milestone_title}`,
                `Task: ${grounding.task_title}`,
                `Task description: ${grounding.task_description?.trim() || "(none)"}`,
                `Learner's score: ${grounding.score}`,
                `Grader feedback: ${grounding.short_feedback?.trim() || "(none)"}`,
                "",
                "Rewrite the block so it ACCURATELY describes this real capstone. Do NOT invent metrics, employers, or scope beyond the context above.",
                "",
            ]
            : []
        return [
            "You are an expert technical resume writer. Rewrite ONE CV block to be clearer, stronger, and more achievement-focused.",
            "",
            "## Rules",
            "- Improve the wording of the block's `items` (make them concise, quantified, and impactful where the input supports it).",
            "- Keep the SAME block `id`, `type`, and `order`. You MAY refine `title`.",
            "- Do NOT fabricate employers, dates, degrees, or metrics not supported by the input (or the capstone context, if provided).",
            "",
            ...groundingLines,
            ...(instruction.length > 0
                ? [
                    "## User instruction",
                    instruction,
                    "",
                ]
                : []),
            "## Language",
            `Write human-readable values (title, items) in **${targetLanguage}**. JSON keys stay in English.`,
            "",
            "## Output Format",
            "Respond with a SINGLE JSON object for the rewritten block matching this shape exactly:",
            "",
            JSON.stringify(
                {
                    id: "string (same as input)",
                    type: "string (same as input)",
                    title: "string",
                    order: "number (same as input)",
                    items: ["string"],
                },
                null,
                2,
            ),
            "",
            "## JSON Formatting",
            "- Output STRICT JSON only — no markdown fences, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- The top-level value MUST be a single JSON object (not an array).",
        ].join("\n")
    }

    /**
     * Parse + validate the model's STRICT JSON reply into the rewritten block.
     * Extracts the JSON block, `JSON.parse`, asserts it is an object, and
     * preserves the original block's identity fields (`id`, `type`, `order`)
     * defensively. Throws on parse failure or a non-object reply.
     */
    private parseBlock(
        raw: string,
        original: Record<string, unknown>,
    ): Record<string, unknown> {
        let parsed: unknown
        try {
            parsed = JSON.parse(extractJsonBlock(raw))
        } catch (error) {
            throw new CvModelOutputParseException({
                stage: "rewrite",
                originalError: error instanceof Error ? error : new Error(String(error)),
            })
        }

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new CvModelOutputShapeException({
                stage: "rewrite",
                expected: "object",
            })
        }

        const block = parsed as Record<string, unknown>
        const asString = (value: unknown): string =>
            typeof value === "string" ? value : ""
        const asStringArray = (value: unknown): Array<string> =>
            Array.isArray(value)
                ? value.filter((item): item is string => typeof item === "string")
                : []

        // preserve identity fields from the original block; only text may change
        return {
            id: original.id ?? block.id,
            type: original.type ?? block.type,
            order: typeof original.order === "number" ? original.order : block.order,
            title: asString(block.title) || asString(original.title),
            items: asStringArray(block.items),
        }
    }
}
