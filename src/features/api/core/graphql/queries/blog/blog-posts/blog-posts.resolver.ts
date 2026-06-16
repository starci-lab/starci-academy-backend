import {
    Args,
    Int,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    EntityManager,
    type FindOptionsWhere,
} from "typeorm"
import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    BlogCategory,
    BlogPostEntity,
    GraphQLTypeBlogCategory,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    BlogPostListItemData,
    BlogPostsResponse,
} from "./graphql-types"

/** Hard cap on how many cards one listing page can request. */
const MAX_LIMIT = 50

/**
 * Public query returning published blog posts (newest first) for the `/blog`
 * listing page, optionally filtered by editorial pillar. `title`/`excerpt` are
 * resolved to the request locale; the body is omitted (detail query fetches it).
 */
@Resolver()
export class BlogPostsResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Blog posts fetched successfully",
        [Locale.Vi]: "Lấy danh sách bài viết thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => BlogPostsResponse,
        {
            name: "blogPosts",
            description: "Returns published blog posts (newest first), optionally filtered by category.",
        },
    )
    async execute(
        @GraphQLLocale()
            locale: Locale,
        @Args("category",
            {
                type: () => GraphQLTypeBlogCategory,
                nullable: true,
                description: "Filter to a single editorial pillar; omit for all.",
            })
            category: BlogCategory | undefined,
        @Args("limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 12,
                description: "Max posts to return.",
            })
            limit: number,
        @Args("offset",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 0,
                description: "How many posts to skip (pagination).",
            })
            offset: number,
    ): Promise<Array<BlogPostListItemData>> {
        // clamp the page size into [1, MAX_LIMIT] and floor the offset at 0
        const take = Math.min(Math.max(limit ?? 12,
            1),
        MAX_LIMIT)
        const skip = Math.max(offset ?? 0,
            0)
        // base filter is "published"; add the category filter only when supplied
        const where: FindOptionsWhere<BlogPostEntity> = {
            isPublished: true,
        }
        // narrow to a single editorial pillar when the caller passed one
        if (category) {
            where.category = category
        }
        // published posts, newest first
        const posts = await this.entityManager.find(
            BlogPostEntity,
            {
                where,
                order: {
                    publishedAt: "DESC",
                },
                take,
                skip,
            },
        )
        // resolve the inline bilingual text to the request locale
        const lang = locale === Locale.Vi ? "vi" : "en"
        return posts.map((post) => ({
            id: post.id,
            slug: post.slug,
            title: post.title[lang],
            excerpt: post.excerpt ? post.excerpt[lang] : null,
            category: post.category,
            coverImageUrl: post.coverImageUrl,
            readingMinutes: post.readingMinutes,
            isPremium: post.isPremium,
            publishedAt: post.publishedAt,
        }))
    }
}
