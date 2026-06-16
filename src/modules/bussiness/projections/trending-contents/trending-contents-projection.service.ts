import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    TrendingContentsProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    ContentIdRow,
    GetTrendingParams,
    RecomputeTrendingParams,
    TrendingItemResult,
    TrendingItemValue,
} from "./types"

/** The single partition key — there is exactly one global trending row. */
const GLOBAL_KEY = "global"
/** How many candidates to materialise (over-fetch so per-viewer exclusion still fills `limit`). */
const CANDIDATE_LIMIT = 50

/**
 * CQRS projection service for the platform-wide "trending lessons this week"
 * board. The heavy rolling-7-day GROUP BY over `user_contents` runs ONLY in
 * {@link recompute}, which folds the top-{@link CANDIDATE_LIMIT} lessons into the
 * single global row's jsonb `value.items`. {@link getTrending} reads that row
 * (TTL lazy-refresh) and only does a light per-viewer membership check to drop
 * lessons the viewer already read — no aggregation per request.
 */
@Injectable()
export class TrendingContentsProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the global trending row (idempotent UPSERT).
     *
     * @param params - {@link RecomputeTrendingParams}
     */
    async recompute(
        {
            entityManager,
        }: RecomputeTrendingParams = {
        },
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager
        await manager.query(
            this.buildUpsertSql(),
            [
                GLOBAL_KEY,
                CANDIDATE_LIMIT,
            ],
        )
    }

    /**
     * Read the trending board for one viewer: the materialised top candidates,
     * minus lessons the viewer already read, sliced to `limit`. TTL lazy-refreshed.
     *
     * @param params - {@link GetTrendingParams}
     * @returns the trending lessons (most-read first), viewer's own reads excluded.
     */
    async getTrending(
        {
            limit,
            viewerId,
        }: GetTrendingParams,
    ): Promise<Array<TrendingItemResult>> {
        const value = await this.readValue()
        const items = (value.items as Array<TrendingItemValue> | undefined) ?? []
        if (items.length === 0) {
            return []
        }
        // light per-viewer membership check over the bounded candidate set — which
        // of these the viewer already read (so "trending" reflects the crowd)
        const candidateIds = items.map((item) => item.id)
        const readRows = await this.entityManager.query<Array<ContentIdRow>>(
            `
            SELECT uc.content_id
            FROM user_contents uc
            WHERE uc.user_id = $1
              AND uc.is_read = true
              AND uc.content_id = ANY($2::uuid[])
            `,
            [
                viewerId,
                candidateIds,
            ],
        )
        const readByViewer = new Set(readRows.map((row) => row.content_id))
        return items
            .filter((item) => !readByViewer.has(item.id))
            .slice(0,
                limit)
            .map((item) => ({
                id: item.id,
                title: item.title,
                readCount: Number(item.readCount) || 0,
            }))
    }

    /**
     * Read the global row's jsonb value, recomputing first when missing or stale
     * (TTL lazy-refresh).
     *
     * @returns the jsonb value (empty object when still absent).
     */
    private async readValue(): Promise<Record<string, unknown>> {
        let row = await this.entityManager.findOne(
            TrendingContentsProjectionEntity,
            {
                where: {
                    key: GLOBAL_KEY,
                },
            },
        )
        // missing / past freshness window → recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute()
            row = await this.entityManager.findOne(
                TrendingContentsProjectionEntity,
                {
                    where: {
                        key: GLOBAL_KEY,
                    },
                },
            )
        }
        return row?.value ?? {
        }
    }

    /**
     * Whether a projection row is past its freshness window.
     *
     * @param updatedAt - the row's last write time.
     * @returns true when older than the configured TTL.
     */
    private isStale(updatedAt: Date): boolean {
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }

    /**
     * Build the trending UPSERT — top-`$2` most-read lessons in the rolling 7-day
     * window, folded into `value.items` for the single global key `$1`.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO trending_contents_projections (key, value)
            SELECT $1::varchar, jsonb_build_object('items', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id',        t.id,
                        'title',     t.title,
                        'readCount', t.read_count
                    ) ORDER BY t.read_count DESC, t.title ASC
                )
                FROM (
                    SELECT c.id          AS id,
                           c.title       AS title,
                           COUNT(*)::int AS read_count
                    FROM user_contents uc
                    JOIN contents c ON c.id = uc.content_id
                    WHERE uc.is_read = true
                      AND uc.updated_at >= now() - interval '7 days'
                    GROUP BY c.id, c.title
                    ORDER BY read_count DESC, c.title ASC
                    LIMIT $2
                ) t
            ), '[]'::jsonb))
            ON CONFLICT (key) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
