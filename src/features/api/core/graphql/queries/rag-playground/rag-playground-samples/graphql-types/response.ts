import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** One catalog entry's public listing shape — id + label only, never the code. */
@ObjectType({
    description: "Summary of a RAG Playground built-in curated sample (id + label only, no code).",
})
export class RagPlaygroundSampleSummary {
    @Field(
        () => ID,
        {
            description: "Stable catalog id — pass this as `sampleId` when indexing a Sample source.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Human-readable label shown in the sample picker.",
        },
    )
        label: string
}

@ObjectType({
    description: "Response wrapper for the ragPlaygroundSamples query.",
})
export class RagPlaygroundSamplesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<RagPlaygroundSampleSummary>>
{
    @Field(
        () => [RagPlaygroundSampleSummary],
        {
            nullable: true,
            description: "The built-in curated sample catalog.",
        },
    )
        data: Array<RagPlaygroundSampleSummary>
}
