import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Resolved canonical route for a global id.",
})
/** Payload of the resolveRoute query. */
export class ResolveRouteData {
    @Field(
        () => String,
        {
            nullable: true,
            description:
                "Locale-agnostic path (client prepends /{locale}); null when the "
                + "entity is unknown / deleted / unroutable.",
        },
    )
        path: string | null
}

@ObjectType({
    description: "Response wrapper for the resolveRoute query.",
})
/** Response wrapper for the resolveRoute query. */
export class ResolveRouteResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ResolveRouteData>
{
    @Field(
        () => ResolveRouteData,
        {
            nullable: true,
            description: "Resolved route payload.",
        },
    )
        data: ResolveRouteData
}
