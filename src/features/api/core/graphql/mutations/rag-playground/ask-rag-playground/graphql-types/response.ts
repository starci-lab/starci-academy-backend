import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "One retrieved code chunk backing the answer (citation).",
})
/** One retrieved chunk, for citation display. */
export class RagPlaygroundSourceData {
    @Field(
        () => String,
        {
            nullable: true,
            description: "File path the chunk came from, or null for a single pasted snippet.",
        },
    )
        filePath: string | null

    @Field(
        () => String,
        {
            description: "The chunk's text (capped for display).",
        },
    )
        snippet: string
}

@ObjectType({
    description: "Result of preparing a grounded RAG Playground ask.",
})
/** Result of preparing a grounded ask -- the run id to stream + its sources. */
export class AskRagPlaygroundData {
    @Field(
        () => ID,
        {
            description: "Run id — subscribe over the /rag_playground Socket.IO namespace to stream the answer.",
        },
    )
        runId: string

    @Field(
        () => [RagPlaygroundSourceData],
        {
            description: "The retrieved chunks backing the answer (may be empty — the model still tries ungrounded).",
        },
    )
        sources: Array<RagPlaygroundSourceData>
}

@ObjectType({
    description: "Response wrapper for the askRagPlayground mutation.",
})
/** Response wrapper for the askRagPlayground mutation. */
export class AskRagPlaygroundResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<AskRagPlaygroundData> {
    @Field(
        () => AskRagPlaygroundData,
        {
            nullable: true,
            description: "The run id to stream + its sources.",
        },
    )
        data: AskRagPlaygroundData
}
