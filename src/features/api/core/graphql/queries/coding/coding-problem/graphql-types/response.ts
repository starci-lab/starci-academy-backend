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
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"

@ObjectType({
    description: "Response wrapper for the codingProblem query.",
})
/** Response wrapper for the codingProblem query. */
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
