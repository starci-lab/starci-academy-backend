import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    ActivityType,
    GraphQLTypeActivityType,
    GraphQLTypeReactionType,
    ReactionType,
} from "@modules/databases"

@ObjectType({
    description: "A home-feed activity item (token-based).",
})
/**
 * One activity item in the GitHub-style home feed — something a followed user (or,
 * on the "for you" tab, anyone) did (read/bookmark/pass/enroll/comment/follow).
 * Route + label are token-based: resolved lazily on click via the route index.
 */
export class MyFeedItemData {
    @Field(
        () => String,
        {
            description: "Activity id — pass to reactToActivity (the thing being reacted to).",
        },
    )
        id: string

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

    @Field(
        () => Int,
        {
            description: "Total reactions on this activity.",
        },
    )
        reactionCount: number

    @Field(
        () => GraphQLTypeReactionType,
        {
            nullable: true,
            description: "The viewer's own reaction on this activity, or null.",
        },
    )
        myReaction: ReactionType | null

    @Field(
        () => Boolean,
        {
            description: "Whether this activity belongs to the viewer (cannot react to own).",
        },
    )
        isMine: boolean
}

@ObjectType({
    description: "A cursor-paginated page of home-feed activity items.",
})
/** One cursor-paginated page of the home feed. */
export class MyFeedResponseData {
    @Field(
        () => [MyFeedItemData],
        {
            description: "Feed items for this page, newest first.",
        },
    )
        items: Array<MyFeedItemData>

    @Field(
        () => String,
        {
            nullable: true,
            description: "Opaque cursor for the next page; null when there are no more items.",
        },
    )
        nextCursor: string | null
}

@ObjectType({
    description: "Response wrapper for the myFeed query.",
})
/** Response wrapper for the myFeed query. */
export class MyFeedResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFeedResponseData>
{
    @Field(
        () => MyFeedResponseData,
        {
            nullable: true,
            description: "A page of feed items + next cursor.",
        },
    )
        data: MyFeedResponseData
}
