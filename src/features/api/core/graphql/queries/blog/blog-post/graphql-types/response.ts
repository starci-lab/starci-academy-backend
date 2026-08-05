import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    BlogCategory,
    GraphQLTypeBlogCategory,
} from "@modules/databases/postgresql/primary/enums/blog-category"

@ObjectType({
    description: "A full blog article (locale-resolved; body gated when premium).",
})
/**
 * One render-ready blog article for `/blog/[slug]`. All bilingual fields are
 * resolved to the request locale. When the post is members-only and the viewer
 * is not an active member, `body` is truncated and `isLocked` is true so the FE
 * can render the membership paywall.
 */
export class BlogPostDetailData {
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
        () => String,
        {
            description: "Full body (markdown), locale-resolved; truncated when locked.",
        },
    )
        body: string

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
        () => String,
        {
            nullable: true,
            description: "Funnel CTA destination (e.g. related course URL), or null.",
        },
    )
        ctaUrl: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "CTA button label resolved to the request locale, or null.",
        },
    )
        ctaLabel: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "'View on GitHub' source link for codebase posts, or null.",
        },
    )
        sourceUrl: string | null

    @Field(
        () => Boolean,
        {
            description: "Whether the full body is members-only.",
        },
    )
        isPremium: boolean

    @Field(
        () => Boolean,
        {
            description: "True when the body was truncated for a non-member viewer.",
        },
    )
        isLocked: boolean

    @Field(
        () => Date,
        {
            description: "When the post was published.",
        },
    )
        publishedAt: Date
}

@ObjectType({
    description: "Response wrapper for the blogPost query.",
})
/**
 * Response wrapper for the blogPost query (data null when slug not found).
 */
export class BlogPostResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<BlogPostDetailData | null> {
    @Field(
        () => BlogPostDetailData,
        {
            nullable: true,
            description: "The article, or null when no published post matches the slug.",
        },
    )
        data: BlogPostDetailData | null
}
