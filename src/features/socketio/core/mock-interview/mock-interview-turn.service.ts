import {
    Injectable,
} from "@nestjs/common"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MockInterviewKind,
    normalizeMockInterviewKind,
} from "@modules/databases/postgresql/primary/enums/mock-interview-kind"
import {
    MockInterviewMode,
} from "@modules/databases/postgresql/primary/enums/mock-interview-mode"
import {
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"
import {
    CourseRagRetrievalService,
} from "@modules/integrations/rag/course-rag-retrieval.service"
import type {
    PrepareMockInterviewTurnParams,
    PrepareMockInterviewTurnResult,
} from "./types/mock-interview-turn"

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
 * Maps a session's seniority level string to a one-line expectation the model
 * uses to scale how hard/deep its questions should probe (junior recall ->
 * staff systemic reasoning). Mirrors the grading-time level map in
 * {@link import(
 * "@api/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-prompt.service"
 * ).MockInterviewGradePromptService} so the interviewer's difficulty and the
 * grader's expectations stay in lockstep. Level is a free-form string on the
 * session (not an enum) -- an unrecognized value falls through to a neutral
 * "no seniority steer" (no line is injected).
 */
const LEVEL_EXPECTATION_MAP: Record<string, string> = {
    junior: "Junior — expect correct recall of the fundamentals and basic mechanics; do not demand deep tradeoffs.",
    middle: "Middle — expect the concepts applied correctly in practice with some nuance.",
    senior: "Senior — expect tradeoffs, design reasoning, and awareness of failure modes.",
    staff: "Staff / Architect — expect systemic, cross-cutting reasoning under ambiguity.",
}

/**
 * Human-readable label + one-line intent for each canonical interview phase,
 * injected into the system prompt so the model knows exactly what to probe
 * for the CURRENT phase (and stays on-rails instead of drifting to a phase
 * out of order). Used only for mode="design".
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
 * Human-readable label + the exact cognitive-framing instruction for each of
 * the 3 per-question kinds -- the SAME seed topic gets asked completely
 * differently depending on which frame it was RANDOMLY assigned at draw time
 * (controlled prompting over Bloom's taxonomy tiers; "mode split" 2026-07-06).
 */
const QNA_KIND_FRAMING_MAP: Record<string, string> = {
    [MockInterviewKind.Theory]:
        "THEORY — ask the seed topic in its NATURAL definitional form (\"What is X? How does X differ from " +
        "Y? What problem does X solve?\"). This probes RECALL/UNDERSTANDING — you are checking whether the " +
        "candidate actually knows the concept, not whether they can reason about when to use it.",
    [MockInterviewKind.Reasoning]:
        "REASONING — reframe the seed topic into a WHEN/WHY/TRADEOFF question (\"When would you reach for X " +
        "over Y? What do you give up by choosing X? Why does X exist instead of just using Y?\"). This probes " +
        "ANALYSIS/EVALUATION — you are checking whether the candidate can reason about the topic, not just recite it.",
    [MockInterviewKind.Scenario]:
        "SCENARIO — reframe the seed topic into an INCIDENT/APPLY question grounded in a concrete situation " +
        "(\"Production just broke because of <topic-related failure> — how do you debug/fix it? A teammate " +
        "misused X and it caused <concrete symptom> — what happened and how do you prevent it?\"). This probes " +
        "APPLICATION under pressure — you are checking whether the candidate can apply the concept to a real " +
        "situation, not just define it.",
}

@Injectable()
/**
 * Pure(-ish) prompt builder for one turn of the mock interview. The ONLY I/O
 * it performs is a RAG lookup (course-wide, read-only) to ground the
 * interviewer's next question in what the course actually taught -- it does
 * not persist anything and has no other side effects, mirroring the shape of
 * {@link import("@modules/bussiness").InterviewGradePromptService}.
 *
 * Branches on {@link PrepareMockInterviewTurnParams.mode} ("mode split",
 * 2026-07-06): mode="design" runs the EXISTING 5-phase flow unchanged;
 * mode="qna" runs the N-question flow where each question is seeded by a
 * drawn flashcard topic and FRAMED per ITS OWN randomly-assigned kind's
 * cognitive lens (definitional / when-why-tradeoff / incident-apply) -- a
 * single qna session mixes kinds across its questions.
 *
 * Kept local to the `/mock_interview` socket module (not registered on the
 * global bussiness module) because it is only ever consumed by
 * {@link import("./mock-interview.gateway").MockInterviewGateway}.
 */
export class MockInterviewTurnService {
    constructor(
        private readonly contentRagRetrievalService: CourseRagRetrievalService,
    ) { }

    /**
     * Build the chat messages for the interviewer's next turn -- dispatches to
     * {@link prepareDesignTurn} (mode="design", the existing 5-phase flow) or
     * {@link prepareQnaTurn} (mode="qna"), based on
     * {@link PrepareMockInterviewTurnParams.mode}.
     *
     * @param params - {@link PrepareMockInterviewTurnParams}
     * @returns One system message (persona + rules + course excerpt) plus one
     * human message (transcript replay + the "ask your next question" instruction).
     */
    async prepareTurn(
        params: PrepareMockInterviewTurnParams,
    ): Promise<PrepareMockInterviewTurnResult> {
        return params.mode === MockInterviewMode.Design
            ? this.prepareDesignTurn(params)
            : this.prepareQnaTurn(params)
    }

    /**
     * mode="design" turn builder -- UNCHANGED from before the mode split.
     * Grounds the question in the course material via a course-wide RAG
     * retrieval (query = the candidate's latest answer when present, else the
     * prompt title so the very first question still pulls something relevant),
     * then instructs the model to stay strictly within the current canonical
     * phase and to degrade to a generic-but-still-on-rails question when the
     * retrieved excerpt comes back empty (index missing / retrieval failure --
     * {@link CourseRagRetrievalService} already degrades gracefully on its end).
     *
     * @param params - Course scope, prompt title, current phase, transcript, locale, and level.
     * @returns One system message (persona + rules + course excerpt) plus one
     * human message (transcript replay + the "ask your next question" instruction).
     */
    private async prepareDesignTurn(
        {
            courseId,
            promptTitle,
            phase,
            history,
            latestAnswer,
            locale,
            level,
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
        // phase-specific probing guidance for the CURRENT phase only -- the model
        // must not jump ahead to a later phase on its own
        const phaseGuidance = PHASE_GUIDANCE_MAP[phase]
        // how hard/deep to probe, scaled by the session's requested seniority
        // level -- unset/unrecognized level means no steer at all (current
        // behavior is preserved: the model just picks its own difficulty)
        const levelExpectation = this.resolveLevelExpectation(level)

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
            ...(levelExpectation
                ? [
                    "## Level expectation",
                    "Scale the difficulty and depth of your question to this seniority level:",
                    levelExpectation,
                    "",
                ]
                : []),
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
            this.workspaceArtifactsGuidance(),
            "",
            "## Language",
            `Write the interviewer's question in **${targetLanguage}**.`,
            "",
            "## Output format",
            "Respond with ONLY the interviewer's next question/probe as plain text — no JSON, no markdown",
            "fences, no meta-commentary, no restating these instructions.",
        ].join("\n")

        // replay the transcript so the model has continuity -- joined as
        // "role: content" lines, oldest first, mirroring the interview-grade
        // prompt's transcript-replay idiom
        const humanText = [
            "Transcript so far:",
            "",
            this.transcriptLines(history),
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

    /**
     * The `mode="qna"` turn builder -- "mode split" (2026-07-06). Each
     * question is SEEDED by one drawn flashcard topic (`currentSeed`) and
     * FRAMED through THIS QUESTION's own randomly-assigned cognitive frame
     * (see {@link QNA_KIND_FRAMING_MAP}) -- a single qna session mixes kinds
     * across its questions, so `kind` is read PER-ASK, not once for the whole
     * session. Grounds with content-scoped RAG on the seed topic itself (not
     * the whole course -- a qna question is about ONE topic, not a whole
     * system). Allows 1-2 AI follow-ups on the SAME seed before the FE
     * advances to the next one (detected by whether `history` already
     * contains a turn about the current seed -- the FIRST ask of a seed gets
     * an opening question, subsequent asks get a follow-up probe).
     *
     * @param params - Course scope, prompt title, this question's kind, current seed + index, transcript, locale, and level.
     * @returns One system message (persona + rules + kind framing + course excerpt) plus one
     * human message (transcript replay + the "ask your next question" instruction).
     */
    private async prepareQnaTurn(
        {
            courseId,
            promptTitle,
            kind,
            currentSeed,
            questionIndex,
            history,
            latestAnswer,
            locale,
            level,
        }: PrepareMockInterviewTurnParams,
    ): Promise<PrepareMockInterviewTurnResult> {
        const seedTopic = currentSeed?.trim() || promptTitle
        // ground on the seed topic itself (kept stable across the opening ask +
        // every follow-up on the SAME seed) rather than the candidate's latest
        // answer -- a qna question is about ONE narrow topic, not a whole system,
        // so drifting the retrieval query to whatever the candidate just said
        // risks pulling unrelated excerpts once the conversation moves on
        const {
            excerpt,
        } = await this.contentRagRetrievalService.retrieveCourseExcerpt({
            courseId,
            query: seedTopic,
            topK: 5,
        })

        const targetLanguage = LOCALE_LANGUAGE_MAP[locale] ?? "English"
        const levelExpectation = this.resolveLevelExpectation(level)
        // THIS question's own kind -- never trust an un-normalized value (an
        // unrecognized/absent kind falls back to "theory", mirroring the grading
        // service's own per-seed normalization)
        const normalizedKind = normalizeMockInterviewKind(kind)
        const kindFraming = QNA_KIND_FRAMING_MAP[normalizedKind] ?? QNA_KIND_FRAMING_MAP[MockInterviewKind.Theory]
        // the FIRST ask of a seed has no prior turn about it (history is either
        // empty, or ends right after the FE swapped to a new seed with no
        // candidate answer recorded for it yet) -- the caller (gateway) always
        // sends latestAnswer="" on that very first ask of a seed, mirroring the
        // design flow's "empty latestAnswer = opening turn" convention
        const isOpeningAskOfSeed = latestAnswer.trim().length === 0
        const displayIndex = (questionIndex ?? 0) + 1

        // interview-bank seeds carry a FULL authored question (long, and/or with a
        // fenced code block / mermaid diagram folded in) -- deliver it VERBATIM,
        // never reframe. flashcard-fallback seeds are short topic labels -> frame
        // a {kind}-shaped question about them (the original behavior below).
        const isAuthoredPrompt = seedTopic.length > 160
            || /```|(?:^|\n)\s*(?:graph|flowchart|sequenceDiagram|erDiagram|classDiagram)\b/.test(seedTopic)

        const framedSystemText = [
            `You are a senior technical interviewer running a live mock interview, question ${displayIndex}`
                + ` of the session ("${promptTitle}"), grounded in what this course actually teaches.`,
            "",
            "## Question format (STRICT)",
            "This is a SINGLE-TOPIC question, not a multi-phase design interview. You ask ONE question about",
            "ONE seed topic, allow the candidate to answer, then may ask AT MOST ONE OR TWO short follow-up",
            "probes on the SAME topic before the conversation moves to the next question (the client decides",
            "when to move on — you never introduce a new topic yourself).",
            "",
            "## Seed topic",
            `The question must be about this topic: "${seedTopic}"`,
            "",
            "## Cognitive frame (STRICT — this is what makes this kind different)",
            kindFraming,
            "",
            isOpeningAskOfSeed
                ? "This is the OPENING ask for this topic — ask your first question about it now, framed"
                    + " exactly per the cognitive frame above. Do not reference a prior answer (there isn't one yet)."
                : "The candidate has already answered once (see the transcript in the next message) — ask ONE"
                    + " short, sharper follow-up that digs into a specific gap or claim in their answer, staying"
                    + " within the SAME cognitive frame above. Do not repeat the opening question verbatim.",
            "",
            ...(levelExpectation
                ? [
                    "## Level expectation",
                    "Scale the difficulty and depth of your question to this seniority level:",
                    levelExpectation,
                    "",
                ]
                : []),
            "## Grounding (STRICT — stay on-rails)",
            "Ground your question in the course material excerpt below. The excerpt was retrieved from THIS",
            "course's lessons for the seed topic above and is the only source of truth for what's in-scope.",
            "Do NOT drift into concepts, technologies, or patterns the excerpt gives no basis for.",
            excerpt
                ? ""
                : "The excerpt below is EMPTY this turn (retrieval found nothing relevant) — ask a"
                    + " generic-but-still-on-topic question using only the seed topic above. Do not invent"
                    + " or assume specific course content.",
            "",
            "## Course material",
            excerpt || "(no excerpt retrieved for this turn)",
            "",
            this.workspaceArtifactsGuidance(),
            "",
            "## Language",
            `Write the interviewer's question in **${targetLanguage}**.`,
            "",
            "## Output format",
            "Respond with ONLY the interviewer's next question/probe as plain text — no JSON, no markdown",
            "fences, no meta-commentary, no restating these instructions.",
        ].join("\n")

        // deliver an AUTHORED bank question verbatim (opening ask only); follow-ups
        // still use the framed prompt above (they probe the candidate's answer).
        const deliverSystemText = [
            `You are a senior technical interviewer running a live mock interview, question ${displayIndex} of "${promptTitle}".`,
            "",
            "## Deliver this question (STRICT)",
            `Below is the EXACT interview question to put to the candidate. Deliver it to them now, in ${targetLanguage}.`,
            "Preserve EVERY code block (```), mermaid diagram, and detail EXACTLY as written — do NOT summarize, add,",
            "remove, translate identifiers in, or rephrase the substance. You MAY prepend at most ONE short natural",
            "spoken lead-in sentence (e.g. a short \"next question\" cue) before it.",
            "",
            "## The question",
            seedTopic,
            "",
            this.workspaceArtifactsGuidance(),
            "",
            "## Output format",
            "Output the question as Markdown, keeping fenced code blocks and mermaid diagrams INTACT. No JSON, no",
            "meta-commentary, no restating these instructions.",
        ].join("\n")

        const systemText = isAuthoredPrompt && isOpeningAskOfSeed
            ? deliverSystemText
            : framedSystemText

        const humanText = [
            "Transcript so far (for this question only):",
            "",
            this.transcriptLines(history),
            "",
            isAuthoredPrompt && isOpeningAskOfSeed
                ? "Deliver the question to the candidate now."
                : isOpeningAskOfSeed
                    ? "Ask your opening question about the seed topic now."
                    : "Ask your next follow-up question now.",
        ].join("\n")

        return {
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
        }
    }

    /**
     * Resolve the level-expectation guidance line for a raw level string,
     * falling through to `undefined` (no steer injected) for an
     * unset/unrecognized level -- shared between {@link prepareDesignTurn} and
     * {@link prepareQnaTurn} so both flows scale difficulty identically.
     *
     * @param level - The raw `level` field from the ask payload.
     * @returns The level-expectation line, or undefined when no steer applies.
     */
    private resolveLevelExpectation(
        level: string | null | undefined,
    ): string | undefined {
        const normalizedLevel = level?.trim().toLowerCase()
        return normalizedLevel && LEVEL_EXPECTATION_MAP[normalizedLevel]
            ? LEVEL_EXPECTATION_MAP[normalizedLevel]
            : undefined
    }

    /**
     * The shared "workspace artifacts" system-prompt block -- identical
     * wording for both the design flow and the Q&A flows so the interviewer
     * treats a pasted `[Whiteboard]`/`[Code lang=...]`/`[Notes]` section the
     * same way regardless of kind.
     *
     * @returns The workspace-artifacts guidance block.
     */
    private workspaceArtifactsGuidance(): string {
        return [
            "## Workspace artifacts",
            "The candidate has a workspace alongside the conversation and may paste its contents into their",
            "answer as labeled sections: \"[Whiteboard]\" (a serialized architecture sketch of boxes/arrows",
            "they drew), \"[Code lang=...]\" (a code snippet they wrote), or \"[Notes]\" (free-form scratch",
            "notes, e.g. capacity estimation or an API sketch). Treat these exactly like the rest of their",
            "answer — reference them specifically when present, and feel free to probe/challenge a design",
            "choice on the whiteboard, a detail in the code, or an estimate in the notes.",
        ].join("\n")
    }

    /**
     * Join the transcript history into "role: content" lines, oldest first,
     * mirroring the interview-grade prompt's transcript-replay idiom.
     *
     * @param history - The transcript so far.
     * @returns The joined lines, or a placeholder when empty.
     */
    private transcriptLines(
        history: PrepareMockInterviewTurnParams["history"],
    ): string {
        const lines = history.map(
            (entry) => `${entry.role}: ${entry.content}`,
        )
        return lines.length > 0
            ? lines.join("\n")
            : "(no turns yet — this is the opening question)"
    }
}
