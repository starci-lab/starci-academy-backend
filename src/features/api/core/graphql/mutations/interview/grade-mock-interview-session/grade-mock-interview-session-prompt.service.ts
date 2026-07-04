import {
    Injectable,
} from "@nestjs/common"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    Locale,
} from "@modules/databases"
import {
    MockInterviewVerdict,
    type BuildMockInterviewGradePromptParams,
    type BuildMockInterviewGradePromptResult,
} from "./types"

/**
 * Maps a {@link Locale} to the human-readable language name injected into the
 * prompt so the model writes its feedback strings in the requested language.
 * Mirrors the language map used by the flashcard interview grade step.
 */
const LOCALE_LANGUAGE_MAP: Record<string, string> = {
    [Locale.En]: "English",
    [Locale.Vi]: "Vietnamese (Tiếng Việt)",
}

/**
 * Maps a session's seniority level string to a one-line expectation the model
 * uses to scale how strict the grading should be (junior recall → staff
 * systemic reasoning). Level is a free-form string on the session (not a
 * flashcard-domain enum), so lookups fall through to a neutral default for
 * any value that is not one of the four canonical bands.
 */
const LEVEL_EXPECTATION_MAP: Record<string, string> = {
    junior: "Junior — expect correct recall of the fundamentals and basic mechanics; do not demand deep tradeoffs.",
    middle: "Middle — expect the concepts applied correctly in practice with some nuance.",
    senior: "Senior — expect tradeoffs, design reasoning, and awareness of failure modes.",
    staff: "Staff / Architect — expect systemic, cross-cutting reasoning under ambiguity.",
}

/**
 * Pure builder for the mock-interview SESSION grading prompt. No I/O and no
 * injected dependencies — it only turns a prompt title + 5-phase rubric +
 * recorded transcript + RAG course excerpt into the system/human chat
 * messages the AI invoke service consumes. Grades the WHOLE session once, at
 * the end of the interview, rather than one question at a time.
 */
@Injectable()
export class MockInterviewGradePromptService {
    /**
     * Build the grading messages for one whole mock-interview session.
     *
     * @param params - Prompt title, level, the full transcript, the RAG
     *   course excerpt, and the target locale.
     * @returns The ordered system + human chat messages.
     */
    build(
        params: BuildMockInterviewGradePromptParams,
    ): BuildMockInterviewGradePromptResult {
        const {
            promptTitle,
            level,
            turns,
            courseExcerpt,
            locale,
        } = params

        // language the human-readable feedback strings must be written in
        const targetLanguage = LOCALE_LANGUAGE_MAP[locale] ?? "English"
        // how strict to grade, scaled by the session's requested seniority level
        // (or a neutral default when the level is unspecified/unrecognized)
        const normalizedLevel = level?.trim().toLowerCase()
        const levelExpectation = normalizedLevel && LEVEL_EXPECTATION_MAP[normalizedLevel]
            ? LEVEL_EXPECTATION_MAP[normalizedLevel]
            : "Unspecified level — grade the substance on its own merits."

        // course-material section: either the retrieved excerpt, or an explicit
        // note that retrieval found nothing so the model knows to fall back to
        // its own general knowledge of the subject rather than silently under-grading
        const courseMaterialSection = courseExcerpt.trim()
            ? courseExcerpt
            : "(No course material was retrieved for this session — grade against sound general practice for the subject.)"

        // a literal example object pins the exact JSON shape the model must emit;
        // phase keys are illustrative — the model picks whichever of the 5
        // canonical phases it actually observed being covered in the transcript
        const exampleJson = JSON.stringify(
            {
                overallScore: 78,
                verdict: MockInterviewVerdict.Borderline,
                phaseScores: [
                    {
                        phase: "requirements",
                        score: 18,
                        max: 20,
                    },
                    {
                        phase: "estimation",
                        score: 12,
                        max: 20,
                    },
                    {
                        phase: "highLevel",
                        score: 22,
                        max: 25,
                    },
                    {
                        phase: "deepDive",
                        score: 16,
                        max: 25,
                    },
                    {
                        phase: "tradeoffs",
                        score: 10,
                        max: 10,
                    },
                ],
                attributeScores: [
                    {
                        key: "communication",
                        score: 80,
                    },
                    {
                        key: "structuredThinking",
                        score: 74,
                    },
                    {
                        key: "tradeoffAwareness",
                        score: 70,
                    },
                ],
                strengths: [
                    "First concrete thing the candidate got right.",
                ],
                gaps: [
                    "Concrete thing that was missing, framed as what to add.",
                ],
                followUpQuestion: "A natural follow-up question, or null.",
            },
            null,
            2,
        )

        // join every recorded turn into one readable transcript block, tagging
        // each line with its phase so the model can attribute coverage per phase
        const transcriptText = turns
            .map((turn) => `[${turn.phase}] ${turn.role}: ${turn.content}`)
            .join("\n")

        const systemText = [
            "You are a senior technical interviewer producing the FINAL scorecard for a candidate who just",
            `completed a full mock interview about "${promptTitle}", grounded in what this course actually teaches.`,
            "",
            "## Speech-to-text caveat",
            "The candidate's spoken turns were captured by speech-to-text. IGNORE spelling, casing, punctuation, and",
            "mis-recognized technical terms (e.g. \"sequel\" for \"SQL\", \"cash\" for \"cache\"). Grade the SUBSTANCE of",
            "what they meant, not transcription noise.",
            "",
            "## Level expectation",
            levelExpectation,
            "",
            "## Course material",
            "Weight correctness against what THIS COURSE actually taught below — not generic industry knowledge that",
            "contradicts it. When the transcript diverges from the course's approach, treat the course's approach as",
            "the source of truth for what counts as a strong answer.",
            "",
            courseMaterialSection,
            "",
            "## The 5-phase rubric",
            "Score EACH of the 5 canonical interview phases the candidate actually engaged with, based on how much of",
            "the transcript addresses it:",
            "- requirements: clarifying requirements and expected outcomes.",
            "- estimation: scoping and estimation of the approach (scale, effort, surface area).",
            "- highLevel: the major pieces of the solution and how they fit together at a high level.",
            "- deepDive: deep dive into the pieces the interviewer picked.",
            "- tradeoffs: trade-offs, risks, and failure modes.",
            "",
            "Assign each scored phase a `max` you judge fair for how much weight it deserves in THIS session, such",
            "that every phase's `max` SUMS TO EXACTLY 100 across all phases you include. Omit a phase entirely only",
            "if the transcript never touched it at all.",
            "",
            "## Attributes",
            "In addition to the phase breakdown, score 2 to 3 named attributes 0 to 100 each, chosen from:",
            "communication (clarity, structure of explanation), structuredThinking (organized problem-solving",
            "approach), tradeoffAwareness (recognizing and reasoning about tradeoffs).",
            "",
            "## Scoring",
            "- overallScore: an integer from 0 to 100 — the holistic score for the whole session, informed by (but",
            "  not required to be a mechanical average of) the phase and attribute breakdowns.",
            "- verdict: one of \"pass\", \"borderline\", or \"fail\".",
            "- strengths: concrete things the candidate got right across the session (may be empty).",
            "- gaps: concrete things missing or wrong, each framed as what to add (may be empty).",
            "- followUpQuestion: a natural follow-up an interviewer would ask next, or null.",
            "",
            "## Language",
            `Write strengths, gaps, and followUpQuestion in **${targetLanguage}**.`,
            "JSON keys stay in English; phase keys stay one of the 5 lowercase English literals above; verdict",
            "stays one of the lowercase English literals above.",
            "",
            "## Output format",
            "Respond with a SINGLE JSON object matching this shape exactly (replace the placeholder values):",
            "",
            exampleJson,
            "",
            "## JSON formatting",
            "- Output STRICT JSON only — no markdown fences, no prose, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- Use null (not the string \"null\") for an absent followUpQuestion.",
        ].join("\n")

        const humanText = [
            "Here is the full transcript of the completed mock interview to grade:",
            "",
            transcriptText || "(no turns were recorded for this session)",
        ].join("\n")

        return {
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
        }
    }
}
