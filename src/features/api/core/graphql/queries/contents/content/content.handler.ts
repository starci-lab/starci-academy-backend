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

@QueryHandler(ContentQuery)
@Injectable()
export class ContentHandler
    extends ICQRSHandler<ContentQuery, ContentEntity>
    implements IQueryHandler<ContentQuery, ContentEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {
        super()
    }

    protected override async process(
        query: ContentQuery
    ): Promise<ContentEntity> {
        const {
            request,
            locale,
        } = query.params
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
