import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Ordered CV blocks parsed from pasted text (not persisted).",
})
/**
 * Parsed CV blocks payload for `splitCvFromText` -- an ordered array of blocks
 * (FE-owned JSON: `{ id, type, title, order, items }`) parsed from the pasted
 * text. Not persisted.
 */
export class SplitCvFromTextData {
    @Field(
        () => GraphQLJSON,
        {
            description: "Ordered CV blocks parsed from the pasted text (FE-owned JSON array).",
        },
    )
        blocks: Array<Record<string, unknown>>
}

@ObjectType({
    description: "Response wrapper for the splitCvFromText mutation.",
})
/** GraphQL envelope for parsed editor blocks from pasted text; not persisted until the user saves. */
export class SplitCvFromTextResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SplitCvFromTextData | null>
{
    @Field(
        () => SplitCvFromTextData,
        {
            nullable: true,
            description: "The parsed CV blocks.",
        },
    )
        data: SplitCvFromTextData | null
}
