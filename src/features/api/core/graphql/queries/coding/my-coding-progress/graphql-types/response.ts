import {
    Field,
    ID,
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
    description: "Distinct problems the viewer has solved in one interview topic domain.",
})
/** One domain and how many of its problems the viewer has solved. */
export class MyCodingDomainSolvedObject {
    /** The domain. */
    @Field(
        () => GraphQLTypeCodingDomain,
        {
            description: "The interview topic domain.",
        },
    )
        domain: CodingDomain

    /** Distinct problems solved in it. */
    @Field(
        () => Int,
        {
            description: "Number of distinct problems the viewer has solved in this domain.",
        },
    )
        solved: number
}

@ObjectType({
    description: "Per-user coding progress: solved/attempted/revealed ids + total points.",
})
/** The authenticated user's coding-practice status (decoupled from the catalog). */
export class MyCodingProgressResponseData {
    /** Problem ids the user has solved (Accepted). */
    @Field(
        () => [ID],
        {
            description: "Problem ids the user has solved (Accepted).",
        },
    )
        solvedProblemIds: Array<string>

    /** Problem ids the user has submitted to (any verdict). */
    @Field(
        () => [ID],
        {
            description: "Problem ids the user has submitted to (any verdict).",
        },
    )
        attemptedProblemIds: Array<string>

    /** Problem ids whose reference solution the user revealed. */
    @Field(
        () => [ID],
        {
            description: "Problem ids whose reference solution the user revealed.",
        },
    )
        revealedProblemIds: Array<string>

    /** Cumulative coding points earned by the user. */
    @Field(
        () => Int,
        {
            description: "Cumulative coding points earned by the user.",
        },
    )
        totalPoints: number

    /**
     * Distinct problems solved, grouped by domain.
     *
     * A domain the viewer has never solved in is ABSENT rather than present with zero -- this is a
     * GROUP BY, and a group with no rows produces no bucket. The twenty-member enum is public, so a
     * caller that wants all twenty composes them against this list.
     *
     * It is read from the coding projection rather than recomputed here. That projection already
     * runs exactly this rollup for the public profile, and running it a second time would put the
     * same GROUP BY in two files and stack two staleness policies over one number.
     */
    @Field(
        () => [MyCodingDomainSolvedObject],
        {
            description: "Distinct problems solved, grouped by domain. A domain with no solves is absent rather than zero.",
        },
    )
        byDomain: Array<MyCodingDomainSolvedObject>
}

@ObjectType({
    description: "Response wrapper for the myCodingProgress query.",
})
/** Response wrapper for the myCodingProgress query. */
export class MyCodingProgressResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyCodingProgressResponseData>
{
    /** The user's coding progress. */
    @Field(
        () => MyCodingProgressResponseData,
        {
            nullable: true,
            description: "The user's coding progress.",
        },
    )
        data: MyCodingProgressResponseData
}
