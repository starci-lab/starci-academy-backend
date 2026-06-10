import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "./graphql-response"
import {
    IAbstractGraphQLResponse,
} from "../../types"

/**
 * One generic autocomplete suggestion (any entity).
 *
 * Reused by every entity's `*Suggestions` query — the id deep-links/selects the
 * entity on the client, the label is the clean display string.
 */
@ObjectType({
    description: "A single entity autocomplete suggestion.",
})
export class SuggestionItem {
    /** Entity id (used to deep-link / select on the client). */
    @Field(
        () => String,
        {
            description: "Suggested entity id.",
        },
    )
        id: string

    /** Clean display label (e.g. "Docker"). */
    @Field(
        () => String,
        {
            description: "Clean suggestion label.",
        },
    )
        label: string
}

/**
 * Generic payload of autocomplete suggestions, best match first.
 *
 * Reused by every entity's `*Suggestions` query.
 */
@ObjectType({
    description: "Entity autocomplete suggestions, best match first.",
})
export class SuggestionsPayload {
    /** The matching suggestions, ordered by relevance then display index. */
    @Field(
        () => [SuggestionItem],
        {
            description: "Matching suggestions.",
        },
    )
        data: Array<SuggestionItem>
}

/**
 * Generic response wrapper for any entity `*Suggestions` query.
 *
 * Reused by every entity's `*Suggestions` query — wraps {@link SuggestionsPayload}
 * in the standard success/message/error envelope.
 */
@ObjectType({
    description: "Response wrapper for an entity autocomplete suggestions query.",
})
export class SuggestionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SuggestionsPayload>
{
    /** Autocomplete suggestions payload (null on an error envelope). */
    @Field(
        () => SuggestionsPayload,
        {
            nullable: true,
            description: "Autocomplete suggestions payload.",
        },
    )
        data: SuggestionsPayload
}
