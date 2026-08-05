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

@ObjectType({
    description: "An in-progress challenge (rail token).",
})
/**
 * One challenge the viewer has started but not yet passed -- a route-index token
 * (resolves its route on click), so it carries only an opaque global id + label.
 */
export class MyInProgressChallengeItemData {
    @Field(
        () => String,
        {
            description: "Opaque global id of the challenge — pass to resolveRoute on click.",
        },
    )
        globalId: string

    @Field(
        () => String,
        {
            description: "Challenge title (the token label).",
        },
    )
        label: string
}

@ObjectType({
    description: "Response wrapper for the myInProgressChallenges query.",
})
/**
 * Response wrapper for the myInProgressChallenges query.
 */
export class MyInProgressChallengesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<MyInProgressChallengeItemData>> {
    @Field(
        () => [MyInProgressChallengeItemData],
        {
            description: "Challenges the viewer has started but not yet passed.",
        },
    )
        data: Array<MyInProgressChallengeItemData>
}
