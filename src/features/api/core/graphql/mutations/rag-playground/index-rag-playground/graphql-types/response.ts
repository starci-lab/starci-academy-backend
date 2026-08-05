import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Result of indexing a source into a RAG Playground session.",
})
/** Result of indexing a source into a RAG Playground session. */
export class IndexRagPlaygroundData {
    @Field(
        () => String,
        {
            description: "Echoes the session id.",
        },
    )
        sessionId: string

    @Field(
        () => Int,
        {
            description: "How many chunks were indexed.",
        },
    )
        chunkCount: number

    @Field(
        () => String,
        {
            description: "Human-readable label of the indexed source.",
        },
    )
        sourceLabel: string
}

@ObjectType({
    description: "Response wrapper for the indexRagPlayground mutation.",
})
/** Response wrapper for the indexRagPlayground mutation. */
export class IndexRagPlaygroundResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<IndexRagPlaygroundData> {
    @Field(
        () => IndexRagPlaygroundData,
        {
            nullable: true,
            description: "Chunk count + source label once indexed.",
        },
    )
        data: IndexRagPlaygroundData
}
