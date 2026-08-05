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

@ObjectType({
    description: "Response wrapper for the myPinnableCapstones query.",
})
/**
 * Response wrapper for the myPinnableCapstones query: the current user's
 * enrollments that have a capstone repo, for the pin picker.
 */
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
