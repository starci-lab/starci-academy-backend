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

@ObjectType({
    description: "Result of archiving / unarchiving a content-AI conversation.",
})
/** Result of archiving / unarchiving a content-AI conversation. */
export class SetContentAiSessionArchivedData {
    @Field(
        () => Boolean,
        {
            description: "The conversation's resulting archived state.",
        },
    )
        archived: boolean
}

@ObjectType({
    description: "Response wrapper for the setContentAiSessionArchived mutation.",
})
/** GraphQL envelope returning the resulting archived flag so hide/restore stays reversible without deleting history. */
export class SetContentAiSessionArchivedResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SetContentAiSessionArchivedData>
{
    @Field(
        () => SetContentAiSessionArchivedData,
        {
            nullable: true,
            description: "The archive result.",
        },
    )
        data: SetContentAiSessionArchivedData
}
