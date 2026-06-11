import {
    Injectable,
} from "@nestjs/common"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    FlashcardLevel,
    Locale,
} from "@modules/databases"
import {
    InterviewVerdict,
    type BuildInterviewGradePromptParams,
    type BuildInterviewGradePromptResult,
} from "./types/interview-grade"

/**
 * Maps a {@link Locale} to the human-readable language name injected into the
 * prompt so the model writes its feedback strings in the requested language.
 * Mirrors the language map used by the challenge grade step.
 */
const LOCALE_LANGUAGE_MAP: Record<string, string> = {
    [Locale.En]: "English",
    [Locale.Vi]: "Vietnamese (Tiếng Việt)",
}

/**
 * Maps a card's {@link FlashcardLevel} to a one-line expectation the model uses
 * to scale how strict the grading should be (junior recall → staff systemic).
 */
const LEVEL_EXPECTATION_MAP: Record<FlashcardLevel, string> = {
    [FlashcardLevel.Junior]: "Junior — expect correct recall and basic mechanics; do not demand deep tradeoffs.",
    [FlashcardLevel.Middle]: "Middle — expect the concept applied correctly in practice with some nuance.",
    [FlashcardLevel.Senior]: "Senior — expect tradeoffs, design reasoning, and awareness of failure modes.",
    [FlashcardLevel.Staff]: "Staff / Architect — expect systemic, cross-cutting reasoning under ambiguity.",
}

/**
 * Pure builder for the interview-answer grading prompt. No I/O and no
 * injected dependencies — it only turns a question + rubric + transcript into
 * the system/human chat messages the AI invoke service consumes.
 */
@Injectable()
export class InterviewGradePromptService {
    /**
     * Build the grading messages for one interview answer.
     *
     * @param params - Question, model-answer rubric, level, transcript, and locale.
     * @returns The ordered system + human chat messages.
     */
    build(
        params: BuildInterviewGradePromptParams,
    ): BuildInterviewGradePromptResult {
        const {
            question,
            modelAnswer,
            level,
            transcript,
            locale,
        } = params

        // language the human-readable feedback strings must be written in
        const targetLanguage = LOCALE_LANGUAGE_MAP[locale] ?? "English"
        // how strict to grade, scaled by the card's seniority level (or a neutral default)
        const levelExpectation = level
            ? LEVEL_EXPECTATION_MAP[level]
            : "Unspecified level — grade the substance on its own merits."

        // a literal example object pins the exact JSON shape the model must emit
        const exampleJson = JSON.stringify(
            {
                score: 72,
                verdict: InterviewVerdict.Borderline,
                strengths: [
                    "First concrete thing the candidate got right.",
                ],
                gaps: [
                    "Concrete thing that was missing, framed as what to add.",
                ],
                modelAnswerHint: "One-line nudge toward the model answer, or null.",
                followUpQuestion: "A natural follow-up question, or null.",
            },
            null,
            2,
        )

        const systemText = [
            "You are a senior technical interviewer grading a candidate's spoken answer to one interview question.",
            "",
            "## Speech-to-text caveat",
            "The candidate's answer was captured by speech-to-text. IGNORE spelling, casing, punctuation, and",
            "mis-recognized technical terms (e.g. \"node js\" for \"Node.js\", \"sequel\" for \"SQL\"). Grade the SUBSTANCE",
            "of what they meant, not transcription noise.",
            "",
            "## Level expectation",
            levelExpectation,
            "",
            "## Question",
            question,
            "",
            "## Model answer (grading rubric)",
            "Use the model answer below as the rubric for what a strong response covers. The candidate does NOT",
            "need to match it word-for-word — reward correct substance and equivalent reasoning.",
            "",
            modelAnswer,
            "",
            "## Scoring",
            "- score: an integer from 0 to 100 reflecting how well the answer covers the rubric at the stated level.",
            "- verdict: one of \"pass\", \"borderline\", or \"fail\".",
            "- strengths: concrete things the candidate got right (may be empty).",
            "- gaps: concrete things missing or wrong, each framed as what to add (may be empty).",
            "- modelAnswerHint: a single short sentence nudging toward the model answer, or null.",
            "- followUpQuestion: a natural follow-up an interviewer would ask next, or null.",
            "",
            "## Language",
            `Write strengths, gaps, modelAnswerHint, and followUpQuestion in **${targetLanguage}**.`,
            "JSON keys stay in English; verdict stays one of the lowercase English literals above.",
            "",
            "## Output format",
            "Respond with a SINGLE JSON object matching this shape exactly (replace the placeholder values):",
            "",
            exampleJson,
            "",
            "## JSON formatting",
            "- Output STRICT JSON only — no markdown fences, no prose, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- Use null (not the string \"null\") for an absent modelAnswerHint or followUpQuestion.",
        ].join("\n")

        const humanText = [
            "Here is the candidate's transcribed answer to grade:",
            "",
            transcript.trim() || "(the candidate gave no answer)",
        ].join("\n")

        return {
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
        }
    }
}
