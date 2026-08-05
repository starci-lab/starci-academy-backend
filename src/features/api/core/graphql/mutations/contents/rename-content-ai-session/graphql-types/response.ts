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
    description: "Result of renaming a content-AI conversation.",
})
/** Result of renaming a content-AI conversation. */
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
/** GraphQL envelope confirming the sidebar label changed so the user is not stuck with a generated title. */
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
