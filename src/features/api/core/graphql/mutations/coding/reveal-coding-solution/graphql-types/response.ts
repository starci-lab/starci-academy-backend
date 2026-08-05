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

@ObjectType({
    description: "The reveal outcome plus the problem's reference solutions (served only through this gated flow).",
})
/** Outcome of revealing a problem's reference solution. */
export class RevealCodingSolutionResponseData {
    /** False means the answer was already forfeited on an earlier call -- idempotent, no new penalty applied. */
    @Field(
        () => Boolean,
        {
            description: "True when this call recorded a new reveal; false when already revealed.",
        },
    )
        revealed: boolean

    /** The payload this gated mutation exists to serve -- solutions are never exposed via the problem detail read. */
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
/** Response wrapper for the `revealCodingSolution` mutation; the reveal outcome lives in {@link data}. */
export class RevealCodingSolutionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RevealCodingSolutionResponseData>
{
    /** Null on error -- inspect the wrapper's status/error fields instead. */
    @Field(
        () => RevealCodingSolutionResponseData,
        {
            nullable: true,
            description: "The reveal outcome.",
        },
    )
        data: RevealCodingSolutionResponseData
}
