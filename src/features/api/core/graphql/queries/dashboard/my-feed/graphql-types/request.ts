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
    /** Recommended — recent activity across the platform. */
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

/**
 * Cursor-paginated request for the home feed (append-only activity stream →
 * cursor, not page).
 */
@InputType({
    description: "Cursor-paginated request for the home feed.",
})
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
}
