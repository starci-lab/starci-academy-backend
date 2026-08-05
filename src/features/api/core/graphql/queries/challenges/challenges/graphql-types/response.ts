import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
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
