import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    MyPinnableCapstoneItemData,
} from "./item"

/**
 * Response wrapper for the myPinnableCapstones query: the current user's
 * enrollments that have a capstone repo, for the pin picker.
 */
@ObjectType({
    description: "Response wrapper for the myPinnableCapstones query.",
})
export class MyPinnableCapstonesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<MyPinnableCapstoneItemData>> {
    @Field(
        () => [MyPinnableCapstoneItemData],
        {
            description: "The current user's pinnable capstone candidates.",
        },
    )
        data: Array<MyPinnableCapstoneItemData>
}
