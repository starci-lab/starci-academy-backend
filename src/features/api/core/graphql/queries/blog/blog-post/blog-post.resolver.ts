import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    EntityManager,
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
    KeycloakGraphQLUser,
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    MembershipService,
} from "@modules/membership"
import {
    BlogPostEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    BlogPostDetailData,
    BlogPostResponse,
} from "./graphql-types"

/** Characters of body shown to non-members on a premium post before the paywall. */
const PREVIEW_CHARS = 600

@Resolver()
/**
 * Public query returning a single published blog article by slug for the
 * `/blog/[slug]` page. Auth is optional. All bilingual fields resolve to the
 * request locale. Premium posts are gated here (single policy point): a viewer
 * who is not an active member receives a truncated `body` plus `isLocked = true`
 * so the FE renders the membership paywall; deep-dive posts are not premium so
 * they always read in full (SEO).
 */
export class BlogPostResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly membershipService: MembershipService,
        private readonly winstonService: WinstonService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Blog post fetched successfully",
        [Locale.Vi]: "Lấy bài viết thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => BlogPostResponse,
        {
            name: "blogPost",
            description: "Returns a published blog article by slug (premium body gated), or null.",
        },
    )
    async execute(
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity | undefined,
        @Args("slug",
            {
                type: () => String,
                description: "The `/blog/[slug]` route key.",
            })
            slug: string,
    ): Promise<BlogPostDetailData | null> {
        // resolve a single published post by its stable slug
        const post = await this.entityManager.findOne(
            BlogPostEntity,
            {
                where: {
                    slug,
                    isPublished: true,
                },
            },
        )
        // unknown / unpublished slug -> null so the FE can render a 404
        if (!post) {
            return null
        }
        // resolve the inline bilingual text to the request locale
        const lang = locale === Locale.Vi ? "vi" : "en"
        // decide whether the premium body must be locked for this viewer; only
        // premium posts can lock, so public deep-dive posts skip the check
        const isLocked = post.isPremium
            ? !(await this.isActiveMember(user))
            : false
        // truncate the body when locked so premium content never ships in full
        const fullBody = post.body[lang]
        const body = isLocked
            ? fullBody.slice(0,
                PREVIEW_CHARS)
            : fullBody
        return {
            id: post.id,
            slug: post.slug,
            title: post.title[lang],
            excerpt: post.excerpt ? post.excerpt[lang] : null,
            body,
            category: post.category,
            coverImageUrl: post.coverImageUrl,
            readingMinutes: post.readingMinutes,
            ctaUrl: post.ctaUrl,
            ctaLabel: post.ctaLabel ? post.ctaLabel[lang] : null,
            sourceUrl: post.sourceUrl,
            isPremium: post.isPremium,
            isLocked,
            publishedAt: post.publishedAt,
        }
    }

    /**
     * Whether the viewer is an active community member. Fails closed -- an
     * anonymous viewer, or a membership lookup error, counts as not active so a
     * premium body is never leaked when the gate cannot be evaluated.
     *
     * @param user - the optionally-authenticated viewer, or undefined.
     * @returns true only when the viewer is a confirmed active member.
     */
    private async isActiveMember(user: UserEntity | undefined): Promise<boolean> {
        // anonymous viewers are never members
        if (!user) {
            return false
        }
        try {
            // single source of truth for membership status
            return await this.membershipService.isActive(user.id)
        } catch (error) {
            // fail closed: on lookup failure treat as not a member (do not leak)
            this.winstonService.log(
                WinstonLog.BestEffortOperationFailed,
                {
                    op: "blog-post.membership-check",
                    userId: user.id,
                    error: error instanceof Error ? error.message : String(error),
                },
            )
            return false
        }
    }
}
