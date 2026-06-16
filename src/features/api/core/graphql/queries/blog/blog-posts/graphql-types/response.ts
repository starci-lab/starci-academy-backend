import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    BlogCategory,
    GraphQLTypeBlogCategory,
} from "@modules/databases"

/**
 * One render-ready blog card for the `/blog` listing. `title`/`excerpt` are
 * already resolved to the request locale; the body is intentionally omitted
 * (fetched on the detail query).
 */
@ObjectType({
    description: "A blog post list card (locale-resolved, body omitted).",
})
export class BlogPostListItemData {
    @Field(
        () => ID,
        {
            description: "Blog post id.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "URL slug — the `/blog/[slug]` route key.",
        },
    )
        slug: string

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
            description: "Short summary resolved to the request locale, or null.",
        },
    )
        excerpt: string | null

    @Field(
        () => GraphQLTypeBlogCategory,
        {
            description: "Editorial pillar chip.",
        },
    )
        category: BlogCategory

    @Field(
        () => String,
        {
            nullable: true,
            description: "Cover image URL, or null.",
        },
    )
        coverImageUrl: string | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Estimated reading time in minutes, or null.",
        },
    )
        readingMinutes: number | null

    @Field(
        () => Boolean,
        {
            description: "Whether the full body is members-only.",
        },
    )
        isPremium: boolean

    @Field(
        () => Date,
        {
            description: "When the post was published.",
        },
    )
        publishedAt: Date
}

/**
 * Response wrapper for the blogPosts query.
 */
@ObjectType({
    description: "Response wrapper for the blogPosts query.",
})
export class BlogPostsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<BlogPostListItemData>> {
    @Field(
        () => [BlogPostListItemData],
        {
            description: "Published blog posts, newest first.",
        },
    )
        data: Array<BlogPostListItemData>
}
