import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Result of archiving / unarchiving a content-AI conversation. */
@ObjectType({
    description: "Result of archiving / unarchiving a content-AI conversation.",
})
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
