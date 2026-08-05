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
/**
 * One ES page of challenges for a content item, plus the hit count from the
 * locale index (not a Postgres `COUNT`).
 */
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
/**
 * Envelope for `challenges`. Pagination count lives on `data`, not on this wrapper.
 */
export class ChallengesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChallengesResponseData>
{
    @Field(
        () => ChallengesResponseData,
        {
            nullable: true,
            description: "Payload containing challenges and pagination count.",
        },
    )
        data: ChallengesResponseData
}
