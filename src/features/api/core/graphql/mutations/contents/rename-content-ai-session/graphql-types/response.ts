import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Result of renaming a content-AI conversation. */
@ObjectType({
    description: "Result of renaming a content-AI conversation.",
})
export class RenameContentAiSessionData {
    @Field(
        () => Boolean,
        {
            description: "Whether the conversation was renamed.",
        },
    )
        renamed: boolean
}

@ObjectType({
    description: "Response wrapper for the renameContentAiSession mutation.",
})
export class RenameContentAiSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RenameContentAiSessionData>
{
    @Field(
        () => RenameContentAiSessionData,
        {
            nullable: true,
            description: "The rename result.",
        },
    )
        data: RenameContentAiSessionData
}
