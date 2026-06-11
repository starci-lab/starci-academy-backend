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
    InterviewVerdict,
} from "@modules/bussiness"
import {
    GraphQLTypeInterviewVerdict,
} from "./enums"

/** The graded result for one interview answer. */
@ObjectType({
    description: "Grade for a single transcribed interview answer.",
})
export class InterviewGradeResultData {
    @Field(
        () => Int,
        {
            description: "Overall score, integer 0–100.",
        },
    )
        score: number

    @Field(
        () => GraphQLTypeInterviewVerdict,
        {
            description: "Coarse pass/borderline/fail band.",
        },
    )
        verdict: InterviewVerdict

    @Field(
        () => [String],
        {
            description: "Concrete things the candidate got right.",
        },
    )
        strengths: Array<string>

    @Field(
        () => [String],
        {
            description: "Concrete things missing or wrong, framed as what to add.",
        },
    )
        gaps: Array<string>

    @Field(
        () => String,
        {
            nullable: true,
            description: "One-line nudge toward the model answer, or null.",
        },
    )
        modelAnswerHint?: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "A natural follow-up an interviewer would ask next, or null.",
        },
    )
        followUpQuestion?: string | null
}

@ObjectType({
    description: "Response wrapper for the gradeInterviewAnswer mutation.",
})
export class GradeInterviewAnswerResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<InterviewGradeResultData>
{
    @Field(
        () => InterviewGradeResultData,
        {
            nullable: true,
            description: "The graded interview answer.",
        },
    )
        data: InterviewGradeResultData
}
