import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    AiCeilSurface,
    AiModelTask,
    Locale,
} from "@modules/databases"
import {
    CvBlocksEmptyException,
    CvModelOutputParseException,
    CvModelOutputShapeException,
    CvTailorMissingJobDescriptionException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    AiInvokeService,
    GradingLaneValidationService,
    extractJsonBlock,
    validatedLaneToAiJobSelection,
} from "@modules/ai"
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
import {
    TailorCvBlocksCommand,
} from "./tailor-cv-blocks.command"
import {
    TailorCvBlocksData,
} from "./graphql-types"

@CommandHandler(TailorCvBlocksCommand)
@Injectable()
/**
 * Handler for `tailorCvBlocks` — tailors the ENTIRE CV blocks array toward a job
 * description via a SYNCHRONOUS AI invoke (no BullMQ enqueue). Nothing is
 * persisted; the FE swaps the returned blocks into the editor.
 *
 * The AI rewrites / emphasizes / reorders the item wording of every block to
 * better match the JD WITHOUT inventing false facts, and MUST return the SAME
 * block structure (same block `id`/`type`, same item `id`) with adjusted item
 * `fields`. The reply is prompted as a STRICT JSON array; it is parsed +
 * validated defensively (extract → JSON.parse → assert array) and each returned
 * block is merged back onto the ORIGINAL by `id`, so structural identity is
 * preserved even if the model drifts. A parse failure or non-array reply throws
 * a clear error rather than returning malformed data.
 *
 * A validated model pick threads through `selection`; no pick → the Auto lane
 * picks (local-first). Mirrors rewrite-cv-block's invoke path.
 */
export class TailorCvBlocksHandler
    extends ICQRSHandler<TailorCvBlocksCommand, TailorCvBlocksData>
    implements ICommandHandler<TailorCvBlocksCommand, TailorCvBlocksData> {
    constructor(
        private readonly aiInvokeService: AiInvokeService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
    ) {
        super()
    }

    protected override async process(
        command: TailorCvBlocksCommand,
    ): Promise<TailorCvBlocksData> {
        const {
            request: {
                blocks,
                jobDescription,
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

        if (!Array.isArray(blocks) || blocks.length === 0) {
            throw new CvBlocksEmptyException({
                op: "tailor",
            })
        }

        const jd = jobDescription?.trim() ?? ""
        if (jd.length === 0) {
            throw new CvTailorMissingJobDescriptionException({
            })
        }

        const targetLanguage = (locale ?? Locale.En) === Locale.Vi
            ? "Vietnamese (Tiếng Việt)"
            : "English"

        // validate the optional model/provider pick against the user's entitlement
        // + the ai_models catalog, then collapse it into the AI job selection.
        // No pick validates to an empty selection (the balancer's Auto lane picks).
        // Mirrors rewrite-cv-block / generate-cv.
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId: user.id,
            model: selectedModel,
            provider: selectedModelProvider,
        })
        const selection = validatedLaneToAiJobSelection(validatedLane)

        const systemText = this.buildSystemPrompt(targetLanguage)
        const humanText = [
            "## Target job description",
            jd,
            "",
            "## Current CV blocks (STRICT JSON array)",
            JSON.stringify(blocks),
        ].join("\n")

        // synchronous, inline invoke via the shared balancer path — mirrors
        // rewrite-cv-block. A validated pick threads through `selection`; no pick
        // → empty selection → Auto lane picks (local-first).
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

        const tailored = this.parseBlocks(raw,
            blocks)

        return {
            blocks: tailored,
        }
    }

    /**
     * Build the tailoring system prompt: the goal (align item wording to the JD
     * without fabricating facts) + the identity-preservation contract + STRICT
     * JSON array output shape.
     */
    private buildSystemPrompt(
        targetLanguage: string,
    ): string {
        return [
            "You are an expert technical resume writer. Tailor an ENTIRE CV (a JSON array of blocks) toward a specific job description.",
            "",
            "## Rules",
            "- Rewrite, emphasize, and reorder the wording of each block's `items` (and their `fields`) so the CV better matches the job description's responsibilities, skills, and keywords.",
            "- You MAY reorder blocks and reorder items WITHIN a block to surface the most relevant experience first.",
            "- Do NOT invent employers, dates, degrees, metrics, or skills not already present in the input. Only re-phrase and re-prioritize the TRUE facts already there.",
            "- Preserve structure EXACTLY: keep the SAME set of block `id`s and `type`s, and keep each item's `id`. Only the human-readable wording (titles, item `fields` / text) may change.",
            "- Do NOT add or remove blocks or items — return the SAME blocks and the SAME items, only reworded/reordered.",
            "",
            "## Language",
            `Write human-readable values (titles, item fields/text) in **${targetLanguage}**. JSON keys stay in English.`,
            "",
            "## Output Format",
            "Respond with a JSON ARRAY of the tailored blocks, each block keeping the same shape it had in the input (same `id`, `type`, `order` unless you intentionally reorder, and the same item `id`s), for example:",
            "",
            JSON.stringify(
                [
                    {
                        id: "string (same as input)",
                        type: "string (same as input)",
                        title: "string",
                        order: "number",
                        items: [
                            {
                                id: "string (same as input)",
                                fields: {
                                },
                            },
                        ],
                    },
                ],
                null,
                2,
            ),
            "",
            "## JSON Formatting",
            "- Output STRICT JSON only — no markdown fences, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- The top-level value MUST be a single JSON array.",
        ].join("\n")
    }

    /**
     * Parse + validate the model's STRICT JSON reply into the tailored blocks.
     * Extracts the JSON block, `JSON.parse`, asserts it is an array, then merges
     * each tailored block back onto the ORIGINAL by `id` so structural identity
     * (block ids/types, block set) is preserved even if the model drifts. Falls
     * back to the original block for any id the model dropped. Throws on parse
     * failure or a non-array reply.
     */
    private parseBlocks(
        raw: string,
        original: Array<Record<string, unknown>>,
    ): Array<Record<string, unknown>> {
        let parsed: unknown
        try {
            parsed = JSON.parse(extractJsonBlock(raw))
        } catch (error) {
            throw new CvModelOutputParseException({
                stage: "tailor",
                originalError: error instanceof Error ? error : new Error(String(error)),
            })
        }

        if (!Array.isArray(parsed)) {
            throw new CvModelOutputShapeException({
                stage: "tailor",
                expected: "array",
            })
        }

        // index the model's blocks by id so we can merge onto the originals; this
        // preserves the original block SET + identity fields regardless of model drift.
        const tailoredById = new Map<string, Record<string, unknown>>()
        for (const entry of parsed) {
            if (entry && typeof entry === "object" && !Array.isArray(entry)) {
                const candidate = entry as Record<string, unknown>
                if (typeof candidate.id === "string") {
                    tailoredById.set(candidate.id,
                        candidate)
                }
            }
        }

        return original.map((originalBlock) => {
            const id = typeof originalBlock.id === "string" ? originalBlock.id : ""
            const tailoredBlock = id ? tailoredById.get(id) : undefined
            if (!tailoredBlock) {
                // model dropped this block — keep the original untouched.
                return originalBlock
            }
            // merge tailored wording over the original, but hard-preserve the
            // structural identity fields (`id`, `type`) from the original.
            return {
                ...originalBlock,
                ...tailoredBlock,
                id: originalBlock.id,
                type: originalBlock.type,
            }
        })
    }
}
