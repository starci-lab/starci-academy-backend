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
import {
    MyCodingProgressResponseData,
} from "../../../coding/my-coding-progress/graphql-types/response"

@ObjectType({
    description: "Response wrapper for the userCodingProgress query.",
})
/**
 * Response wrapper for the userCodingProgress query.
 *
 * Reuses {@link MyCodingProgressResponseData} (same shape): the profile owner's
 * solved / attempted / revealed problem ids + total coding points. Differs from
 * `myCodingProgress` only in subject -- the user named in the route.
 */
export class UserCodingProgressResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyCodingProgressResponseData> {
    /** Same shape as `myCodingProgress`'s data -- only the subject user differs. */
    @Field(
        () => MyCodingProgressResponseData,
        {
            nullable: true,
            description: "The user's coding progress.",
        },
    )
        data: MyCodingProgressResponseData
}
