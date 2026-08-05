import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/** Params for {@link import("../start-mock-interview-session-draw.service").MockInterviewSessionDrawService.draw}. */
export interface DrawMockInterviewSessionParams {
    /** Id of the user starting the session -- resolves/creates the trial enrollment that anchors the persisted draw. */
    userId: string
    /** Course to draw a prompt for -- scopes the capstone pool + the resolved enrollment. */
    courseId: string
    /** Raw seniority-level string from the request ("junior" | "middle" | "senior"); unrecognized falls back to "middle" for pool selection. */
    level: string
    /** Raw mode string from the request ("qna" | "design"); unrecognized falls back to "qna". */
    mode: string
    /** DEPRECATED single programming language chosen at session start -- superseded by {@link langs}; when `langs` is omitted this seeds a one-element set. */
    lang?: string
    /** The SET of implementation-track languages selected at setup; each 4-track code question is served in a RANDOM one of these (∩ its authored tracks), a question authored in none is EXCLUDED from the draw. Omitted/empty falls back to {@link lang} then all 4 tracks. */
    langs?: Array<string>
    /** Locale to render the drawn prompt's title in (capstone titles are pre-localized by the course tree; classics render per-locale here). */
    locale: Locale
    /** How many Q&A questions to draw (mode="qna" only); unrecognized/omitted falls back to the default (5). */
    questionCount?: number
    /** Which cognitive frames each drawn question may be assigned (mode="qna" only); omitted/empty = every kind. */
    kinds?: Array<string>
    /** Whether the eventual graded attempt should feed job-readiness; defaults to true (a Configurable/Configurable qna draw sends false). */
    countsToReadiness?: boolean
    /** Optional user-chosen name for this practice session; omitted/blank persists as null (the FE renders a time-based fallback). */
    name?: string
}

/**
 * One authored programming-language variant of a debug/review/optimize
 * question's GIVEN code -- same conceptual bug, one entry per language
 * (`typescript`/`java`/`csharp`/`go`, up to `DEFAULT_PROGRAMMING_LANGUAGES`).
 * The candidate freely switches between these client-side (no refetch).
 */
export interface MockInterviewGivenCodeVariant {
    /** Programming language this variant is written in (e.g. "typescript"). */
    lang: string
    /** The given code itself, in {@link lang}. */
    code: string
}

/** One drawn flashcard-card seed question, in ask order, carrying its own randomly-assigned cognitive frame. */
export interface DrawMockInterviewSeedTopic {
    /** The seed `flashcard_cards.id`. */
    cardId: string
    /** The cognitive frame this ONE question is asked in ("theory" | "reasoning" | "scenario"), randomly assigned per-question. */
    kind: string
    /** Short title/snippet identifying the seed topic (the card's localized question, truncated). */
    title: string
    /**
     * GIVEN code the candidate should FIX/read (interview-bank `debug`/`review`/
     * `optimize` questions only) -- split OUT of {@link title} so the FE seeds it
     * into an editable code editor instead of rendering it read-only in the chat
     * bubble, one entry per authored language. Empty for every other kind /
     * source (flashcard seeds, EQ, questions with no code).
     */
    givenCodes?: Array<MockInterviewGivenCodeVariant>
}

/** The server-drawn mock-interview session result. */
export interface DrawMockInterviewSessionResult {
    /** Id of the persisted {@link import("@modules/databases").MockInterviewSessionEntity} row. */
    sessionId: string
    /** The drawn prompt's id (a milestone-task id for capstone, or a classic-prompt slug) -- for mode="qna", a synthetic id summarizing the draw (there is no single prompt). */
    promptId: string
    /** The drawn prompt's localized title -- for mode="qna", a summary like "5 questions - Random draw". */
    promptTitle: string
    /** The drawn prompt's difficulty tier. */
    difficulty: string
    /** Where the drawn prompt came from -- "capstone" | "classic" | "flashcard". */
    source: string
    /** The level the draw was requested for, echoed back as-is. */
    level: string
    /** The (normalized) mode the draw was requested for. */
    mode: string
    /** Drawn flashcard-card seed questions, in ask order, each with its own kind. Empty for mode="design". */
    seedTopics: Array<DrawMockInterviewSeedTopic>
    /** When the persisted session row was drawn -- the anchor for the 1-hour session time limit (`createdAt + MOCK_INTERVIEW_SESSION_DURATION_MS`), never re-derived client-side. */
    createdAt: Date
}
