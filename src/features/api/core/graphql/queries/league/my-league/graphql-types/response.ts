import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    GraphQLTypeLeagueTier,
    LeagueTier,
} from "@modules/databases"

@ObjectType({
    description: "A ranked member of the viewer's weekly-league cohort.",
})
/**
 * One ranked member of the viewer's weekly-league cohort, as drawn on the
 * standing board (avatar + name + week points + rank).
 */
export class MyLeagueEntryData {
    @Field(
        () => ID,
        {
            description: "Opaque global id of the member's user.",
        },
    )
        userGlobalId: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Member's display username (null when unset).",
        },
    )
        username: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Member's avatar URL (null when unset).",
        },
    )
        avatar: string | null

    @Field(
        () => Int,
        {
            description: "Flat reward points the member earned this week.",
        },
    )
        weekPoints: number

    @Field(
        () => Int,
        {
            description: "1-based rank within the cohort (descending by week points).",
        },
    )
        rank: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Rank movement vs last week (lastWeekRank - rank): >0 climbed, <0 dropped, null when no baseline.",
        },
    )
        rankDelta: number | null
}

@ObjectType({
    description: "The viewer's weekly-league standing (tier + cohort board).",
})
/**
 * The viewer's weekly-league standing: their tier, the week deadline, the
 * promote/demote zone sizes, and the ranked cohort entries.
 */
export class MyLeagueData {
    @Field(
        () => GraphQLTypeLeagueTier,
        {
            description: "The viewer's current league tier.",
        },
    )
        tier: LeagueTier

    @Field(
        () => Date,
        {
            description: "Exclusive end of the current week window (the reset deadline).",
        },
    )
        weekEndAt: Date

    @Field(
        () => Int,
        {
            description: "How many top members promote at the next reset.",
        },
    )
        promoteCount: number

    @Field(
        () => Int,
        {
            description: "How many bottom members demote at the next reset.",
        },
    )
        demoteCount: number

    @Field(
        () => [MyLeagueEntryData],
        {
            description: "Ranked members of the viewer's cohort (best → worst).",
        },
    )
        entries: Array<MyLeagueEntryData>
}

@ObjectType({
    description: "Response wrapper for the myLeague query.",
})
/**
 * Response wrapper for the myLeague query.
 */
export class MyLeagueResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyLeagueData> {
    @Field(
        () => MyLeagueData,
        {
            nullable: true,
            description: "The viewer's weekly-league standing.",
        },
    )
        data: MyLeagueData
}
