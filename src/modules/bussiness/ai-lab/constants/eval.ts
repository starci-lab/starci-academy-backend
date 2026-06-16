import {
    Locale,
} from "@modules/databases"
import type {
    BuildJudgePromptParams,
    BuildJudgePromptResult,
} from "../types"

/**
 * Default cosine-similarity threshold for an embedding-metric case when the
 * eval case itself does not pin one. 0.8 keeps near-paraphrases passing while
 * rejecting semantically different answers.
 */
export const DEFAULT_EMBEDDING_THRESHOLD = 0.8

/**
 * Placeholder token in a submitted user template that each eval case's input is
 * substituted into before invoking the model.
 */
export const TEMPLATE_INPUT_PLACEHOLDER = "{{input}}"

/**
 * Build the system + user prompt pair handed to the LLM judge for one eval case.
 *
 * The judge returns strict JSON `{ "score": 0..1, "feedback": string }` scoring
 * how well the candidate output satisfies the rubric for the given input. Kept
 * deterministic (caller invokes at temperature 0) so the same output grades the
 * same.
 *
 * @param params - Rubric, the case input, and the candidate output to judge.
 * @returns The system and user prompt strings for the judge invoke.
 */
export const buildJudgePrompt = (
    {
        rubric,
        input,
        actualOutput,
        locale,
    }: BuildJudgePromptParams,
): BuildJudgePromptResult => {
    // pick the human language the judge writes its feedback in (content is bilingual)
    const feedbackLanguage = locale === Locale.Vi
        ? "Vietnamese"
        : "English"
    // strict-JSON contract so extractJsonBlock + JSON.parse always succeed downstream
    const system = [
        "You are a strict grader for an AI prompt-engineering exercise.",
        "Score how well the CANDIDATE OUTPUT satisfies the RUBRIC for the given INPUT.",
        "Respond with ONLY a JSON object of the exact shape:",
        "{ \"score\": <number between 0 and 1>, \"feedback\": <string> }",
        `Write the feedback in ${feedbackLanguage}. Do not add any prose outside the JSON.`,
    ].join("\n")
    // fence the three payloads so the judge cannot confuse rubric / input / output
    const user = [
        "RUBRIC:",
        rubric,
        "",
        "INPUT:",
        input,
        "",
        "CANDIDATE OUTPUT:",
        actualOutput,
    ].join("\n")
    return {
        system,
        user,
    }
}
