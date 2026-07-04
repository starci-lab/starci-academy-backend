import {
    Injectable,
} from "@nestjs/common"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    Locale,
    MockInterviewPhase,
} from "@modules/databases"
import {
    ContentRagRetrievalService,
} from "@modules/rag"
import type {
    PrepareMockInterviewTurnParams,
    PrepareMockInterviewTurnResult,
} from "./types"

/**
 * Maps a {@link Locale} to the human-readable language name injected into the
 * prompt so the interviewer writes its question in the requested language.
 * Mirrors the language map used by the flashcard interview-grade prompt.
 */
const LOCALE_LANGUAGE_MAP: Record<string, string> = {
    [Locale.En]: "English",
    [Locale.Vi]: "Vietnamese (Tiếng Việt)",
}

/**
 * Human-readable label + one-line intent for each canonical interview phase,
 * injected into the system prompt so the model knows exactly what to probe
 * for the CURRENT phase (and stays on-rails instead of drifting to a phase
 * out of order).
 */
const PHASE_GUIDANCE_MAP: Record<MockInterviewPhase, string> = {
    [MockInterviewPhase.Requirements]:
        "Requirements clarification — probe functional requirements, non-functional " +
        "requirements (scale, constraints, quality bar), and expected outcomes. Do not let the " +
        "candidate skip straight to a solution yet.",
    [MockInterviewPhase.Estimation]:
        "Estimation & scoping — probe concrete numbers/effort for the plan (scale, load, timeline, " +
        "surface area) and a rough shape of the approach. Push for concrete substance, not hand-waving.",
    [MockInterviewPhase.HighLevel]:
        "High-level approach — probe the major pieces of the solution and how they fit together " +
        "at a high level.",
    [MockInterviewPhase.DeepDive]:
        "Deep dive — pick 2-3 pieces from the candidate's high-level approach and probe them in " +
        "depth (implementation detail, algorithm, or strategy for that piece).",
    [MockInterviewPhase.Tradeoffs]:
        "Trade-offs & failure modes — probe risks, weak points, and the trade-offs behind the " +
        "candidate's key decisions.",
}

/**
 * Pure(-ish) prompt builder for one turn of the mock interview. The ONLY I/O
 * it performs is a RAG lookup (course-wide, read-only) to ground the
 * interviewer's next question in what the course actually taught — it does
 * not persist anything and has no other side effects, mirroring the shape of
 * {@link import("@modules/bussiness").InterviewGradePromptService}.
 *
 * Kept local to the `/mock_interview` socket module (not registered on the
 * global bussiness module) because it is only ever consumed by
 * {@link import("./mock-interview.gateway").MockInterviewGateway}.
 */
@Injectable()
export class MockInterviewTurnService {
    constructor(
        private readonly contentRagRetrievalService: ContentRagRetrievalService,
    ) { }

    /**
     * Build the chat messages for the interviewer's next turn.
     *
     * Grounds the question in the course material via a course-wide RAG
     * retrieval (query = the candidate's latest answer when present, else the
     * prompt title so the very first question still pulls something relevant),
     * then instructs the model to stay strictly within the current canonical
     * phase and to degrade to a generic-but-still-on-rails question when the
     * retrieved excerpt comes back empty (index missing / retrieval failure —
     * {@link ContentRagRetrievalService} already degrades gracefully on its end).
     *
     * @param params - Course scope, prompt title, current phase, transcript, and locale.
     * @returns One system message (persona + rules + course excerpt) plus one
     * human message (transcript replay + the "ask your next question" instruction).
     */
    async prepareTurn(
        {
            courseId,
            promptTitle,
            phase,
            history,
            latestAnswer,
            locale,
        }: PrepareMockInterviewTurnParams,
    ): Promise<PrepareMockInterviewTurnResult> {
        // ground on the candidate's latest answer when there is one (keeps the
        // retrieval on-topic with where the conversation currently is); fall
        // back to the prompt title on the opening turn so there is still a
        // meaningful query to search with
        const retrievalQuery = latestAnswer.trim() || promptTitle
        const {
            excerpt,
        } = await this.contentRagRetrievalService.retrieveCourseExcerpt({
            courseId,
            query: retrievalQuery,
            // pull a slightly larger window than the single-lesson chat (8 vs the
            // content-ai default) since this spans the WHOLE course, not one lesson
            topK: 8,
        })

        // language the interviewer's question text must be written in
        const targetLanguage = LOCALE_LANGUAGE_MAP[locale] ?? "English"
        // phase-specific probing guidance for the CURRENT phase only — the model
        // must not jump ahead to a later phase on its own
        const phaseGuidance = PHASE_GUIDANCE_MAP[phase]

        const systemText = [
            "You are a senior technical interviewer running a live mock interview about"
                + ` "${promptTitle}", grounded in what this course actually teaches.`,
            "",
            "## Interview structure (STRICT)",
            "The interview follows exactly five phases, always in this order:",
            "1. requirements — clarify requirements and expected outcomes",
            "2. estimation — scoping and estimation of the approach",
            "3. highLevel — high-level plan/approach",
            "4. deepDive — deep dive into selected pieces",
            "5. tradeoffs — trade-offs and failure modes",
            "",
            `You are CURRENTLY in the "${phase}" phase. Ask exactly ONE focused question, probe, or`,
            "follow-up appropriate to THIS phase only — do not jump ahead to a later phase and do not",
            "revisit an earlier one. Guidance for this phase:",
            phaseGuidance,
            "",
            "## Grounding (STRICT — stay on-rails)",
            "Ground your question in the course material excerpt below. The excerpt was retrieved from",
            "THIS course's lessons and is the only source of truth for what topics are in-scope. Do NOT",
            "drift into concepts, technologies, or patterns the course excerpt gives no basis for.",
            excerpt
                ? "If the excerpt is empty this turn, ask a generic-but-still-on-rails question for the"
                    + " current phase using only the interview structure above (do not invent course content)."
                : "The excerpt below is EMPTY this turn (retrieval found nothing relevant) — ask a"
                    + " generic-but-still-on-rails question for the current phase using only the interview"
                    + " structure above. Do not invent or assume specific course content.",
            "",
            "## Course material",
            excerpt || "(no excerpt retrieved for this turn)",
            "",
            "## Candidate reference",
            "When the candidate has already answered (see the transcript in the next message),",
            "reference what they said specifically — acknowledge it briefly, then probe deeper or move",
            "to the next natural question within the current phase. Do not repeat a question already asked.",
            "",
            "## Language",
            `Write the interviewer's question in **${targetLanguage}**.`,
            "",
            "## Output format",
            "Respond with ONLY the interviewer's next question/probe as plain text — no JSON, no markdown",
            "fences, no meta-commentary, no restating these instructions.",
        ].join("\n")

        // replay the transcript so the model has continuity — joined as
        // "role: content" lines, oldest first, mirroring the interview-grade
        // prompt's transcript-replay idiom
        const transcriptLines = history.map(
            (entry) => `${entry.role}: ${entry.content}`,
        )
        const humanText = [
            "Transcript so far:",
            "",
            transcriptLines.length > 0
                ? transcriptLines.join("\n")
                : "(no turns yet — this is the opening question)",
            "",
            `It is now the "${phase}" phase. Ask your next question.`,
        ].join("\n")

        return {
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
        }
    }
}
