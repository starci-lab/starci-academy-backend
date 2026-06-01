import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ContentEntity,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    ContentContextNotFound,
    ContentNotFoundException,
} from "@modules/exceptions"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    S3NameResolverService,
    S3Provider,
    S3ReadService,
    UploadPayload,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import SuperJSON from "superjson"
import {
    ContentQuery,
} from "./content.query"
import {
    EntityManager 
} from "typeorm"

@QueryHandler(ContentQuery)
@Injectable()
export class ContentHandler
    extends ICQRSHandler<ContentQuery, ContentEntity>
    implements IQueryHandler<ContentQuery, ContentEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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
        const cdnPayload = await this.s3ReadService.json<UploadPayload>({
            key: objectKey,
            provider: S3Provider.Minio,
        })

        if (!cdnPayload) {
            throw new ContentNotFoundException({
                id: request.id,
            })
        }

        const content = this.superJson.parse<ContentEntity>(cdnPayload.data)

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
        // Enrolled in the owning course → entitled.
        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    userId,
                    courseId,
                },
                select: {
                    id: true,
                },
            },
        )
        return Boolean(enrollment)
    }

    /**
     * Truncate the premium body in place to a short blurred preview and strip
     * premium-only code assets, so the trial viewer sees only a teaser behind
     * the purchase modal.
     * @param content Parsed content to mutate.
     */
    private lockPremiumContent(
        content: ContentEntity,
    ): void {
        /** Keep only the leading slice of a markdown body as a teaser. */
        const preview = (text: string | null): string => {
            if (!text) {
                return ""
            }
            const limit = 1200
            return text.length > limit
                ? `${text.slice(0,
                    limit)}\n\n...`
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
