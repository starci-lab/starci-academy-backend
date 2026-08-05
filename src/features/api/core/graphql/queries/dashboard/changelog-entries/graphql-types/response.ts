import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    ChangelogCategory,
    GraphQLTypeChangelogCategory,
} from "@modules/databases"

@ObjectType({
    description: "A system changelog entry (locale-resolved).",
})
/**
 * One render-ready changelog entry for the dashboard right rail. `title`/`body`
 * are already resolved to the request locale.
 */
export class ChangelogEntryItemData {
    @Field(
        () => String,
        {
            description: "Changelog entry id.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Headline resolved to the request locale.",
        },
    )
        title: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Short body (markdown) resolved to the request locale, or null.",
        },
    )
        body: string | null

    @Field(
        () => GraphQLTypeChangelogCategory,
        {
            nullable: true,
            description: "Category chip (feature / fix / announcement), or null.",
        },
    )
        category: ChangelogCategory | null

    @Field(
        () => Date,
        {
            description: "When the entry was published.",
        },
    )
        publishedAt: Date

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional 'read more' destination.",
        },
    )
        linkUrl: string | null
}

@ObjectType({
    description: "Response wrapper for the changelogEntries query.",
})
/**
 * Response wrapper for the changelogEntries query.
 */
export class ChangelogEntriesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<ChangelogEntryItemData>> {
    @Field(
        () => [ChangelogEntryItemData],
        {
            description: "Published changelog entries, newest first.",
        },
    )
        data: Array<ChangelogEntryItemData>
}
