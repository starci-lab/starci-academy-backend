import type {
    Locale,
} from "@modules/databases"

/**
 * One selectable prompt for the mock interview.
 *
 * Pha 1 sources these from the course's capstone `milestone_tasks` (reframed as
 * interview prompts); the grading rubric is resolved server-side at grade
 * time from the task's approach/outcome criteria (never sent to the client).
 * Pha 3 supplements the bank with curated "classic" prompts (see
 * {@link MockInterviewClassicPrompt}) — never AI-generated live.
 */
export interface MockInterviewPromptSummary {
    /** Milestone-task id (capstone) or a stable classic-prompt slug — passed to the interviewer + grade calls. */
    id: string
    /** Prompt name shown in the picker (the capstone task title, or the classic prompt's localized title). */
    title: string
    /** Relative difficulty (easy / medium / hard / …); defaults to medium when unset. */
    difficulty: string
    /** Where the prompt comes from — `capstone` (curated per-course) or `classic` (curated, course-agnostic). */
    source: string
}

/**
 * One curated "classic" system-design interview prompt (Pha 3) — a static
 * entry, never AI-generated per request. Title is authored per locale so the
 * picker always shows the learner's language.
 */
export interface MockInterviewClassicPrompt {
    /** Stable slug id (e.g. `classic-url-shortener`) — not a database row. */
    id: string
    /** Relative difficulty tier. */
    difficulty: string
    /** Localized prompt title, keyed by {@link Locale}. */
    title: Record<Locale, string>
}

/** Params for {@link import("../mock-interview-prompts.service").MockInterviewPromptsService.list}. */
export interface ListMockInterviewPromptsParams {
    /** Course whose capstone systems seed the prompt bank. */
    courseId: string
    /** Locale to render the curated "classic" prompts' titles in. */
    locale: Locale
}

/** Result of listing the mock interview prompt bank. */
export interface ListMockInterviewPromptsResult {
    /** The prompts the learner can pick to work through, in curriculum order. */
    prompts: Array<MockInterviewPromptSummary>
}
