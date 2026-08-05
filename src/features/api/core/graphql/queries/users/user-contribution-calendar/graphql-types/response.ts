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
    MyContributionDayData,
} from "../../../dashboard/my-contribution-calendar/graphql-types/response"

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
