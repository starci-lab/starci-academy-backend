import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    CodingLanguage,
    GraphQLTypeCodingLanguage,
} from "@modules/databases"
import {
    CodingTelemetryInput,
} from "./telemetry.input"

@InputType({
    description: "Submit a solution to a coding problem for judging.",
})
/** Request for submitting a coding solution. */
export class SubmitCodingSolutionRequest {
    /** Identifies which problem this submission is judged against. */
    @Field(
        () => String,
        {
            description: "Slug of the problem being solved.",
        },
    )
        slug: string

    /** Selects the judge runtime — must match a language the problem actually offers a checker for. */
    @Field(
        () => GraphQLTypeCodingLanguage,
        {
            description: "Language the solution is written in.",
        },
    )
        language: CodingLanguage

    /** The code sent to Judge0 for execution against the problem's testcases. */
    @Field(
        () => String,
        {
            description: "The source code to judge.",
        },
    )
        sourceCode: string

    /** Omitted by older clients; captured for transport only, no server-side consumer reads it back yet. */
    @Field(
        () => CodingTelemetryInput,
        {
            nullable: true,
            description: "Optional client behavioural telemetry for anti-cheat scoring.",
        },
    )
        telemetry?: CodingTelemetryInput
}
