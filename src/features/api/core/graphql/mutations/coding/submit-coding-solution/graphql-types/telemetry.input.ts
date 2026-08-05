import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

@InputType({
    description: "Client behavioural telemetry for anti-cheat scoring (all fields optional).",
})
/**
 * Optional client-measured behavioural telemetry sent with a coding
 * submission, used server-side to estimate AI/paste-cheat likelihood.
 */
export class CodingTelemetryInput {
    /** Number of paste events into the editor during the attempt. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Number of paste events into the editor.",
        },
    )
        pasteCount?: number

    /** Largest single paste size in characters. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Largest single paste size in characters.",
        },
    )
        pasteSizeMax?: number

    /** Total keystrokes recorded in the editor. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Total keystrokes recorded in the editor.",
        },
    )
        keystrokeCount?: number

    /** Number of times the editor tab lost focus. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Number of times the editor tab lost focus.",
        },
    )
        tabBlurCount?: number

    /** Elapsed time from opening the problem to submitting, in milliseconds. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Elapsed time from opening the problem to submitting, in milliseconds.",
        },
    )
        timeOpenToSubmitMs?: number
}
