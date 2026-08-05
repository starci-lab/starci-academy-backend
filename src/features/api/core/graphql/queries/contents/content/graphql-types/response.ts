import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Response wrapper for the content query.",
})
/**
 * Envelope for `content` -- status metadata plus the lesson entity (body may
 * already be truncated for non-enrolled premium viewers).
 */
export class ContentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ContentEntity>
{
    @Field(
        () => ContentEntity,
        {
            nullable: true,
            description: "The content for the requested id.",
        },
    )
        data: ContentEntity
}
