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
    PaginationPageResponseData,
} from "@modules/api/apollo/server/graphql-types/object-types/pagination-page"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    IPaginationPageResponseData,
} from "@modules/api/apollo/server/types/pagination"

@ObjectType({
    description: "Paginated list of module contents.",
})
/**
 * Page of module lessons plus total hit count -- bodies may already be premium-truncated.
 */
export class ContentsResponseData
    extends PaginationPageResponseData
    implements IPaginationPageResponseData<ContentEntity>
{
    @Field(
        () => [ContentEntity],
        {
            description: "Contents for the current page.",
        },
    )
        data: Array<ContentEntity>
}

@ObjectType({
    description: "Response wrapper for the contents query.",
})
/**
 * Envelope for `contents` -- status metadata plus the paginated lesson page.
 */
export class ContentsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ContentsResponseData>
{
    @Field(
        () => ContentsResponseData,
        {
            nullable: true,
            description: "Payload containing contents and pagination count.",
        },
    )
        data: ContentsResponseData
}
