import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CodingProblemEntity,
} from "@modules/databases"

/** Page of coding problems (shared catalog — per-user state is myCodingProgress). */
@ObjectType({
    description: "A page of coding problems (catalog only; solved state is myCodingProgress).",
})
export class CodingProblemsResponseData {
    /** The page of problems (title localized; no testcases). */
    @Field(
        () => [CodingProblemEntity],
        {
            description: "The page of problems (title localized; no testcases).",
        },
    )
        problems: Array<CodingProblemEntity>

    /** Total problems matching the filters. */
    @Field(
        () => Int,
        {
            description: "Total problems matching the filters.",
        },
    )
        total: number
}

/** Response wrapper for the codingProblems query. */
@ObjectType({
    description: "Response wrapper for the codingProblems query.",
})
export class CodingProblemsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CodingProblemsResponseData>
{
    /** The page of problems + solved ids. */
    @Field(
        () => CodingProblemsResponseData,
        {
            nullable: true,
            description: "The page of problems + solved ids.",
        },
    )
        data: CodingProblemsResponseData
}
