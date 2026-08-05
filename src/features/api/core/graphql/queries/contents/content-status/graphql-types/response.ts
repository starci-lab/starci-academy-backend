import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "User's content interaction status.",
})
/**
 * Caller-specific interaction flags for one lesson (read + favorite).
 * Missing user_contents rows surface as both false, not null.
 */
export class ContentStatusData {
    @Field(
        () => Boolean,
        {
            description: "Whether the user has read this content.",
        },
    )
        isRead: boolean

    @Field(
        () => Boolean,
        {
            description: "Whether the user has saved/favorited this content.",
        },
    )
        isFavorite: boolean
}

@ObjectType({
    description: "Response wrapper for the contentStatus query.",
})
/**
 * Envelope for `contentStatus` — status metadata plus the interaction flags.
 */
export class ContentStatusResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ContentStatusData>
{
    @Field(
        () => ContentStatusData,
        {
            nullable: true,
            description: "Content status data.",
        },
    )
        data: ContentStatusData
}
