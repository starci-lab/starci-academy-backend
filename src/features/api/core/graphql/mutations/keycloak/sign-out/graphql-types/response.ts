import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response wrapper for signOut mutation.",
})
export class SignOutResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<undefined>
{
}
