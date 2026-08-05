import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CvBlocksDocument,
} from "@features/api/core/graphql/queries/cv-submissions/my-cv-blocks"

export {
    CvBlocksDocument,
}

@ObjectType({
    description: "Response wrapper for the updateCvBlocks mutation.",
})
/** GraphQL envelope returning the updated document so the editor can replace local state without a refetch race. */
export class UpdateCvBlocksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CvBlocksDocument | null>
{
    @Field(
        () => CvBlocksDocument,
        {
            nullable: true,
            description: "The affected CV document.",
        },
    )
        data: CvBlocksDocument | null
}
