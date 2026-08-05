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
