import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * A coding problem's "approach hint" — guidance markdown sourced from
 * Elasticsearch (never stored in Postgres / the CDN).
 */
@ObjectType({
    description: "A coding problem's approach-hint markdown (from Elasticsearch).",
})
export class CodingProblemHint {
    @Field(
        () => String,
        {
            description: "Stable URL slug of the problem.",
        },
    )
        slug: string

    @Field(
        () => String,
        {
            description: "The approach-hint content in Markdown (localized).",
        },
    )
        hint: string
}

@ObjectType({
    description: "Response wrapper for the codingProblemHint query.",
})
export class CodingProblemHintResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CodingProblemHint | null>
{
    @Field(
        () => CodingProblemHint,
        {
            nullable: true,
            description: "The approach hint, or null when the problem has none.",
        },
    )
        data: CodingProblemHint | null
}
