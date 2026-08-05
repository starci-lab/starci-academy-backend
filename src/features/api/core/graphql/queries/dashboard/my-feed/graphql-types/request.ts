import {
    Field,
    InputType,
    Int,
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/** Which feed to read. */
export enum MyFeedTab {
    /** Recommended -- recent activity across the platform. */
    ForYou = "forYou",
    /** Activity from users the viewer follows. */
    Following = "following",
}

export const GraphQLTypeMyFeedTab = createEnumType(MyFeedTab)

registerEnumType(
    GraphQLTypeMyFeedTab,
    {
        name: "MyFeedTab",
        description: "Which home feed to read (forYou | following).",
        valuesMap: {
            [MyFeedTab.ForYou]: {
                description: "Recommended platform-wide feed.",
            },
            [MyFeedTab.Following]: {
                description: "Feed of followed users.",
            },
        },
    },
)

/** Filter chip -- which slice of activity to show (maps to a set of activity types). */
export enum MyFeedCategory {
    /** Everything (no type filter). */
    All = "all",
    /** Course/learning activity (enroll, read, bookmark). */
    Courses = "courses",
    /** Achievement activity (challenge/milestone/coding/AI-lab passes). */
    Achievements = "achievements",
    /** Social activity (follows, comments). */
    People = "people",
}

export const GraphQLTypeMyFeedCategory = createEnumType(MyFeedCategory)

registerEnumType(
    GraphQLTypeMyFeedCategory,
    {
        name: "MyFeedCategory",
        description: "Feed filter chip (all | courses | achievements | people).",
        valuesMap: {
            [MyFeedCategory.All]: {
                description: "No type filter.",
            },
            [MyFeedCategory.Courses]: {
                description: "Course/learning activity.",
            },
            [MyFeedCategory.Achievements]: {
                description: "Achievement (pass) activity.",
            },
            [MyFeedCategory.People]: {
                description: "Social (follow/comment) activity.",
            },
        },
    },
)

@InputType({
    description: "Cursor-paginated request for the home feed.",
})
/**
 * Cursor-paginated request for the home feed (append-only activity stream ->
 * cursor, not page).
 */
export class MyFeedRequest {
    @Field(
        () => GraphQLTypeMyFeedTab,
        {
            description: "Which feed to read.",
        },
    )
        tab: MyFeedTab

    @Field(
        () => String,
        {
            nullable: true,
            description: "Opaque cursor from the previous page's nextCursor; omit for page 1.",
        },
    )
        cursor?: string

    @Field(
        () => Int,
        {
            defaultValue: 20,
            description: "Max items per page.",
        },
    )
        limit?: number

    @Field(
        () => GraphQLTypeMyFeedCategory,
        {
            nullable: true,
            defaultValue: MyFeedCategory.All,
            description: "Filter chip — which slice of activity to show.",
        },
    )
        category?: MyFeedCategory
}
