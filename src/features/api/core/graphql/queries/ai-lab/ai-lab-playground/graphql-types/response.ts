import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    AiLabPlaygroundEntity,
} from "@modules/databases"

/**
 * Response wrapper for the aiLabPlayground query. The payload is the localized
 * playground config attached to a lesson, or null when the lesson has none.
 */
@ObjectType({
    description: "Response wrapper for the aiLabPlayground query.",
})
export class AiLabPlaygroundResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<AiLabPlaygroundEntity | null>
{
    /**
     * The lesson's playground config (localized), or null when none exists.
     */
    @Field(
        () => AiLabPlaygroundEntity,
        {
            nullable: true,
            description: "The lesson's AI Lab playground config, localized; null when the lesson has none.",
        },
    )
        data: AiLabPlaygroundEntity | null
}
