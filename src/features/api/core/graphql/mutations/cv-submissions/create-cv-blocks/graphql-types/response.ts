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
    description: "Response wrapper for the createCvBlocks mutation.",
})
/** GraphQL envelope returning the saved document so the editor can switch to the new id without a follow-up query. */
export class CreateCvBlocksResponse
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
