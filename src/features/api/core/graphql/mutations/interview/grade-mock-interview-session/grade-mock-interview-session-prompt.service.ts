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
} from "@modules/databases/postgresql/primary/enums/mock-interview-kind"
import {
    MockInterviewMode,
} from "@modules/databases/postgresql/primary/enums/mock-interview-mode"
import {
    MockInterviewVerdict,
    type BuildMockInterviewGradePromptParams,
    type BuildMockInterviewGradePromptResult,
    type MockInterviewSeedGrounding,
    type MockInterviewTurnRecord,
} from "./types/mock-interview-grade"

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
 * uses to scale how strict the grading should be (junior recall -> staff
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
 * The shared "workspace artifacts" grading guidance -- identical wording for
 * both the design flow and the qna flow so the grader treats a pasted
 * `[Whiteboard]`/`[Code lang=...]`/`[Notes]` section the same way regardless
 * of mode/kind.
 */
const WORKSPACE_ARTIFACTS_GUIDANCE = [
    "## Workspace artifacts (first-class evidence)",
    "Some candidate turns embed labeled workspace artifacts pasted alongside their spoken answer — treat",
    "each as first-class evidence, not filler text:",
    "- \"[Whiteboard]\" — a serialized architecture sketch (boxes/arrows) the candidate drew.",
    "- \"[Code lang=...]\" — an implementation snippet the candidate wrote. Judge its correctness and whether",
    "  it uses the language idiomatically.",
    "- \"[Notes]\" — free-form scratch notes (e.g. capacity estimation, an API sketch).",
    "A session with NO artifacts (voice-only) is completely normal and must NOT be penalized for their",
    "absence — grade only what the transcript actually contains.",
].join("\n")

/**
 * Per-kind rubric guidance for ONE Q&A question -- used inline in each
 * question's block of the human message so a mode="qna" session that MIXES
 * kinds (a real interviewer alternating question styles, "mode split"
 * 2026-07-06) gets the RIGHT rubric per-question rather than one rubric for
 * the whole session.
 */
const QNA_KIND_RUBRIC_MAP: Record<MockInterviewKind, string> = {
    [MockInterviewKind.Theory]:
        "Rubric — THEORY (coverage against the reference above): score 0-100 primarily by how much of the"
            + " reference's SUBSTANCE (not exact wording) the candidate's answer covers — credit"
            + " synonyms/paraphrases of a keyword, not just exact string matches. No reference on file (rare) →"
            + " grade on general soundness instead.",
    [MockInterviewKind.Reasoning]:
        "Rubric — REASONING (open, no reference answer): there is NO single correct answer for this question —"
            + " score 0-100 on the QUALITY of the candidate's reasoning: did they correctly identify the real"
            + " tradeoff, justify their choice, and show awareness of when the alternative would actually be better?",
    [MockInterviewKind.Scenario]:
        "Rubric — SCENARIO (open, no reference answer): there is NO single correct answer for this question —"
            + " score 0-100 on the QUALITY of the candidate's applied problem-solving: did they propose a"
            + " concrete, sound debugging/mitigation approach grounded in the course material, not just guess?",
}

@Injectable()
/**
 * Pure builder for the mock-interview SESSION grading prompt. No I/O and no
 * injected dependencies -- it only turns a prompt title + mode + transcript +
 * RAG course excerpt (+ seed groundings for mode="qna") into the system/human
 * chat messages the AI invoke service consumes. Grades the WHOLE session
 * once, at the end of the interview, rather than one question/turn at a time.
 *
 * Branches on {@link BuildMockInterviewGradePromptParams.mode} ("mode split",
 * 2026-07-06):
 * - {@link MockInterviewMode.Design} -- UNCHANGED 5-phase rubric
 *   ({@link buildDesign}).
 * - {@link MockInterviewMode.Qna} -- per-question rubric, where EACH question
 *   picks its OWN rubric from its `seedGroundings[index].kind`: COVERAGE
 *   against the seed card's authored answer + `:::chip` keywords for
 *   "theory", or an OPEN rubric (no reference answer) for
 *   "reasoning"/"scenario" ({@link buildQna}) -- a single session can (and
 *   usually does) mix kinds across its questions.
 *
 * The core `phaseScores` shape is UNCHANGED across every branch --
 * `[{ phase, score, max }]`; the qna branch just labels each entry with the
 * per-question phase literal the grader emits instead of one of the 5 canonical
 * generic "render phaseScores as labeled bars" needs zero changes. The qna
 * branch additionally asks for a `questionFeedback: [{ index, feedback }]`
 * array (2026-07-06, per-question model-answer review feature) -- `buildDesign`
 * never requests or reads it, so `mode="design"` output is byte-identical to
 * before.
 */
export class MockInterviewGradePromptService {
    /**
     * Build the grading messages for one whole mock-interview session --
     * dispatches to {@link buildDesign} or {@link buildQna} based on
     * {@link BuildMockInterviewGradePromptParams.mode}.
     *
     * @param params - {@link BuildMockInterviewGradePromptParams}
     * @returns The ordered system + human chat messages.
     */
    build(
        params: BuildMockInterviewGradePromptParams,
    ): BuildMockInterviewGradePromptResult {
        return params.mode === MockInterviewMode.Design
            ? this.buildDesign(params)
            : this.buildQna(params)
    }

    /**
     * mode="design" grading prompt -- UNCHANGED from before the mode split.
     * Scores each of the 5 canonical phases against the full transcript.
     *
     * @param params - Prompt title, level, the full transcript, the RAG
     *   course excerpt, and the target locale.
     * @returns The ordered system + human chat messages.
     */
    private buildDesign(
        params: BuildMockInterviewGradePromptParams,
    ): BuildMockInterviewGradePromptResult {
        const {
            promptTitle,
            level,
            turns,
            courseExcerpt,
            locale,
        } = params

        const targetLanguage = this.resolveTargetLanguage(locale)
        const levelExpectation = this.resolveLevelExpectation(level)
        const courseMaterialSection = this.resolveCourseMaterialSection(courseExcerpt)

        // a literal example object pins the exact JSON shape the model must emit;
        // phase keys are illustrative -- the model picks whichever of the 5
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
            WORKSPACE_ARTIFACTS_GUIDANCE.replace(
                "A session with NO artifacts",
                "Weigh a whiteboard/code artifact into the highLevel and deepDive phases, and notes into the"
                    + " estimation phase. A session with NO artifacts",
            ),
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

    /**
     * The `mode="qna"` grading prompt -- "mode split" (2026-07-06). Groups the
     * transcript into per-question blocks (by `questionIndex`), asks the
     * model for ONE `phaseScores` entry PER QUESTION using the per-question phase
     * literal the grader emits (matching the response schema exactly -- no schema
     * CONTENTS differ), and picks each question's rubric from ITS OWN
     * `seedGroundings[index].kind` -- a single session mixes kinds across its
     * questions (a real interviewer alternating question styles), so the
     * rubric choice is made PER QUESTION, not once for the whole prompt:
     * - theory: COVERAGE against that question's seed card's authored answer
     *   + `:::chip` keywords (a REAL reference answer exists).
     * - reasoning/scenario: OPEN rubric (no reference answer -- judged on
     *   reasoning quality/depth instead of matching a model answer).
     *
     * @param params - Prompt title, mode, level, the full transcript, seed
     *   groundings (one per question, each carrying its own kind), the RAG
     *   course excerpt, and the target locale.
     * @returns The ordered system + human chat messages.
     */
    private buildQna(
        params: BuildMockInterviewGradePromptParams,
    ): BuildMockInterviewGradePromptResult {
        const {
            promptTitle,
            level,
            turns,
            seedGroundings,
            courseExcerpt,
            locale,
        } = params

        const targetLanguage = this.resolveTargetLanguage(locale)
        const levelExpectation = this.resolveLevelExpectation(level)
        const courseMaterialSection = this.resolveCourseMaterialSection(courseExcerpt)

        const groupedByQuestion = this.groupTurnsByQuestion(turns)
        const questionCount = Math.max(
            groupedByQuestion.size,
            seedGroundings.length,
        )

        const questionBlocks = Array.from(
            {
                length: questionCount,
            },
            (unused, index) => this.buildQuestionBlock({
                index,
                questionTurns: groupedByQuestion.get(index) ?? [],
                grounding: seedGroundings[index],
            }),
        )

        // literal example pins the exact JSON shape -- phaseScores here means
        // "per-question scores", one entry per question, using the phase literal
        // required by the QnA scorecard schema so the FE's generic labeled-bar
        const exampleJson = JSON.stringify(
            {
                overallScore: 78,
                verdict: MockInterviewVerdict.Borderline,
                phaseScores: [
                    {
                        phase: "Câu 1", // vn-ok: literal phase label the QnA grader must emit
                        score: 82,
                        max: 100,
                    },
                    {
                        phase: "Câu 2", // vn-ok: literal phase label the QnA grader must emit
                        score: 65,
                        max: 100,
                    },
                    {
                        phase: "Câu 3", // vn-ok: literal phase label the QnA grader must emit
                        score: 90,
                        max: 100,
                    },
                    {
                        phase: "Câu 4", // vn-ok: literal phase label the QnA grader must emit
                        score: 50,
                        max: 100,
                    },
                    {
                        phase: "Câu 5", // vn-ok: literal phase label the QnA grader must emit
                        score: 88,
                        max: 100,
                    },
                ],
                attributeScores: [
                    {
                        key: "communication",
                        score: 78,
                    },
                    {
                        key: "structuredThinking",
                        score: 72,
                    },
                ],
                strengths: [
                    "First concrete thing the candidate got right.",
                ],
                gaps: [
                    "Concrete thing that was missing, framed as what to add.",
                ],
                followUpQuestion: "A natural follow-up question, or null.",
                coveredCheckpoints: [
                    {
                        index: 0,
                        covered: [0,
                            2,
                            5],
                    },
                    {
                        index: 1,
                        covered: [1],
                    },
                ],
                questionFeedback: [
                    {
                        index: 0,
                        feedback: "One line: what this specific answer was missing or got wrong, relative to the reference.",
                    },
                    {
                        index: 1,
                        feedback: "One line: what this specific answer was missing or got wrong, relative to the reference.",
                    },
                    {
                        index: 2,
                        feedback: "One line: what this specific answer was missing or got wrong, relative to the reference.",
                    },
                    {
                        index: 3,
                        feedback: "One line: what this specific answer was missing or got wrong, relative to the reference.",
                    },
                    {
                        index: 4,
                        feedback: "One line: what this specific answer was missing or got wrong, relative to the reference.",
                    },
                ],
            },
            null,
            2,
        )

        const systemText = [
            "You are a senior technical interviewer producing the FINAL scorecard for a candidate who just",
            `completed a mock interview ("${promptTitle}") made of SEPARATE, INDEPENDENT questions —`,
            "grounded in what this course actually teaches. EACH question below carries its own rubric (a real",
            "interviewer mixes question styles within one session) — read and apply the rubric stated INSIDE each",
            "question's block, not a single rubric for the whole session. Score EACH question separately; do not",
            "average them yourself (the client computes any composite it needs from your per-question breakdown).",
            "",
            "## Speech-to-text caveat",
            "The candidate's spoken turns were captured by speech-to-text. IGNORE spelling, casing, punctuation, and",
            "mis-recognized technical terms (e.g. \"sequel\" for \"SQL\", \"cash\" for \"cache\"). Grade the SUBSTANCE of",
            "what they meant, not transcription noise.",
            "",
            WORKSPACE_ARTIFACTS_GUIDANCE,
            "",
            "## Level expectation",
            levelExpectation,
            "",
            "## Course material",
            "Weight correctness against what THIS COURSE actually taught below — not generic industry knowledge that",
            "contradicts it. When an answer diverges from the course's approach, treat the course's approach as the",
            "source of truth for what counts as a strong answer.",
            "",
            courseMaterialSection,
            "",
            "## Attributes",
            "In addition to the per-question breakdown, score 2 to 3 named attributes 0 to 100 each ACROSS the",
            "whole session, chosen from: communication (clarity, structure of explanation), structuredThinking",
            "(organized problem-solving approach), tradeoffAwareness (recognizing and reasoning about tradeoffs).",
            "",
            "## Scoring",
            "- overallScore: an integer from 0 to 100 — the holistic score for the whole session, informed by (but",
            "  not required to be a mechanical average of) the per-question and attribute breakdowns.",
            "- verdict: one of \"pass\", \"borderline\", or \"fail\".",
            "- phaseScores: EXACTLY one entry PER QUESTION below, in order, with `phase` set to the LITERAL string",
            "  \"Câu 1\", \"Câu 2\", \"Câu 3\", … (Question N in Vietnamese — use this exact label regardless of", // vn-ok: literal phase labels the QnA grader must emit
            "  the feedback language) and `max` always 100 for every entry (do NOT make phase maxes sum to 100 —",
            "  that rule only applies to the 5-phase design rubric, not here).",
            "- strengths: concrete things the candidate got right across the session (may be empty).",
            "- gaps: concrete things missing or wrong, each framed as what to add (may be empty).",
            "- followUpQuestion: a natural follow-up an interviewer would ask next, or null.",
            "- coveredCheckpoints: one entry PER QUESTION that has a numbered CHECKPOINT reference,",
            "  `{ index, covered }` where `index` is the 0-based question number and `covered` lists the",
            "  checkpoint numbers THIS answer actually established (the numbers shown as `(0) (1) (2) …` in that",
            "  question's Reference). Judge coverage on SUBSTANCE — a paraphrase counts, a vague gesture at the",
            "  topic does not. List only what the candidate genuinely said; omitting a checkpoint is how it scores",
            "  zero for that point. Leave `covered` empty when the answer established none of them.",
            "- questionFeedback: EXACTLY one entry PER QUESTION (same count and order as `phaseScores`), each",
            "  `{ index, feedback }` where `index` is the 0-based question number (0, 1, 2, …, matching the",
            "  \"### Question N\" blocks below where N = index + 1) and `feedback` is ONE SHORT LINE stating what",
            "  THIS SPECIFIC answer was missing or got wrong relative to its own reference/rubric above — this is",
            "  DIFFERENT from `gaps` (which is a session-wide list); a strong answer still gets a short line noting",
            "  what would make it even stronger, never an empty string.",
            "",
            "## Language",
            `Write strengths, gaps, followUpQuestion, and questionFeedback[].feedback in **${targetLanguage}**.`,
            "JSON keys stay in English; `phaseScores[].phase` stays the literal per-question labels above", // vn-ok: prompt instructs model to keep Vietnamese phase labels
            "regardless of feedback language; verdict stays one of the lowercase English literals above.",
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
            "Here are the questions of the completed mock interview to grade, in order — each carries its own",
            "rubric inline (kinds are mixed within this session):",
            "",
            questionBlocks.join("\n\n") || "(no questions were recorded for this session)",
        ].join("\n")

        return {
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
        }
    }

    /**
     * Build ONE question's block of the human message -- its own rubric
     * (resolved from its `grounding.kind`), its reference lines when it's a
     * "theory" question, and its transcript slice. Missing grounding (a card
     * deleted after the draw) falls back to the "theory" rubric with no
     * reference lines, matching {@link import("@modules/databases").normalizeMockInterviewKind}'s
     * own theory-fallback shape so a gap in the snapshot degrades gracefully
     * rather than throwing.
     *
     * @param params - The question's 0-based index, its transcript turns, and its (possibly absent) seed grounding.
     * @returns The question's block text, ready to join into the human message.
     */
    private buildQuestionBlock(
        params: {
            index: number
            questionTurns: Array<MockInterviewTurnRecord>
            grounding: MockInterviewSeedGrounding | undefined
        },
    ): string {
        const {
            index,
            questionTurns,
            grounding,
        } = params
        const kind = grounding
            ? (Object.values(MockInterviewKind).find((candidate) => candidate === grounding.kind) ?? MockInterviewKind.Theory)
            : MockInterviewKind.Theory
        // An interview-bank question carries an AUTHORED answer and/or rubric --
        // grade the candidate by comparing to THAT reference, for EVERY kind (not
        // just theory). Legacy flashcard seeds only ship a reference for theory.
        const hasReference = Boolean(grounding) && (Boolean(grounding?.answer) || (grounding?.rubric?.length ?? 0) > 0)

        const referenceLines = hasReference && grounding
            ? [
                `Reference (question): ${grounding.question}`,
                grounding.answer
                    ? `Reference (model answer — GRADE BY COMPARING the candidate's answer against this): ${grounding.answer}`
                    : null,
                // Authored checkpoints replace the flat rubric line when the question has
                // them: each is numbered so the model can report WHICH ones the candidate
                // covered, and the score is then summed from those bands in code rather
                // than picked by the model.
                grounding.checkpoints && grounding.checkpoints.length > 0
                    ? `Reference (scoring CHECKPOINTS — the primary grading anchor; report which ones the candidate COVERED via "coveredCheckpoints"): ${grounding.checkpoints
                        .map((checkpoint, order) => `(${order}) [${checkpoint.dimension ?? "technical"}${checkpoint.critical ? ", MUST-HIT" : ""}, ${checkpoint.scoreBand} pts] ${checkpoint.text}`)
                        .join(" ")}`
                    : grounding.rubric && grounding.rubric.length > 0
                        ? `Reference (scoring reasoning points — each one covered earns credit; this is the primary grading anchor): ${grounding.rubric.map((point, order) => `(${order + 1}) ${point}`).join(" ")}`
                        : null,
                // the GIVEN (buggy) code the candidate was asked to FIX -- the grader
                // compares the candidate's own "[Code lang=...]" workspace artifact
                // against THIS baseline, so the FIX itself is scored (did they change
                // the right line?), not just whether the final code looks plausible.
                grounding.givenCode
                    ? `Reference (the GIVEN code — may contain a bug; grade the candidate's FIX by COMPARING the "[Code lang=...]" artifact they submitted against this baseline, checking whether they changed the right thing):\n\`\`\`${grounding.givenLang ?? ""}\n${grounding.givenCode}\n\`\`\``
                    : null,
                grounding.keywords.length > 0
                    ? `Reference (keywords worth covering): ${grounding.keywords.join(", ")}`
                    : null,
            ].filter((line): line is string => line !== null)
            : []

        const transcriptLines = questionTurns
            .map((turn) => `${turn.role}: ${turn.content}`)
            .join("\n") || "(no turns recorded for this question)"

        return [
            `### Question ${index + 1}`,
            QNA_KIND_RUBRIC_MAP[kind],
            ...referenceLines,
            "Transcript for this question:",
            transcriptLines,
        ].join("\n")
    }

    /**
     * Group the transcript's turns by `questionIndex` -- a `mode="qna"`
     * session's turns are all tagged with which question they belong to (see
     * {@link MockInterviewTurnRecord.questionIndex}); a turn missing the index
     * (predates the field, or a design-flow turn misrouted here) is dropped
     * from the grouping (it still exists in the raw `turns` array, but has no
     * question to attribute to).
     *
     * @param turns - The full recorded transcript.
     * @returns Turns grouped by question index, in transcript order within each group.
     */
    private groupTurnsByQuestion(
        turns: Array<MockInterviewTurnRecord>,
    ): Map<number, Array<MockInterviewTurnRecord>> {
        const grouped = new Map<number, Array<MockInterviewTurnRecord>>()
        for (const turn of turns) {
            if (turn.questionIndex === undefined || turn.questionIndex === null) {
                continue
            }
            const existing = grouped.get(turn.questionIndex)
            if (existing) {
                existing.push(turn)
            } else {
                grouped.set(turn.questionIndex,
                    [turn])
            }
        }
        return grouped
    }

    /**
     * Resolve the human-readable language name feedback strings must be
     * written in, shared between {@link buildDesign} and {@link buildQna}.
     *
     * @param locale - The target locale.
     * @returns The resolved language name (defaults to English).
     */
    private resolveTargetLanguage(
        locale: Locale,
    ): string {
        return LOCALE_LANGUAGE_MAP[locale] ?? "English"
    }

    /**
     * Resolve the level-expectation guidance line, shared between
     * {@link buildDesign} and {@link buildQna} so both flows scale difficulty
     * identically.
     *
     * @param level - The raw session level, or null.
     * @returns The resolved level-expectation line.
     */
    private resolveLevelExpectation(
        level: string | null,
    ): string {
        const normalizedLevel = level?.trim().toLowerCase()
        return normalizedLevel && LEVEL_EXPECTATION_MAP[normalizedLevel]
            ? LEVEL_EXPECTATION_MAP[normalizedLevel]
            : "Unspecified level — grade the substance on its own merits."
    }

    /**
     * Resolve the course-material section text, shared between
     * {@link buildDesign} and {@link buildQna}.
     *
     * @param courseExcerpt - The RAG-retrieved excerpt (possibly empty).
     * @returns The excerpt, or a note that retrieval found nothing.
     */
    private resolveCourseMaterialSection(
        courseExcerpt: string,
    ): string {
        return courseExcerpt.trim()
            ? courseExcerpt
            : "(No course material was retrieved for this session — grade against sound general practice for the subject.)"
    }
}
