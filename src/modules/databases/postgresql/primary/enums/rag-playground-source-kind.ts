import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * How a visitor supplied code to the PUBLIC RAG Playground. Stored as a plain
 * `varchar` on {@link import("../entities").RagPlaygroundSessionEntity} (not a
 * Postgres enum type — avoids the ALTER-TYPE-ADD-VALUE pitfall for a column
 * that will likely grow more source kinds over time).
 */
export enum RagPlaygroundSourceKind {
    /** Pasted code directly into the editor. */
    Paste = "paste",
    /** Uploaded a file. */
    Upload = "upload",
    /** Used the built-in curated sample — no input required. */
    Sample = "sample",
    /** Imported a public GitHub repository by URL. */
    Github = "github",
}

export const GraphQLTypeRagPlaygroundSourceKind = createEnumType(RagPlaygroundSourceKind)

registerEnumType(
    GraphQLTypeRagPlaygroundSourceKind,
    {
        name: "RagPlaygroundSourceKind",
        description: "How a RAG Playground visitor supplied their code source.",
        valuesMap: {
            [RagPlaygroundSourceKind.Paste]: {
                description: "Pasted code directly into the editor.",
            },
            [RagPlaygroundSourceKind.Upload]: {
                description: "Uploaded a file.",
            },
            [RagPlaygroundSourceKind.Sample]: {
                description: "Used the built-in curated sample.",
            },
            [RagPlaygroundSourceKind.Github]: {
                description: "Imported a public GitHub repository by URL.",
            },
        },
    },
)
