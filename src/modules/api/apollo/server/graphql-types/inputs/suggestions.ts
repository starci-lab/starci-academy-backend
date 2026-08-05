import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

@InputType({
    description: "Prefix + limit for an entity autocomplete suggestions query.",
})
/**
 * Generic request for any entity autocomplete (typeahead) query.
 *
 * Reused by every entity's `*Suggestions` query -- the prefix + an optional
 * server-clamped limit are all an ES Completion Suggester needs.
 */
export class SuggestionsRequest {
    /** The typed prefix to autocomplete (e.g. "do" -> "Docker"). */
    @Field(
        () => String,
        {
            description: "Typed prefix to autocomplete against entity labels.",
        },
    )
        query: string

    /** Max suggestions to return; defaults server-side and is clamped server-side. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Max suggestions to return (clamped server-side).",
        },
    )
        limit?: number
}
