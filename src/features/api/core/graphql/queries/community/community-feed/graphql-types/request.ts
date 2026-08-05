import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    CommunityChannel,
    GraphQLTypeCommunityChannel,
} from "@modules/databases"

@InputType({
    description: "Cursor-paginated request for the community feed.",
})
/** Cursor-paginated request for the community feed. */
export class CommunityFeedRequest {
    /** Channel to scope to; omit/null to read across all channels. */
    @Field(
        () => GraphQLTypeCommunityChannel,
        {
            nullable: true,
            description: "Channel to scope to; omit for all channels.",
        },
    )
        channel?: CommunityChannel | null

    /** Opaque cursor from the previous page's nextCursor; omit for page 1. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Opaque cursor from the previous page's nextCursor; omit for page 1.",
        },
    )
        cursor?: string

    /** Max items per page. */
    @Field(
        () => Int,
        {
            defaultValue: 20,
            description: "Max items per page.",
        },
    )
        limit?: number
}
