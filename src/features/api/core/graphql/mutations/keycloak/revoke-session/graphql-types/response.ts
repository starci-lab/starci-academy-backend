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
export class RevokeSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<undefined>
{
}
