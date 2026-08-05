import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    CodingSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/coding-submission.entity"

@ObjectType({
    description: "A page of coding submissions (newest first).",
})
/** A page of the user's submissions for one problem. */
export class MyCodingSubmissionsResponseData {
    /** The page of submissions (newest first). */
    @Field(
        () => [CodingSubmissionEntity],
        {
            description: "The page of submissions (newest first).",
        },
    )
        submissions: Array<CodingSubmissionEntity>

    /** Total submissions by the user for this problem. */
    @Field(
        () => Int,
        {
            description: "Total submissions by the user for this problem.",
        },
    )
        total: number
}

@ObjectType({
    description: "Response wrapper for the myCodingSubmissions query.",
})
/** Response wrapper for the myCodingSubmissions query. */
export class MyCodingSubmissionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyCodingSubmissionsResponseData>
{
    /** The page of submissions + total. */
    @Field(
        () => MyCodingSubmissionsResponseData,
        {
            nullable: true,
            description: "The page of submissions + total.",
        },
    )
        data: MyCodingSubmissionsResponseData
}
