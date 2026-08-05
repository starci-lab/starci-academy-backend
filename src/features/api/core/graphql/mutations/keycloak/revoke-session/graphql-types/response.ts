import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Response wrapper for the revokeSession mutation.",
})
/**
 * Empty success envelope -- revoke has no payload; the other device simply
 * fails its next refresh. No `data` field on purpose.
 */
export class RevokeSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<undefined>
{
}
