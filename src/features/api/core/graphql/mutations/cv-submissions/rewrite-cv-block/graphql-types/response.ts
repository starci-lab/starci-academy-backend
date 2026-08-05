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
    description: "The rewritten CV block (not persisted).",
})
/**
 * Rewritten-block payload for `rewriteCvBlock` -- the SAME block shape with
 * improved item text (FE-owned JSON: `{ id, type, title, order, items }`). Not
 * persisted.
 */
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
/** GraphQL envelope for an in-memory rewritten block; not persisted so the editor can accept or reject before save. */
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
