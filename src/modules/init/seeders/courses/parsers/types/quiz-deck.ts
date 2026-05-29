import {
    ResolvedFilePath,
} from "../../path"

/** Indices that locate a quiz deck under mounted course data. */
export interface ParseQuizDeckParams {
    /** The resolved deck folder paths for the owning course. */
    paths: Array<ResolvedFilePath>
    /** The index of the course. */
    courseIndex: number
    /** The owning course id (FK target). */
    courseId: string
    /** The index of the deck within the course. */
    quizDeckIndex: number
    /** Map of `"{moduleDisplayId}/{contentDisplayId}"` → content id, for N:N links. */
    contentIdByPath: Map<string, string>
}

/** Ordinals locating `courses/{course}/quiz-decks/` on the course mount. */
export interface ParseQuizDeckManyParams {
    /** The relative path of the course. */
    courseRelativePath: string
    /** The index of the course. */
    courseIndex: number
    /** The owning course id (FK target). */
    courseId: string
    /** Map of `"{moduleDisplayId}/{contentDisplayId}"` → content id, for N:N links. */
    contentIdByPath: Map<string, string>
}
