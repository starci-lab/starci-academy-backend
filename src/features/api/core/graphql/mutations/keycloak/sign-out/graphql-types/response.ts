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
/**
 * Empty success envelope — sign-out's work is cookie/session side-effects,
 * not a returned payload.
 */
export class SignOutResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<undefined>
{
}
