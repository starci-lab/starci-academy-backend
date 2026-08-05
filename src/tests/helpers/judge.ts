import {
    jsonSchemaOutputFormat 
} from "@anthropic-ai/sdk/helpers/json-schema"

import {
    client,
    withRateLimitRetry,
} from "./models"

/**
 * Structured grading result returned by {@link judge} for one rubric+output pair.
 */
export interface Verdict {
    /** Whether the output satisfies the rubric overall. */
    pass: boolean
    /** Integer quality score the judge assigned (0-100). */
    score: number
    /** The judge's stated reasons for the verdict. */
    reasons: Array<string>
}

/**
 * JSON schema constraining {@link judge}'s structured output via
 * `output_config.format` -- see the Claude API structured-outputs feature.
 */
const VERDICT_SCHEMA = {
    type: "object",
    properties: {
        pass: {
            type: "boolean",
        },
        score: {
            type: "integer",
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

/**
 * Grade one harness output against a rubric using Sonnet 5 as an independent
 * judge, pinned at `effort: "high"` regardless of which tier produced the
 * output under test -- grading rigor must not vary with the SUT's cost tier.
 *
 * The effort, not the model, is what carries the rigor here: the judge reads a
 * rubric and a candidate answer, which is a bounded comparison rather than an
 * open-ended generation. Opus at high effort did the same job and made the lane
 * take over an hour, since every call is serialised.
 *
 * @param rubric - the grading criteria the output must satisfy
 * @param output - the text under evaluation
 * @returns the structured {@link Verdict} parsed straight from the model
 */
export const judge = async (
    rubric: string,
    output: string,
): Promise<Verdict> => {
    const res = await withRateLimitRetry(() => client.messages.parse({
        model: "claude-sonnet-5",
        max_tokens: 2048,
        output_config: {
            effort: "high",
            format: jsonSchemaOutputFormat(VERDICT_SCHEMA),
        },
        messages: [
            {
                role: "user",
                content: `RUBRIC:\n${rubric}\n\nOUTPUT:\n${output}`,
            },
        ],
    }))

    return res.parsed_output as Verdict
}
