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
import {
    CodingProblemEntity,
} from "@modules/databases"

/** Page of coding problems + the user's solved set. */
@ObjectType({
    description: "A page of coding problems with the user's solved ids.",
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

    @Field(
        () => [ID],
        {
            description: "Ids of problems the requesting user has solved (Accepted).",
        },
    )
        solvedProblemIds: Array<string>
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
