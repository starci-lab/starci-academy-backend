import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    MyCodingProgressResponseData,
} from "../../../coding/my-coding-progress/graphql-types"

/**
 * Response wrapper for the userCodingProgress query.
 *
 * Reuses {@link MyCodingProgressResponseData} (same shape): the profile owner's
 * solved / attempted / revealed problem ids + total coding points. Differs from
 * `myCodingProgress` only in subject — the user named in the route.
 */
@ObjectType({
    description: "Response wrapper for the userCodingProgress query.",
})
export class UserCodingProgressResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyCodingProgressResponseData> {
    @Field(
        () => MyCodingProgressResponseData,
        {
            nullable: true,
            description: "The user's coding progress.",
        },
    )
        data: MyCodingProgressResponseData
}
