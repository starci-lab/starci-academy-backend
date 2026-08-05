import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    AiCeilSurface,
    AiModelCategory,
    AiModelTask,
    Locale,
} from "@modules/databases"
import {
    CvModelOutputParseException,
    CvModelOutputShapeException,
    CvSplitEmptyTextException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    extractJsonBlock,
} from "@modules/ai/utils/extract-json-block"
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
    SplitCvFromTextCommand,
} from "./split-cv-from-text.command"
import {
    SplitCvFromTextData,
} from "./graphql-types"

/** Block `type` values the FE block editor understands (mirror of `CvBlockType`). */
const BLOCK_TYPES = [
    "personal",
    "summary",
    "experience",
    "education",
    "skills",
    "project",
    "achievement",
    "certification",
    "language",
    "activity",
    "interest",
] as const

/**
 * Each block type's item `fields` shape -- MUST mirror the FE per-block editors /
 * `CvHtmlDocument` renderers (`personal` reads `fields.name/email/...`, `experience`
 * reads `fields.company/role/...`, etc.). The AI is told this so its output loads
 * straight into the editor; the parser also uses PRIMARY_FIELD_KEY to salvage a
 * bare string an item might drift into.
 */
const BLOCK_FIELD_SCHEMA: Record<(typeof BLOCK_TYPES)[number], string> = {
    personal: "ONE item; fields: { name, role, email, phone, location, birthDate, linkedinUrl, githubUsername }",
    summary: "ONE item; fields: { text }",
    experience: "one item PER job; fields: { company, role, startDate, endDate, bullets } — bullets: one achievement per line joined by \\n",
    education: "one item PER school; fields: { school, degree, startDate, endDate }",
    skills: "one item PER skill; fields: { name }",
    project: "one item PER project; fields: { title, description }",
    achievement: "one item PER achievement; fields: { title, description }",
    certification: "one item PER certificate; fields: { name, issuer, date, credentialUrl }",
    language: "one item PER language; fields: { name, level }",
    activity: "one item PER activity/volunteering; fields: { title, description }",
    interest: "one item PER interest; fields: { name }",
}

/** Block types that hold exactly ONE item (their fields set), not a repeatable list. */
const SINGLE_ITEM_TYPES: ReadonlySet<string> = new Set(["personal",
    "summary"])

/** Where to dump a bare string when a model returns an item as a plain string (drift salvage). */
const PRIMARY_FIELD_KEY: Record<(typeof BLOCK_TYPES)[number], string> = {
    personal: "name",
    summary: "text",
    experience: "bullets",
    education: "degree",
    skills: "name",
    project: "description",
    achievement: "description",
    certification: "name",
    language: "name",
    activity: "description",
    interest: "name",
}

@CommandHandler(SplitCvFromTextCommand)
@Injectable()
/**
 * Handler for `splitCvFromText` -- parses a raw pasted CV / free-text resume into
 * an ordered array of block-editor blocks via a SYNCHRONOUS AI invoke (no BullMQ
 * enqueue). Nothing is persisted; the FE loads the returned blocks into the
 * editor for the user to refine.
 *
 * The AI is prompted for STRICT JSON (an array of `{ id, type, title, order,
 * items }`); the reply is parsed + validated defensively -- a parse failure or a
 * non-array reply throws a clear error rather than returning malformed data.
 * Free-tier friendly: no explicit model is pinned, so the balancer's Auto lane
 * picks (local-first) -- text parsing does not need a grading floor.
 */
export class SplitCvFromTextHandler
    extends ICQRSHandler<SplitCvFromTextCommand, SplitCvFromTextData>
    implements ICommandHandler<SplitCvFromTextCommand, SplitCvFromTextData> {
    constructor(
        private readonly aiInvokeService: AiInvokeService,
    ) {
        super()
    }

    protected override async process(
        command: SplitCvFromTextCommand,
    ): Promise<SplitCvFromTextData> {
        const {
            request: {
                text,
            },
            user,
            locale,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const trimmed = text?.trim() ?? ""
        if (trimmed.length === 0) {
            throw new CvSplitEmptyTextException({
            })
        }

        const targetLanguage = (locale ?? Locale.En) === Locale.Vi
            ? "Vietnamese (Tiếng Việt)"
            : "English"

        const systemText = this.buildSystemPrompt(targetLanguage)
        const humanText = [
            "## Pasted CV / resume text",
            trimmed,
        ].join("\n")

        // synchronous, inline invoke via the shared balancer path -- no explicit
        // model pinned so the Auto lane climbs (Economy -> tier ceiling). Floor is
        // pinned to Economy EXPLICITLY (not left to the difficulty default): this
        // is structured JSON extraction against an 11-type schema, so the weakest
        // Free/local tier mangles the shape too often -- but it needs no reasoning,
        // so we do NOT floor higher (Balanced/Premium would be wasted here).
        const {
            text: raw,
        } = await this.aiInvokeService.run({
            userId: user.id,
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
            floor: AiModelCategory.Low,
            surface: AiCeilSurface.Grading,
            task: AiModelTask.CVGenerating,
        })

        const blocks = this.parseBlocks(raw)

        return {
            blocks,
        }
    }

    /**
     * Build the STRICT-JSON split prompt: describe the per-type item `fields`
     * schema + the output contract so the reply loads straight into the editor.
     */
    private buildSystemPrompt(
        targetLanguage: string,
    ): string {
        const jsonTemplate = [
            {
                id: "personal",
                type: "personal",
                title: "Thông tin cá nhân", // vn-ok: example CV block title in the split prompt template
                order: 0,
                items: [
                    {
                        id: "personal-1", fields: {
                            name: "Nguyễn Văn A", email: "a@email.com", phone: "0900000000" // vn-ok: example CV field values in the split prompt template
                        } 
                    },
                ],
            },
            {
                id: "exp",
                type: "experience",
                title: "Kinh nghiệm", // vn-ok: example CV block title in the split prompt template
                order: 1,
                items: [
                    {
                        id: "exp-1", fields: {
                            company: "Công ty X", role: "Backend Developer", startDate: "2022", endDate: "2024", bullets: "Xây API thanh toán; Tối ưu truy vấn" // vn-ok: example CV field values in the split prompt template
                        } 
                    },
                ],
            },
            {
                id: "skills",
                type: "skills",
                title: "Kỹ năng", // vn-ok: example CV block title in the split prompt template
                order: 2,
                items: [
                    {
                        id: "skill-1", fields: {
                            name: "TypeScript" 
                        } 
                    },
                    {
                        id: "skill-2", fields: {
                            name: "PostgreSQL" 
                        } 
                    },
                ],
            },
        ]
        const schemaLines = BLOCK_TYPES.map((type) => `- \`${type}\`: ${BLOCK_FIELD_SCHEMA[type]}`)
        return [
            "You are a CV parser. You are given a raw pasted CV / resume as free text.",
            "Split it into an ORDERED list of structured blocks a block editor can render.",
            "",
            "## Block types and their item `fields`",
            "Each block's `type` MUST be exactly one of these, and its items MUST use these EXACT field keys:",
            ...schemaLines,
            "",
            "## Rules",
            "- Every item is an object `{ id, fields }` where `fields` is an object using the keys above; ALL field VALUES are strings.",
            "- `personal` and `summary` have EXACTLY ONE item; every other type has ONE item per real entry (one item per job, per skill, per language, …).",
            "- Only include field keys you actually have. OMIT a key when the text does not provide it — do NOT invent employers, dates, degrees, metrics, links, or skills that are not present.",
            "- Use each block type AT MOST once (all jobs under one `experience` block, all skills under one `skills` block, …).",
            "- `order` starts at 0 and increases by 1 in reading order. Give each block + each item a short unique `id`.",
            "",
            "## Language",
            `Write human-readable values in **${targetLanguage}** ONLY IF the source text is in that language or unspecified; otherwise keep the source language. JSON keys + field keys stay in English.`,
            "",
            "## Output Format",
            "Respond with a SINGLE JSON ARRAY of block objects. Example shape (values illustrative):",
            "",
            JSON.stringify(
                jsonTemplate,
                null,
                2,
            ),
            "",
            "## JSON Formatting",
            "- Output STRICT JSON only — no markdown fences, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- The top-level value MUST be a JSON array (not an object).",
        ].join("\n")
    }

    /**
     * Parse + validate the model's STRICT JSON reply into an ordered block array
     * in the EXACT FE `CvBlock` shape: `{ id, type, title, order, items:[{id,
     * fields}] }`. Extracts the JSON block, `JSON.parse`, asserts an array, then
     * normalizes every item to `{ id, fields }` (salvaging an item the model
     * drifted into a bare string / a top-level-fields object). Throws on parse
     * failure or a non-array reply (never returns malformed data).
     */
    private parseBlocks(
        raw: string,
    ): Array<Record<string, unknown>> {
        let parsed: unknown
        try {
            parsed = JSON.parse(extractJsonBlock(raw))
        } catch (error) {
            throw new CvModelOutputParseException({
                stage: "split",
                originalError: error instanceof Error ? error : new Error(String(error)),
            })
        }

        if (!Array.isArray(parsed)) {
            throw new CvModelOutputShapeException({
                stage: "split",
                expected: "array",
            })
        }

        const asString = (value: unknown): string =>
            typeof value === "string" ? value : ""
        const allowedType = (value: unknown): (typeof BLOCK_TYPES)[number] =>
            typeof value === "string" && (BLOCK_TYPES as ReadonlyArray<string>).includes(value)
                ? value as (typeof BLOCK_TYPES)[number]
                : "summary"

        return (parsed as Array<Record<string, unknown>>).map((block, index) => {
            const record = block && typeof block === "object" ? block : {
            }
            const type = allowedType(record.type)
            const rawItemsAll = Array.isArray(record.items) ? record.items : []
            // `personal`/`summary` hold a single fields set -- keep only the first item.
            const rawItems = SINGLE_ITEM_TYPES.has(type) ? rawItemsAll.slice(0,
                1) : rawItemsAll
            const items = rawItems.map((item, itemIndex) => ({
                id: `item-${index}-${itemIndex}`,
                fields: this.normalizeItemFields(item,
                    type),
            }))
            return {
                id: asString(record.id) || `block-${index}`,
                type,
                title: asString(record.title),
                order: typeof record.order === "number" ? record.order : index,
                items,
            }
        })
    }

    /**
     * Coerce one model item into the FE `{fields}` shape (a `Record<string,
     * string>`): reads `item.fields` if present (else treats the object itself as
     * the fields), drops `id`/`fields` meta keys, stringifies values (array ->
     * newline-joined for `bullets`), and salvages a bare-string item into the
     * type's PRIMARY_FIELD_KEY.
     */
    private normalizeItemFields(
        item: unknown,
        type: (typeof BLOCK_TYPES)[number],
    ): Record<string, string> {
        if (typeof item === "string") {
            const value = item.trim()
            return value.length > 0 ? {
                [PRIMARY_FIELD_KEY[type]]: value 
            } : {
            }
        }
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            return {
            }
        }
        const record = item as Record<string, unknown>
        const source = record.fields && typeof record.fields === "object" && !Array.isArray(record.fields)
            ? record.fields as Record<string, unknown>
            : record
        const fields: Record<string, string> = {
        }
        for (const [key,
            value] of Object.entries(source)) {
            if (key === "id" || key === "fields") {
                continue
            }
            const stringified = this.coerceFieldValue(value)
            if (stringified.length > 0) {
                fields[key] = stringified
            }
        }
        return fields
    }

    /** Stringify a field value -- array -> newline-joined (e.g. `bullets`), scalar -> string. */
    private coerceFieldValue(
        value: unknown,
    ): string {
        if (typeof value === "string") {
            return value.trim()
        }
        if (Array.isArray(value)) {
            return value.filter((entry): entry is string => typeof entry === "string").join("\n")
        }
        if (typeof value === "number" || typeof value === "boolean") {
            return String(value)
        }
        return ""
    }
}
