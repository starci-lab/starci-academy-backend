import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

/**
 * Optional client-measured behavioural telemetry sent with a coding
 * submission, used server-side to estimate AI/paste-cheat likelihood.
 */
@InputType({
    description: "Client behavioural telemetry for anti-cheat scoring (all fields optional).",
})
export class CodingTelemetryInput {
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Number of paste events into the editor.",
        },
    )
        pasteCount?: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Largest single paste size in characters.",
        },
    )
        pasteSizeMax?: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Total keystrokes recorded in the editor.",
        },
    )
        keystrokeCount?: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Number of times the editor tab lost focus.",
        },
    )
        tabBlurCount?: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Elapsed time from opening the problem to submitting, in milliseconds.",
        },
    )
        timeOpenToSubmitMs?: number
}
