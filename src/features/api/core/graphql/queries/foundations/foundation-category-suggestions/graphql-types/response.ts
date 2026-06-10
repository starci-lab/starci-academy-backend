import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * One autocomplete suggestion (a foundation category).
 */
@ObjectType({
    description: "A single foundation category autocomplete suggestion.",
})
export class FoundationCategorySuggestionItem {
    /** Category id (used to deep-link / select on the client). */
    @Field(
        () => String,
        {
            description: "Foundation category id.",
        },
    )
        id: string

    /** Clean display label (tech name only, e.g. "Docker"). */
    @Field(
        () => String,
        {
            description: "Clean suggestion label (bare tech name, e.g. Docker).",
        },
    )
        label: string
}

/**
 * Payload of foundation category autocomplete suggestions.
 */
@ObjectType({
    description: "Foundation category autocomplete suggestions, best match first.",
})
export class FoundationCategorySuggestionsPayload {
    /** The matching suggestions, ordered by relevance then display index. */
    @Field(
        () => [FoundationCategorySuggestionItem],
        {
            description: "Matching suggestions.",
        },
    )
        data: Array<FoundationCategorySuggestionItem>
}

@ObjectType({
    description: "Response wrapper for the foundationCategorySuggestions query.",
})
export class FoundationCategorySuggestionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<FoundationCategorySuggestionsPayload>
{
    @Field(
        () => FoundationCategorySuggestionsPayload,
        {
            nullable: true,
            description: "Autocomplete suggestions payload.",
        },
    )
        data: FoundationCategorySuggestionsPayload
}
