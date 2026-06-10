import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

/**
 * Request for the `foundationCategorySuggestions` autocomplete query.
 */
@InputType({
    description: "Prefix + limit for foundation category autocomplete suggestions.",
})
export class FoundationCategorySuggestionsRequest {
    /** The typed prefix to autocomplete (e.g. "do" → "Docker"). */
    @Field(
        () => String,
        {
            description: "Typed prefix to autocomplete against category titles.",
        },
    )
        query: string

    /** Max suggestions to return; defaults to 8 and is clamped server-side. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Max suggestions to return (default 8).",
        },
    )
        limit?: number
}
