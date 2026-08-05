import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    ContentContextNotFound,
    ContentNotFoundException,
    ContentScrapeRateLimitException,
} from "@modules/exceptions"
import {
    S3NameResolverService,
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ContentQuery,
} from "./content.query"
import {
    EntityManager
} from "typeorm"
import {
    UserService,
} from "@modules/bussiness"
import {
    InjectIoRedis,
    IoRedisInstanceKey,
} from "@modules/native"
import type {
    Redis,
} from "ioredis"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"

/**
 * Rolling window (seconds) over which a single user's lesson-content reads are
 * counted for the anti-scraping guard.
 */
const CONTENT_ACCESS_WINDOW_SECONDS = 3600
/**
 * Max lesson-content reads one user may make inside the window before being
 * blocked as a suspected scraper. Set generously above any human reading pace
 * (the per-IP throttler already caps per-minute bursts) so it only trips on bulk
 * automated harvesting.
 */
const CONTENT_ACCESS_LIMIT = 200

@QueryHandler(ContentQuery)
@Injectable()
/**
 * Loads one lesson from S3, then applies anti-scrape rate limits, live DB
 * premium flag, and enrollment gating so trial viewers get a truncated teaser
 * instead of the full body / code assets.
 */
export class ContentHandler
    extends ICQRSHandler<ContentQuery, ContentEntity>
    implements IQueryHandler<ContentQuery, ContentEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
        @InjectIoRedis(IoRedisInstanceKey.Cache)
        private readonly redis: Redis,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(
        query: ContentQuery
    ): Promise<ContentEntity> {
        const {
            request,
            locale,
            user,
        } = query.params
        // Anti-scraping: cap how many lesson contents ONE user may read per window,
        // so a bought/trial account can't bulk-harvest the whole course. Runs before
        // any DB/S3 work so a flagged scraper is cheap to reject.
        await this.enforceContentAccessRate(
            user?.id,
            user?.email,
        )
        if (!request.id && !request.displayId) {
            throw new ContentContextNotFound(
                {
                    displayId: request.displayId,
                    id: request.id,
                }
            )
        }

        let id = request.id
        if (!id) {
            const content = await this.entityManager.findOne(
                ContentEntity,
                {
                    where: {
                        displayId: request.displayId,
                    },
                    select: {
                        id: true,
                    },
                })
            if (!content) {
                throw new ContentNotFoundException({
                    id: request.id,
                })
            }
            id = content.id
        }
        const objectKey = this.s3NameResolverService.content(
            id,
            locale
        )
        const content = await this.s3ReadService.json<ContentEntity>({
            key: objectKey,
            provider: S3Provider.Minio,
        })

        if (!content) {
            throw new ContentNotFoundException({
                id: request.id,
            })
        }

        // TECH DEBT (.techdebt#content-outcomes-stub): the `content_learning_outcomes`
        // table isn't seeded yet (authored `# outcomes` live only in `.contexts`, never
        // ported to the data-repo), so snapshots carry no outcomes. Stub a few bullets so
        // the FE "Bạn sẽ nắm được" callout renders. Remove once outcomes are seeded.
        this.stubOutcomesIfEmpty(content,
            locale)

        // Source the premium flag and owning course from the live DB row, not the
        // (possibly stale) S3 snapshot, so toggling `is_premium` takes effect at once.
        const row = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id,
                },
                relations: {
                    module: {
                        course: true,
                    },
                },
                select: {
                    id: true,
                    isPremium: true,
                    module: {
                        id: true,
                        course: {
                            id: true,
                        },
                    },
                },
            },
        )
        const isPremium = row?.isPremium ?? content.isPremium
        const courseId = row?.module?.course?.id

        // Gate premium content for "đọc thử" (trial read): a logged-in but
        // non-enrolled viewer receives a truncated body so the FE can blur it
        // and surface the purchase modal. Free content and enrolled viewers get
        // the full body. `isPremium` on the response means "locked for you".
        const entitled = await this.isEntitled(
            isPremium,
            courseId,
            query.params.user?.id,
        )
        if (isPremium && !entitled) {
            this.lockPremiumContent(content)
            content.isPremium = true
        } else {
            content.isPremium = false
        }

        return content
    }

    /**
     * Per-user anti-scraping guard: atomically count this user's content reads in a
     * fixed rolling window (Redis INCR + first-hit EXPIRE) and reject once the count
     * exceeds {@link CONTENT_ACCESS_LIMIT}. Complements the per-IP throttler (which
     * only caps short bursts) by catching sustained bulk harvesting across IP/session
     * rotation. On first breach we log the offender (with email) to Loki so the
     * account can be reviewed / disabled and used as takedown evidence.
     * @param userId Active user id (skips the guard for unauthenticated callers).
     * @param email Active user email — recorded as evidence when the limit trips.
     */
    private async enforceContentAccessRate(
        userId?: string,
        email?: string | null,
    ): Promise<void> {
        if (!userId) {
            return
        }
        const key = `content:access-rate:${userId}`
        const count = await this.redis.incr(key)
        // Set the window TTL only on the first hit so the window is FIXED (resets
        // every `CONTENT_ACCESS_WINDOW_SECONDS`), not sliding — a steady human reader
        // never accrues past the window. Guard against a stuck key with no TTL.
        if (count === 1) {
            await this.redis.expire(key,
                CONTENT_ACCESS_WINDOW_SECONDS)
        } else if (await this.redis.ttl(key) < 0) {
            await this.redis.expire(key,
                CONTENT_ACCESS_WINDOW_SECONDS)
        }
        if (count > CONTENT_ACCESS_LIMIT) {
            // log ONCE, right when the limit is first crossed, to avoid log spam
            // while the scraper keeps hammering inside the same window.
            if (count === CONTENT_ACCESS_LIMIT + 1) {
                this.winstonService.log(
                    WinstonLog.ContentScrapeDetected,
                    {
                        userId,
                        email: email ?? undefined,
                        count,
                        limit: CONTENT_ACCESS_LIMIT,
                        windowSeconds: CONTENT_ACCESS_WINDOW_SECONDS,
                    },
                )
            }
            throw new ContentScrapeRateLimitException({
                userId,
                count,
                limit: CONTENT_ACCESS_LIMIT,
            })
        }
    }

    /**
     * TEMPORARY: when the snapshot carries no learning outcomes (table not seeded
     * yet — see `.techdebt#content-outcomes-stub`), fill a few placeholder bullets
     * in place so the FE "what you'll learn" callout has something to render. The
     * shape matches the `outcomes` GraphQL field (id / text / sortIndex). Delete this
     * method and its call site once real outcomes are seeded.
     * @param content Parsed content to mutate.
     * @param locale Active locale, to pick placeholder language.
     */
    private stubOutcomesIfEmpty(
        content: ContentEntity,
        locale?: string,
    ): void {
        if (content.outcomes?.length) {
            return
        }
        const bullets = locale === "en"
            ? [
                "Grasp the core ideas this lesson is built around.",
                "Apply the concepts to a small hands-on example.",
                "Recognise the common edge cases and pitfalls.",
            ]
            : [
                "Nắm các ý cốt lõi mà bài học này xoay quanh.",
                "Vận dụng khái niệm vào một ví dụ thực hành nhỏ.",
                "Nhận ra các tình huống biên và lỗi thường gặp.",
            ]
        content.outcomes = bullets.map((text, index) => ({
            id: `${content.id}-stub-outcome-${index}`,
            text,
            orderIndex: index,
            sortIndex: index,
        }) as unknown as ContentEntity["outcomes"][number])
    }

    /**
     * Whether the viewer may read the full body: true for free content, or for a
     * user enrolled in the course that owns this content.
     * @param isPremium Whether the content row is flagged premium.
     * @param courseId Owning course id of the content, when resolvable.
     * @param userId Active user id, when authenticated.
     */
    private async isEntitled(
        isPremium: boolean,
        courseId?: string,
        userId?: string,
    ): Promise<boolean> {
        // Free content is always fully readable.
        if (!isPremium) {
            return true
        }
        // Need both a user and the owning course to confirm entitlement.
        if (!userId || !courseId) {
            return false
        }
        return await this.userService.checkEnrollment(
            userId,
            courseId,
        )
    }

    /**
     * Truncate the premium body in place to a teaser that runs up to (but not including) the
     * "Verification / Kiểm thử" section — so the trial viewer still sees the full intro, core
     * concepts and code, then the FE fades the tail and shows the purchase modal. Premium-only
     * code assets (separate tabs) stay stripped.
     * @param content Parsed content to mutate.
     */
    private lockPremiumContent(
        content: ContentEntity,
    ): void {
        /** Keep the markdown up to the testing section (or a generous fallback slice). */
        const preview = (text: string | null): string => {
            if (!text) {
                return ""
            }
            // Cut right before the standard testing section heading (vi: "Kiểm thử", en:
            // "Verification" / "Testing") so the teaser includes the code but not the rest.
            // Drop everything from a dangling unclosed code fence so the teaser never ends inside a
            // ```mermaid/```code block (a half diagram fails to parse on the FE).
            const dropDanglingFence = (slice: string): string =>
                (slice.match(/```/g)?.length ?? 0) % 2 === 1
                    ? slice.slice(0,
                        slice.lastIndexOf("```"))
                    : slice
            const testingHeading = /^#{1,6}[ \t].*(Kiểm thử|Verification|Testing)\b.*$/im
            const match = testingHeading.exec(text)
            if (match?.index != null && match.index > 0) {
                return dropDanglingFence(text.slice(0,
                    match.index)).trimEnd()
            }
            // Fallback when no testing section exists: keep a generous leading slice (no ellipsis —
            // the FE fades the tail).
            const limit = 4000
            return text.length > limit
                ? dropDanglingFence(text.slice(0,
                    limit)).trimEnd()
                : text
        }
        // Legacy SCHEMA V1 scalar body.
        content.body = preview(content.body)
        // SCHEMA V2 per-language bodies and their per-locale variants.
        for (const body of content.bodies ?? []) {
            body.body = preview(body.body)
            for (const translation of body.translations ?? []) {
                translation.body = preview(translation.body)
            }
        }
        // Premium-only code assets stay locked.
        content.codeExplainings = []
        content.codeImplementations = []
    }
}
