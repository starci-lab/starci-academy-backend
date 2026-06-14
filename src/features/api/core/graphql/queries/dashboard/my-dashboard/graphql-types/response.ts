import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    ActivityType,
    GraphQLTypeActivityType,
} from "@modules/databases"

/**
 * A clickable left-rail item (enrolled course / recent lesson / in-progress
 * challenge). Routes are resolved lazily via the route index on click, so it
 * carries only an opaque global id + a label.
 */
@ObjectType({
    description: "A clickable left-rail item (course / lesson / challenge token).",
})
export class MyDashboardRefItemData {
    @Field(
        () => String,
        {
            description: "Opaque global id — pass to resolveRoute on click.",
        },
    )
        globalId: string

    @Field(
        () => String,
        {
            description: "Token label (course / lesson / challenge title).",
        },
    )
        label: string
}

/**
 * One activity item in the GitHub-style home feed — something a user the viewer
 * follows did (read/bookmark/pass/enroll/comment/follow). Route + title parts
 * are snapshotted on the activity row, so most fields are nullable per type.
 */
@ObjectType({
    description: "A followed user's activity for the home feed (token-based).",
})
export class MyDashboardFeedItemData {
    @Field(
        () => String,
        {
            description: "Opaque global id of the actor (a user) — feed this to resolveRoute.",
        },
    )
        actorGlobalId: string

    @Field(
        () => String,
        {
            description: "Actor username (the actor token label).",
        },
    )
        actorUsername: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Avatar URL of the actor, or null when unset.",
        },
    )
        actorAvatar: string | null

    @Field(
        () => GraphQLTypeActivityType,
        {
            description: "Kind of activity (drives the feed phrasing).",
        },
    )
        type: ActivityType

    @Field(
        () => String,
        {
            nullable: true,
            description: "Opaque global id of the target entity — feed this to resolveRoute.",
        },
    )
        targetGlobalId: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Target token label (lesson/challenge/course title, or username).",
        },
    )
        targetLabel: string | null

    @Field(
        () => Date,
        {
            description: "When the activity happened.",
        },
    )
        at: Date
}

/**
 * Aggregated dashboard payload — the GitHub-style logged-in home: the viewer's
 * read-lesson history (left rail) plus a feed of followed users' activity.
 */
@ObjectType({
    description: "Aggregated dashboard data for the authenticated user.",
})
export class MyDashboardResponseData {
    @Field(
        () => [MyDashboardRefItemData],
        {
            description: "Courses the viewer has joined (left rail).",
        },
    )
        enrolledCourses: Array<MyDashboardRefItemData>

    @Field(
        () => [MyDashboardRefItemData],
        {
            description: "Lessons the viewer recently read (left rail).",
        },
    )
        learnedLessons: Array<MyDashboardRefItemData>

    @Field(
        () => [MyDashboardRefItemData],
        {
            description: "Challenges the viewer has started but not yet passed (left rail).",
        },
    )
        inProgressChallenges: Array<MyDashboardRefItemData>
}

/**
 * Response wrapper for the myDashboard query.
 */
@ObjectType({
    description: "Response wrapper for the myDashboard query.",
})
export class MyDashboardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyDashboardResponseData>
{
    @Field(
        () => MyDashboardResponseData,
        {
            nullable: true,
            description: "Aggregated dashboard data.",
        },
    )
        data: MyDashboardResponseData
}
