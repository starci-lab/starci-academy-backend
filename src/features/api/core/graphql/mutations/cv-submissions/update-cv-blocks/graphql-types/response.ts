import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    CvBlocksDocument,
} from "../../../../queries/cv-submissions/my-cv-blocks/graphql-types/response"

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
