import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    LivestreamSessionEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
    IPaginationPageResponseData,
    PaginationPageResponseData,
} from "@modules/api"

@ObjectType({
    description: "Paginated list of livestream sessions for a course.",
})
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
export class LivestreamSessionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<LivestreamSessionsResponseData>
{
    @Field(
        () => LivestreamSessionsResponseData,
        {
            description: "Payload containing livestream sessions and pagination count.",
        },
    )
        data: LivestreamSessionsResponseData
}
