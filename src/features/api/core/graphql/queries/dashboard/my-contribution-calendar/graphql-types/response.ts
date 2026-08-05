import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A single active day in the contribution calendar.",
})
/**
 * One day in the GitHub-style contribution calendar -- the viewer's learning
 * activity counts for that calendar day. Only days with activity are returned;
 * the client fills the empty cells of the grid with zeros.
 */
export class MyContributionDayData {
    @Field(
        () => String,
        {
            description: "Calendar day as YYYY-MM-DD (database server timezone).",
        },
    )
        date: string

    @Field(
        () => Int,
        {
            description: "Lessons/contents read on this day.",
        },
    )
        contents: number

    @Field(
        () => Int,
        {
            description: "Challenges passed on this day.",
        },
    )
        challenges: number

    @Field(
        () => Int,
        {
            description: "Milestone tasks passed on this day.",
        },
    )
        milestones: number

    @Field(
        () => Int,
        {
            description: "Total contributions this day (contents + challenges + milestones) — drives the cell intensity.",
        },
    )
        total: number
}

@ObjectType({
    description: "Response wrapper for the myContributionCalendar query.",
})
/**
 * Response wrapper for the myContributionCalendar query.
 */
export class MyContributionCalendarResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<MyContributionDayData>> {
    @Field(
        () => [MyContributionDayData],
        {
            description: "Active days in the requested window, oldest first.",
        },
    )
        data: Array<MyContributionDayData>
}
