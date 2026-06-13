import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    AiLabEvalRunEntity,
} from "@modules/databases"

/**
 * Response wrapper for the aiLabEvalResult query. The payload is one graded eval
 * run (with its per-case results) owned by the authenticated learner.
 */
@ObjectType({
    description: "Response wrapper for the aiLabEvalResult query.",
})
export class AiLabEvalResultResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<AiLabEvalRunEntity | null>
{
    /**
     * The graded eval run with per-case results, or null when absent / not owned.
     */
    @Field(
        () => AiLabEvalRunEntity,
        {
            nullable: true,
            description: "The graded eval run with per-case results; null when absent or not owned.",
        },
    )
        data: AiLabEvalRunEntity | null
}
