import OpenAI from "openai"
import {
    readHarnessOpenRouterJudgeApiKey,
} from "./harness-credentials"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const JUDGE_MODEL = "openai/gpt-5.6-luna"

/** Structured grading result returned by {@link judge}. */
export interface Verdict {
    pass: boolean
    score: number
    reasons: Array<string>
}

const VERDICT_SCHEMA = {
    type: "object",
    properties: {
        pass: {
            type: "boolean",
        },
        score: {
            type: "integer",
            minimum: 0,
            maximum: 100,
        },
        reasons: {
            type: "array",
            items: {
                type: "string",
            },
        },
    },
    required: [
        "pass",
        "score",
        "reasons",
    ],
    additionalProperties: false,
} as const

const parseVerdict = (content: string | null): Verdict => {
    if (!content) {
        throw new Error("OpenRouter judge returned no verdict")
    }

    const parsed = JSON.parse(content) as Partial<Verdict>
    if (typeof parsed.pass !== "boolean"
        || !Number.isInteger(parsed.score)
        || (parsed.score as number) < 0
        || (parsed.score as number) > 100
        || !Array.isArray(parsed.reasons)
        || !parsed.reasons.every((reason) => typeof reason === "string")) {
        throw new Error("OpenRouter judge returned an invalid verdict")
    }

    return parsed as Verdict
}

/** Grade one free-form answer with an independently keyed Luna call. */
export const judge = async (
    rubric: string,
    output: string,
): Promise<Verdict> => {
    const client = new OpenAI({
        apiKey: readHarnessOpenRouterJudgeApiKey(),
        baseURL: OPENROUTER_BASE_URL,
    })
    const response = await client.chat.completions.create({
        model: JUDGE_MODEL,
        temperature: 0,
        messages: [
            {
                role: "system",
                content: [
                    "Evaluate the candidate answer strictly against the supplied rubric.",
                    "Score overall rubric compliance from 0 to 100.",
                    "Set pass to true if and only if score is at least 60; pass and score must agree.",
                    "Return only the requested JSON verdict.",
                ].join(" "),
            },
            {
                role: "user",
                content: `RUBRIC:\n${rubric}\n\nOUTPUT:\n${output}`,
            },
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "harness_verdict",
                strict: true,
                schema: VERDICT_SCHEMA,
            },
        },
    })

    return parseVerdict(response.choices[0]?.message.content ?? null)
}
