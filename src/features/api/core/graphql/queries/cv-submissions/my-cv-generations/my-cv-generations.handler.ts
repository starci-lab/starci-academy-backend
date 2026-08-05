import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserCvGenerationEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
import {
    clampPagination,
} from "@modules/common"
import {
    MyCvGenerationsQuery,
} from "./my-cv-generations.query"
import {
    CvGenerationListItem,
} from "./graphql-types"

@QueryHandler(MyCvGenerationsQuery)
@Injectable()
/**
 * Paginated history of the caller's CV generation runs (newest first). Omits
 * heavy fields (`structuredData`, LaTeX/upload keys, feedback) — open a row
 * via `cvGeneration(id)` for those. Unauthenticated callers get `[]`.
 */
export class MyCvGenerationsHandler
    extends ICQRSHandler<MyCvGenerationsQuery, Array<CvGenerationListItem>>
    implements IQueryHandler<MyCvGenerationsQuery, Array<CvGenerationListItem>> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: MyCvGenerationsQuery,
    ): Promise<Array<CvGenerationListItem>> {
        const {
            user,
            request: {
                limit,
                offset,
            },
        } = query.params

        if (!user) {
            return []
        }

        // clamp pagination server-side.
        const {
            limit: take,
            offset: skip,
        } = clampPagination(limit,
            offset)

        // fetched rows are mapped below into the lightweight `CvGenerationListItem`
        // shape — `structuredData`/`latexCdnKey`/`uploadedCdnKey`/`feedback` are
        // never exposed here; the FE resolves those (server-side, via
        // `cvGeneration(id)`) only for the row it actually opens. (No partial
        // `select` here — `courseId` is a `@RelationId` column and a restricted
        // `select` can suppress TypeORM's automatic relation-id population.)
        // `course` IS loaded (a cheap join) so the history dial can label each
        // CV by its track without a per-row detail fetch.
        const generations = await this.entityManager.find(
            UserCvGenerationEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
                relations: {
                    course: true,
                },
                order: {
                    createdAt: "DESC",
                },
                take,
                skip,
            },
        )

        return generations.map(
            (generation): CvGenerationListItem => ({
                id: generation.id,
                mode: generation.mode,
                status: generation.status,
                source: generation.source,
                courseId: generation.courseId,
                courseTitle: generation.course?.title ?? null,
                label: generation.label,
                targetRole: generation.targetRole,
                language: generation.language,
                score: generation.score,
                errorMessage: generation.errorMessage,
                processedAt: generation.processedAt,
                createdAt: generation.createdAt,
            }),
        )
    }
}
