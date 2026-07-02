import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

/**
 * Request for {@link MyCvGenerationsResponse}: paginate the caller's CV
 * generation runs (newest first). Both fields are optional and defaulted /
 * clamped server-side.
 */
@InputType({
    description: "Pagination for the caller's CV generation runs.",
})
export class MyCvGenerationsRequest {
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Max rows to return (clamped server-side).",
        },
    )
        limit?: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Rows to skip before the page (defaults to 0).",
        },
    )
        offset?: number
}
