import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ContentEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response wrapper for the publicContent query.",
})
/**
 * Envelope for `publicContent` — unauthenticated free-lesson payload only.
 */
export class PublicContentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ContentEntity>
{
    @Field(
        () => ContentEntity,
        {
            nullable: true,
            description: "The public content for the requested id.",
        },
    )
        data: ContentEntity
}
