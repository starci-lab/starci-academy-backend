import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Payload of the resolveRoute query. */
@ObjectType({
    description: "Resolved canonical route for a global id.",
})
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

/** Response wrapper for the resolveRoute query. */
@ObjectType({
    description: "Response wrapper for the resolveRoute query.",
})
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
