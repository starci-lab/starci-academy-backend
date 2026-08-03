import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CodingSubmissionEntity,
} from "@modules/databases"

/** A page of the user's submissions for one problem. */
@ObjectType({
    description: "A page of coding submissions (newest first).",
})
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

/** Response wrapper for the myCodingSubmissions query. */
@ObjectType({
    description: "Response wrapper for the myCodingSubmissions query.",
})
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
