import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

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
