import {
    ResolvedFilePath,
} from "../../path"

/** Indices that locate a playground under mounted course data. */
export interface ParsePlaygroundParams {
    /** The resolved playground folder paths for the owning course. */
    paths: Array<ResolvedFilePath>
    /** The index of the course. */
    courseIndex: number
    /** The owning course id (FK target). */
    courseId: string
    /** The index of the playground within the course. */
    playgroundIndex: number
}

/** Ordinals locating `courses/{course}/playgrounds/` on the course mount. */
export interface ParsePlaygroundManyParams {
    /** The relative path of the course. */
    courseRelativePath: string
    /** The index of the course. */
    courseIndex: number
    /** The owning course id (FK target). */
    courseId: string
}

/** Ordinals locating a playground's `steps/` folder on the mount. */
export interface ParsePlaygroundStepsParams {
    /** The playground folder path segment under `courses/`. */
    playgroundRelativePath: string
    /** The index of the owning course. */
    courseIndex: number
    /** The index of the owning playground within the course. */
    playgroundIndex: number
    /** The owning playground id (FK target). */
    playgroundId: string
}

/** A playground META document (`<playground>/{en,vi}.md`) — steps live in `steps/` folders. */
export interface RawPlayground {
    /** URL-facing stable identifier. */
    slug?: string
    /** Playground title. */
    title?: string
    /** Short description of what the playground covers. */
    description?: string
    /** Icon shown next to the playground title (emoji or icon key). */
    icon?: string
    /** Interaction kind (`terminal` | `rag`); absent → `terminal`. */
    kind?: string
    /** Index signature so the markdown→JSON extractor generic is satisfied. */
    [key: string]: unknown
}

/** A single step document (`<playground>/steps/{index}-{slug}/{en,vi}.md`). */
export interface RawPlaygroundStep {
    /** Step title. */
    title?: string
    /** Step instructions body (Markdown). */
    body?: string
    /** Sample command shown to the student. */
    commandHint?: string
    /** RAG-kind sample action shown to the student. */
    actionHint?: string
    /** RAG-kind verify predicate (`imported` | `asked` | `answered`). */
    verifyKind?: string
    /** Resource kind matched against the agent's self-reported resource list. */
    verifyResourceKind?: string
    /** Substring/prefix matched against the reported resource name (empty = any name). */
    verifyResourceNamePattern?: string
    /** Expected reported status; null = existence check only. */
    verifyExpectedStatus?: string
    /** Index signature so the markdown→JSON extractor generic is satisfied. */
    [key: string]: unknown
}
