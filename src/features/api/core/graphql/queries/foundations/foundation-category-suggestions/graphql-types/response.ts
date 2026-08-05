import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "A single foundation category autocomplete suggestion.",
})
/**
 * One autocomplete suggestion (a foundation category).
 */
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

@ObjectType({
    description: "Foundation category autocomplete suggestions, best match first.",
})
/**
 * Payload of foundation category autocomplete suggestions.
 */
export class FoundationCategorySuggestionsPayload {
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
/** The matching suggestions, ordered by relevance then display index. */
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
