import {
    ResolvedFilePath,
} from "../../path"

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
