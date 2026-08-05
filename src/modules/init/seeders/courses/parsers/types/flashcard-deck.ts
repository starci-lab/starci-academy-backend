import type {
    ChallengeDifficulty,
} from "@modules/databases"
import {
    ResolvedFilePath,
} from "../../../shared"

/** Indices that locate a flashcard deck under mounted course data. */
export interface ParseFlashcardDeckParams {
    /** The resolved deck folder paths for the owning course. */
    paths: Array<ResolvedFilePath>
    /** The index of the course. */
    courseIndex: number
    /** The owning course id (FK target). */
    courseId: string
    /** The index of the deck within the course. */
    flashcardDeckIndex: number
}

/** Ordinals locating `courses/{course}/flashcard-decks/` on the course mount. */
export interface ParseFlashcardDeckManyParams {
    /** The relative path of the course. */
    courseRelativePath: string
    /** The index of the course. */
    courseIndex: number
    /** The owning course id (FK target). */
    courseId: string
}

/** One raw card tag item parsed from a card's `# tags` block (`## N` → `### value`). */
export interface RawFlashcardCardTag {
    /** The tag value text from `### value`. */
    value?: string
}

/** One `# contentRefs` / `# moduleRefs` line (a `displayId`) as parsed. */
export interface RawRef {
    /** Zero-based ordinal. */
    orderIndex: number
    /** The referenced entity's `displayId`. */
    value?: string
}

/** A deck META document (`<deck>/{en,vi}.md`) — cards live in `cards/` folders. */
export interface RawFlashcardDeck {
    /** Deck title. */
    title?: string
    /** Deck description. */
    description?: string
    /** Deck difficulty tier. */
    difficulty?: ChallengeDifficulty
    /** Index signature so the markdown→JSON extractor generic is satisfied. */
    [key: string]: unknown
}

/** A single card document (`<deck>/cards/{index}-{slug}/{en,vi}.md`). */
export interface RawFlashcardCard {
    /** The question prompt (Markdown). */
    question?: string
    /** Interview seniority level (`junior`/`middle`/`senior`/`staff`). */
    level?: string
    /** Technology tags (`# tags / ## N`). */
    tags?: Array<RawRef>
    /** The model answer (Markdown). */
    answer?: string
    /** Optional extra depth (Markdown). */
    explanation?: string
    /** Whether this card is premium (`# isPremium`), false by default. */
    isPremium?: boolean
    /** Index signature so the markdown→JSON extractor generic is satisfied. */
    [key: string]: unknown
}
