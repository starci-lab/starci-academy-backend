import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    MyWeeklyStatsData,
} from "../../../dashboard/my-weekly-stats/graphql-types"

/**
 * Response wrapper for the userWeeklyStats query.
 *
 * Reuses {@link MyWeeklyStatsData} (same shape): the profile owner's current +
 * longest streak and rolling 7-day activity. Differs from `myWeeklyStats` only
 * in subject — the user named in the route, not the authenticated viewer.
 */
@ObjectType({
    description: "Response wrapper for the userWeeklyStats query.",
})
export class UserWeeklyStatsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyWeeklyStatsData> {
    @Field(
        () => MyWeeklyStatsData,
        {
            nullable: true,
            description: "The user's streak + rolling 7-day activity stats.",
        },
    )
        data: MyWeeklyStatsData
}
