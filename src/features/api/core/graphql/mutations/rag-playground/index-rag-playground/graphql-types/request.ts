import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeRagPlaygroundSourceKind,
    RagPlaygroundSourceKind,
} from "@modules/databases"

/**
 * Index a code source into a PUBLIC (anonymous) RAG Playground session. The
 * server owns which fields matter per `kind` (paste/upload need `code`,
 * github needs `githubUrl`, sample needs nothing) — the client just fills
 * what applies to its chosen kind.
 */
@InputType({
    description: "Index a code source into a public RAG Playground session.",
})
export class IndexRagPlaygroundRequest {
    @Field(
        () => String,
        {
            description: "Client-generated session id (anonymous — no login required).",
        },
    )
        sessionId: string

    @Field(
        () => GraphQLTypeRagPlaygroundSourceKind,
        {
            description: "How the code source is supplied.",
        },
    )
        kind: RagPlaygroundSourceKind

    @Field(
        () => String,
        {
            nullable: true,
            description: "Pasted/uploaded code (required for Paste/Upload).",
        },
    )
        code?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional language hint for the pasted/uploaded code.",
        },
    )
        language?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Uploaded file name (Upload only).",
        },
    )
        fileName?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Public GitHub repo URL, e.g. https://github.com/owner/repo (Github only).",
        },
    )
        githubUrl?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Which curated catalog entry to index (Sample only; see the ragPlaygroundSamples query). Defaults to the first catalog entry when omitted.",
        },
    )
        sampleId?: string
}
