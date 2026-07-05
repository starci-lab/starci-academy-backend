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
 * Rewritten-block payload for `rewriteCvBlock` — the SAME block shape with
 * improved item text (FE-owned JSON: `{ id, type, title, order, items }`). Not
 * persisted.
 */
@ObjectType({
    description: "The rewritten CV block (not persisted).",
})
export class RewriteCvBlockData {
    @Field(
        () => GraphQLJSON,
        {
            description: "The rewritten CV block (FE-owned JSON with improved item text).",
        },
    )
        block: Record<string, unknown>
}

@ObjectType({
    description: "Response wrapper for the rewriteCvBlock mutation.",
})
export class RewriteCvBlockResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RewriteCvBlockData | null>
{
    @Field(
        () => RewriteCvBlockData,
        {
            nullable: true,
            description: "The rewritten CV block.",
        },
    )
        data: RewriteCvBlockData | null
}
