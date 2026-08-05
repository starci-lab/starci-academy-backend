import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    MyContributionDayData,
} from "../../../dashboard/my-contribution-calendar/graphql-types"

@ObjectType({
    description: "Response wrapper for the userContributionCalendar query.",
})
/**
 * Response wrapper for the userContributionCalendar query.
 *
 * Reuses {@link MyContributionDayData} (same shape): each item is one active day
 * of the profile owner's learning activity. Differs from `myContributionCalendar`
 * only in subject -- the user named in the route, not the authenticated viewer.
 */
export class UserContributionCalendarResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<MyContributionDayData>> {
    @Field(
        () => [MyContributionDayData],
        {
            description: "Active days in the requested year, oldest first.",
        },
    )
        data: Array<MyContributionDayData>
}
