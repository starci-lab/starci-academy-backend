import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    ContentEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Data returned by the savedContents query.",
})
/**
 * Favorited lessons for the caller, newest-saved first, with total count for
 * pagination; each content includes module->course for FE grouping.
 */
export class SavedContentsData {
    @Field(
        () => [ContentEntity],
        {
            description: "List of saved contents.",
        },
    )
        contents: ContentEntity[]

    @Field(
        () => Int,
        {
            description: "Total count of saved contents.",
        },
    )
        count: number
}

@ObjectType({
    description: "Response wrapper for the savedContents query.",
})
/**
 * Envelope for `savedContents` -- status metadata plus the favorites page.
 */
export class SavedContentsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SavedContentsData>
{
    @Field(
        () => SavedContentsData,
        {
            nullable: true,
            description: "Saved contents data.",
        },
    )
        data: SavedContentsData
}
