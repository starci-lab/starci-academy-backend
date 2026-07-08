import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Identifies the deleted CV document.",
})
export class DeleteCvBlocksData {
    @Field(
        () => ID,
        {
            description: "cv_blocks.id of the deleted document.",
        },
    )
        id: string
}

@ObjectType({
    description: "Response wrapper for the deleteCvBlocks mutation.",
})
export class DeleteCvBlocksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<DeleteCvBlocksData | null>
{
    @Field(
        () => DeleteCvBlocksData,
        {
            nullable: true,
            description: "The deleted document id.",
        },
    )
        data: DeleteCvBlocksData | null
}
