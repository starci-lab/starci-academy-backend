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
