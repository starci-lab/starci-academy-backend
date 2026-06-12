import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** The authenticated user's coding-practice status (decoupled from the catalog). */
@ObjectType({
    description: "Per-user coding progress: solved/attempted/revealed ids + total points.",
})
export class MyCodingProgressResponseData {
    @Field(
        () => [ID],
        {
            description: "Problem ids the user has solved (Accepted).",
        },
    )
        solvedProblemIds: Array<string>

    @Field(
        () => [ID],
        {
            description: "Problem ids the user has submitted to (any verdict).",
        },
    )
        attemptedProblemIds: Array<string>

    @Field(
        () => [ID],
        {
            description: "Problem ids whose reference solution the user revealed.",
        },
    )
        revealedProblemIds: Array<string>

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
export class MyCodingProgressResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyCodingProgressResponseData>
{
    @Field(
        () => MyCodingProgressResponseData,
        {
            nullable: true,
            description: "The user's coding progress.",
        },
    )
        data: MyCodingProgressResponseData
}
