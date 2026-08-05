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
    description: "A resolved ancestor (course/module/content/challenge) of a search hit.",
})
/**
 * One ancestor node -- `id` for UUID-keyed learn URLs, `displayId` for the
 * course slug segment. Without both, the client cannot assemble a deep-link.
 */
export class AutocompleteGlobalSearchParentRef {
    @Field(
        () => String,
        {
            description: "Primary key (UUID) of the ancestor — used for module/content learn URLs.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Human-facing slug of the ancestor — used for the course URL segment.",
        },
    )
        displayId: string
}

@ObjectType({
    description: "Ancestor chain of a search hit, used by clients to build a navigation URL.",
})
/**
 * Sparse ancestor chain for one hit. Only the levels that exist for that
 * entity kind are set; missing levels stay undefined so the client does not
 * invent a parent.
 */
export class AutocompleteGlobalSearchParentPath {
    @Field(
        () => AutocompleteGlobalSearchParentRef,
        {
            nullable: true,
            description: "Owning course (present for every entity kind).",
        },
    )
        course?: AutocompleteGlobalSearchParentRef

    @Field(
        () => AutocompleteGlobalSearchParentRef,
        {
            nullable: true,
            description: "Owning module (present for module/content/challenge hits).",
        },
    )
        module?: AutocompleteGlobalSearchParentRef

    @Field(
        () => AutocompleteGlobalSearchParentRef,
        {
            nullable: true,
            description: "Owning content (present for content/challenge hits).",
        },
    )
        content?: AutocompleteGlobalSearchParentRef

    @Field(
        () => AutocompleteGlobalSearchParentRef,
        {
            nullable: true,
            description: "The challenge itself (present for challenge hits).",
        },
    )
        challenge?: AutocompleteGlobalSearchParentRef

    @Field(
        () => AutocompleteGlobalSearchParentRef,
        {
            nullable: true,
            description: "The milestone's first task (present for milestone hits) — used to deep-link into the personal-project page.",
        },
    )
        task?: AutocompleteGlobalSearchParentRef
}

@ObjectType({
    description: "A single autocomplete item returned by global search.",
})
/**
 * One typeahead row. `path` is the locale-agnostic route the server already
 * built; `parentPath` is the fallback graph when path is null (cache miss).
 * Course/content state flags are kind-specific and null elsewhere.
 */
export class AutocompleteGlobalSearchItem {
    @Field(() => String)
        id: string

    @Field(() => String)
        displayId: string

    @Field(() => String)
        title: string

    @Field(
        () => [String],
        {
            description: "Highlight/snippet strings (may contain <em> tags from Elasticsearch).",
        },
    )
        texts: Array<string>

    @Field(
        () => AutocompleteGlobalSearchParentPath,
        {
            nullable: true,
            description: "Resolved ancestor chain used to build a navigation URL (null if uncached).",
        },
    )
        parentPath?: AutocompleteGlobalSearchParentPath

    @Field(
        () => String,
        {
            nullable: true,
            description: "Canonical, locale-agnostic route built server-side from the parent index. Client prepends /{locale} and pushes it. Null when the route can't be built (cache miss / unroutable kind).",
        },
    )
        path?: string | null

    @Field(
        () => Boolean,
        {
            nullable: true,
            description: "COURSE hits only: true when the authed user has a real enrollment in this course. Always false for guests; null for other kinds.",
        },
    )
        isEnrolled?: boolean

    @Field(
        () => Boolean,
        {
            nullable: true,
            description: "COURSE hits only: true when the course is free (no paid price / no priced pricing phase). No live pricing. Null for other kinds.",
        },
    )
        isFree?: boolean

    @Field(
        () => Boolean,
        {
            nullable: true,
            description: "CONTENT (lesson) hits only: mirrors ContentEntity.isPremium. Null for other kinds.",
        },
    )
        isPremium?: boolean
}

@ObjectType({
    description: "Grouped global search autocomplete results.",
})
/**
 * Hits grouped by catalog kind so the UI can render typed sections without
 * re-bucketing a flat list. Empty arrays mean "searched, nothing matched",
 * not "kind skipped".
 */
export class AutocompleteGlobalSearchData {
    @Field(() => [AutocompleteGlobalSearchItem])
        courses: Array<AutocompleteGlobalSearchItem>

    @Field(() => [AutocompleteGlobalSearchItem])
        modules: Array<AutocompleteGlobalSearchItem>

    @Field(() => [AutocompleteGlobalSearchItem])
        challenges: Array<AutocompleteGlobalSearchItem>

    @Field(() => [AutocompleteGlobalSearchItem])
        contents: Array<AutocompleteGlobalSearchItem>

    @Field(() => [AutocompleteGlobalSearchItem])
        flashcardDecks: Array<AutocompleteGlobalSearchItem>

    @Field(() => [AutocompleteGlobalSearchItem])
        milestones: Array<AutocompleteGlobalSearchItem>

    @Field(() => [AutocompleteGlobalSearchItem])
        milestoneTasks: Array<AutocompleteGlobalSearchItem>

    @Field(() => [AutocompleteGlobalSearchItem])
        foundations: Array<AutocompleteGlobalSearchItem>
}

@ObjectType({
    description: "Response wrapper for the global search autocomplete query.",
})
/**
 * GraphQL envelope for `autocompleteGlobalSearch`. `data` is null only on
 * the error path; an empty search still returns empty buckets inside `data`.
 */
export class AutocompleteGlobalSearchResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<AutocompleteGlobalSearchData>
{
    @Field(
        () => AutocompleteGlobalSearchData,
        {
            nullable: true,
        },
    )
        data: AutocompleteGlobalSearchData
}

