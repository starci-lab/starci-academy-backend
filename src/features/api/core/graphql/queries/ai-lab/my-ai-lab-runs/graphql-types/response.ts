import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    AiLabRunEntity,
} from "@modules/databases"

/**
 * Response wrapper for the myAiLabRuns query. The payload is the authenticated
 * learner's runs within a playground, newest first.
 */
@ObjectType({
    description: "Response wrapper for the myAiLabRuns query.",
})
export class MyAiLabRunsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<AiLabRunEntity>>
{
    /**
     * The learner's runs in this playground, newest first.
     */
    @Field(
        () => [AiLabRunEntity],
        {
            nullable: true,
            description: "The learner's runs in this playground, newest first.",
        },
    )
        data: Array<AiLabRunEntity>
}
