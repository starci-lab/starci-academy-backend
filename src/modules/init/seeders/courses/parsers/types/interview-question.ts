import {
    ResolvedFilePath,
} from "../../../shared"
import type {
    RawRef,
} from "./flashcard-deck"

/** Ordinals locating `courses/{course}/mock-interview/` on the course mount. */
export interface ParseInterviewQuestionBankManyParams {
    /** The relative path of the course. */
    courseRelativePath: string
    /** The index of the course. */
    courseIndex: number
    /** The owning course id (FK target). */
    courseId: string
}

/** Indices that locate one mock-interview question bank under the mounted course. */
export interface ParseInterviewQuestionBankParams {
    /** The resolved bank folder paths for the owning course. */
    paths: Array<ResolvedFilePath>
    /** The index of the course. */
    courseIndex: number
    /** The owning course id (FK target). */
    courseId: string
    /** The index of the bank within the course. */
    bankIndex: number
}

/** A bank META document (`mock-interview/{bank}/vi.md`) — questions live in `questions/` folders. */
export interface RawInterviewQuestionBank {
    /** Pure display-ordering index (falls back to the bank's folder ordinal). */
    sortIndex?: number
    /** Bank title — NOT persisted (no bank entity); read only for authoring context. */
    title?: string
    /** Bank description — NOT persisted. */
    description?: string
    /** Bank difficulty — NOT persisted. */
    difficulty?: string
    /** Referenced module `displayId`s within the same course (`# moduleRefs`). */
    moduleRefs?: Array<RawRef>
    /** Index signature so the markdown->JSON extractor generic is satisfied. */
    [key: string]: unknown
}

/** A single question document (`mock-interview/{bank}/questions/{index}-{slug}/vi.md`). */
export interface RawInterviewQuestion {
    /** Pure display-ordering index (falls back to the question's folder ordinal). */
    sortIndex?: number
    /** Premium gate (`# isPremium`), false by default. */
    isPremium?: boolean
    /** `technical` | `behavioral` — always `technical` under a course's mock-interview tree. */
    family?: string
    /** junior | middle | senior. */
    tier?: string
    /** Cognitive frame — theory/reasoning/scenario/debug/review/optimize/coding/design. */
    kind?: string
    /** Technology tags (`# tags / ## N`). */
    tags?: Array<RawRef>
    /** The interview question prompt (Markdown, may contain inline code). */
    prompt?: string
    /** Optional GIVEN mermaid diagram (technical `scenario`). */
    diagram?: string
    /** Reasoning points that earn credit (`# rubric / ## N`), each optionally `[category] ...`. */
    rubric?: Array<RawRef>
    /** Probe questions the interviewer may ask next (`# followUps / ## N`). */
    followUps?: Array<RawRef>
    /** Progressive hints (`# hints / ## N`). */
    hints?: Array<RawRef>
    /** Authored model answer/outline — a `:::muted` sectioned leaf, stored verbatim. */
    idealAnswer?: string
    /** Raw `:::chip` leaf — parsed into `Array<string>` by the caller. */
    keywords?: string
    /**
     * GIVEN code per authored programming language (technical `debug`/`review`/`optimize`).
     * A plain object (`## typescript` / `## java` / ...) since the grammar only builds an
     * array when every child heading is numeric — language buckets are string-keyed.
     */
    givenCodes?: Record<string, string>
    /** Index signature so the markdown->JSON extractor generic is satisfied. */
    [key: string]: unknown
}
