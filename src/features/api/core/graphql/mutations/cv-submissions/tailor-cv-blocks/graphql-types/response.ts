import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Tailored-blocks payload for `tailorCvBlocks` — the SAME blocks array shape
 * (FE-owned JSON: `[{ id, type, title, order, items }]`) with item wording
 * adjusted toward the job description. Not persisted.
 */
@ObjectType({
    description: "The tailored CV blocks (not persisted).",
})
export class TailorCvBlocksData {
    @Field(
        () => GraphQLJSON,
        {
            description: "The tailored CV blocks (FE-owned JSON with JD-aligned item wording).",
        },
    )
        blocks: Array<Record<string, unknown>>
}

@ObjectType({
    description: "Response wrapper for the tailorCvBlocks mutation.",
})
export class TailorCvBlocksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<TailorCvBlocksData | null>
{
    @Field(
        () => TailorCvBlocksData,
        {
            nullable: true,
            description: "The tailored CV blocks.",
        },
    )
        data: TailorCvBlocksData | null
}
