import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    LivestreamSessionEntity,
} from "@modules/databases/postgresql/primary/entities/livestream-session.entity"
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
    description: "Paginated list of livestream sessions for a course.",
})
/** One page of localized livestream sessions plus the total matching count. */
export class LivestreamSessionsResponseData
    extends PaginationPageResponseData
    implements IPaginationPageResponseData<LivestreamSessionEntity>
{
    @Field(
        () => [LivestreamSessionEntity],
        {
            description: "Livestream sessions for the current page.",
        },
    )
        data: Array<LivestreamSessionEntity>
}

@ObjectType({
    description: "Response wrapper for the livestreamSessions query.",
})
/** GraphQL envelope for the `livestreamSessions` query. */
export class LivestreamSessionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<LivestreamSessionsResponseData>
{
    @Field(
        () => LivestreamSessionsResponseData,
        {
            nullable: true,
            description: "Payload containing livestream sessions and pagination count.",
        },
    )
        data: LivestreamSessionsResponseData
}
