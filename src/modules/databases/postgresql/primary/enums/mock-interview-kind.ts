/**
 * The COGNITIVE FRAME one Q&A QUESTION is asked in -- lives on each individual
 * drawn seed (see {@link import("../entities/mock-interview-session.entity").MockInterviewSeedQuestion}),
 * NOT on the whole session (that axis is now
 * {@link import("./mock-interview-mode").MockInterviewMode}, "mode split"
 * 2026-07-06). Every question in a `mode="qna"` session is RANDOMLY assigned
 * one of these 3 kinds at draw time -- mixing kinds within a single session
 * mirrors how a real interviewer alternates question styles. Drives BOTH the
 * follow-up prompting (how the interviewer frames the question) AND the
 * grading rubric (reference-answer coverage vs open rubric) for that ONE
 * question -- it is NEVER stored on a flashcard; the SAME flashcard topic can
 * be asked as theory, reasoning, or scenario depending on which kind it was
 * randomly drawn as.
 *
 * TS-only (no `registerEnumType`/pg `enum` column) -- persisted inside the
 * `seed_questions` jsonb array on
 * {@link import("../entities/mock-interview-session.entity").MockInterviewSessionEntity},
 * not as its own column, so a future kind never requires a schema migration.
 */
export enum MockInterviewKind {
    /** "What is X? How does X differ from Y?" -- graded against the seed card's own model answer + keywords (has ground truth). */
    Theory = "theory",
    /** "When would you reach for X over Y? What's the tradeoff?" -- open rubric, no reference answer. */
    Reasoning = "reasoning",
    /** "Prod is on fire because of X -- how do you debug/fix it?" -- open rubric, no reference answer. */
    Scenario = "scenario",
}

/** Every Q&A kind, in the fixed order used to derive a deterministic draw (see {@link import("../../../../../features/api/core/graphql/mutations/interview/start-mock-interview-session/start-mock-interview-session-draw.service").MockInterviewSessionDrawService.deriveSeedKind}). */
export const MOCK_INTERVIEW_QNA_KINDS: ReadonlyArray<MockInterviewKind> = [
    MockInterviewKind.Theory,
    MockInterviewKind.Reasoning,
    MockInterviewKind.Scenario,
]

/**
 * Coerce a raw kind string to a known {@link MockInterviewKind}, falling back
 * to {@link MockInterviewKind.Theory} for anything unrecognized -- never
 * throws, so a malformed/legacy value stored in a `seed_questions` row never
 * hard-breaks a turn/grade.
 *
 * @param value - The raw per-question kind string, or null/undefined.
 * @returns A known kind literal.
 */
export const normalizeMockInterviewKind = (
    value: string | null | undefined,
): MockInterviewKind => {
    const candidate = value?.trim().toLowerCase()
    const match = Object.values(MockInterviewKind).find(
        (kind) => kind === candidate,
    )
    return match ?? MockInterviewKind.Theory
}
