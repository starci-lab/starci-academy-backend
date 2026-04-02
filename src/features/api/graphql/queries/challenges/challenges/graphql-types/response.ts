import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ChallengeEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
    IPaginationPageResponseData,
    PaginationPageResponseData,
} from "@modules/api"

@ObjectType({
    description: "Paginated list of module challenges.",
})
export class ChallengesResponseData
    extends PaginationPageResponseData
    implements IPaginationPageResponseData<ChallengeEntity>
{
    @Field(
        () => [ChallengeEntity],
        {
            description: "Challenges for the current page.",
        },
    )
        data: Array<ChallengeEntity>
}

@ObjectType({
    description: "Response wrapper for the challenges query.",
})
export class ChallengesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChallengesResponseData>
{
    @Field(
        () => ChallengesResponseData,
        {
            description: "Payload containing challenges and pagination count.",
        },
    )
        data: ChallengesResponseData
}
