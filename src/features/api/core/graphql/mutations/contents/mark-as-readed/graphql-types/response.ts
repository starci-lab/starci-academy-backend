import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserContentEntity,
} from "@modules/databases"

@ObjectType({
    description: "Response for marking a content as read.",
})
export class MarkAsReadedResponse {
    @Field(
        () => UserContentEntity,
        {
            description: "The updated user content state.",
        },
    )
        data: UserContentEntity
}
