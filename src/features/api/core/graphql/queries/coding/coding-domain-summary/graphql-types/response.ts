import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    CodingDomain,
    GraphQLTypeCodingDomain,
} from "@modules/databases/postgresql/primary/enums/coding-domain"

@ObjectType({
    description: "How many enabled problems one interview topic domain holds.",
})
/** One domain and the size of its problem set. */
export class CodingDomainCountObject {
    /** The domain being counted. */
    @Field(
        () => GraphQLTypeCodingDomain,
        {
            description: "The interview topic domain being counted.",
        },
    )
        domain: CodingDomain

    /** How many enabled problems it holds. */
    @Field(
        () => Int,
        {
            description: "Number of enabled problems in this domain.",
        },
    )
        total: number
}

@ObjectType({
    description: "Catalog sizes per interview topic domain. A domain with no enabled problems is ABSENT rather than present with zero.",
})
/**
 * The per-domain catalog sizes.
 *
 * A domain with no enabled problems does not appear. That is the aggregation's own behaviour and it
 * is deliberately not filled in here: the twenty-member enum is public, so a caller that wants all
 * twenty composes them against this list. Emitting zero rows from the server would mean the shape
 * has to be kept in step with the enum in two places.
 */
export class CodingDomainSummaryResponseData {
    /** One entry per domain that holds at least one enabled problem. */
    @Field(
        () => [CodingDomainCountObject],
        {
            description: "One entry per domain that holds at least one enabled problem.",
        },
    )
        domains: Array<CodingDomainCountObject>
}

@ObjectType({
    description: "Response wrapper for the codingDomainSummary query.",
})
/** Response wrapper for the codingDomainSummary query. */
export class CodingDomainSummaryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CodingDomainSummaryResponseData>
{
    /** The per-domain catalog sizes. */
    @Field(
        () => CodingDomainSummaryResponseData,
        {
            nullable: true,
            description: "The per-domain catalog sizes.",
        },
    )
        data: CodingDomainSummaryResponseData
}
