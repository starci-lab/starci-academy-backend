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
    IPaginationPageResponseData,
    PaginationPageResponseData,
} from "@modules/api"

@ObjectType({
    description: "Paginated list of module contents.",
})
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
export class ContentsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ContentsResponseData>
{
    @Field(
        () => ContentsResponseData,
        {
            description: "Payload containing contents and pagination count.",
        },
    )
        data: ContentsResponseData
}
