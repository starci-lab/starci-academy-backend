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
    @Field(
        () => [CodingProblemEntity],
        {
            description: "The page of problems (title localized; no testcases).",
        },
    )
        problems: Array<CodingProblemEntity>

    @Field(
        () => Int,
        {
            description: "Total problems matching the filters.",
        },
    )
        total: number
}

@ObjectType({
    description: "Response wrapper for the codingProblems query.",
})
export class CodingProblemsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CodingProblemsResponseData>
{
    @Field(
        () => CodingProblemsResponseData,
        {
            nullable: true,
            description: "The page of problems + solved ids.",
        },
    )
        data: CodingProblemsResponseData
}
