import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CodingProblemEntity,
} from "@modules/databases"

/** Response wrapper for the codingProblem query. */
@ObjectType({
    description: "Response wrapper for the codingProblem query.",
})
export class CodingProblemResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CodingProblemEntity>
{
    /** The problem detail (sample testcases only, localized). */
    @Field(
        () => CodingProblemEntity,
        {
            nullable: true,
            description: "The problem detail (sample testcases only, localized).",
        },
    )
        data: CodingProblemEntity
}
