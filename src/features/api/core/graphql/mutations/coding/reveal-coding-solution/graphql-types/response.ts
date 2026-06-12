import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CodingProblemSolutionEntity,
} from "@modules/databases"

/** Outcome of revealing a problem's reference solution. */
@ObjectType({
    description: "The reveal outcome plus the problem's reference solutions (served only through this gated flow).",
})
export class RevealCodingSolutionResponseData {
    @Field(
        () => Boolean,
        {
            description: "True when this call recorded a new reveal; false when already revealed.",
        },
    )
        revealed: boolean

    @Field(
        () => [CodingProblemSolutionEntity],
        {
            description: "The problem's full reference solutions, one per supported language.",
        },
    )
        solutions: Array<CodingProblemSolutionEntity>
}

@ObjectType({
    description: "Response wrapper for the revealCodingSolution mutation.",
})
export class RevealCodingSolutionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RevealCodingSolutionResponseData>
{
    @Field(
        () => RevealCodingSolutionResponseData,
        {
            nullable: true,
            description: "The reveal outcome.",
        },
    )
        data: RevealCodingSolutionResponseData
}
