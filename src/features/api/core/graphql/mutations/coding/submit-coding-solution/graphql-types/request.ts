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

/** Request for submitting a coding solution. */
@InputType({
    description: "Submit a solution to a coding problem for judging.",
})
export class SubmitCodingSolutionRequest {
    @Field(
        () => String,
        {
            description: "Slug of the problem being solved.",
        },
    )
        slug: string

    @Field(
        () => GraphQLTypeCodingLanguage,
        {
            description: "Language the solution is written in.",
        },
    )
        language: CodingLanguage

    @Field(
        () => String,
        {
            description: "The source code to judge.",
        },
    )
        sourceCode: string

    @Field(
        () => CodingTelemetryInput,
        {
            nullable: true,
            description: "Optional client behavioural telemetry for anti-cheat scoring.",
        },
    )
        telemetry?: CodingTelemetryInput
}
