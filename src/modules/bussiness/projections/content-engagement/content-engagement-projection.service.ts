import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    ContentEngagementProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/content-engagement-projection.entity"
import {
    ReactionType,
} from "@modules/databases/postgresql/primary/enums/reaction-type"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
import type {
    ContentEngagementSummary,
    RecomputeContentEngagementParams,
} from "./types"

@Injectable()
/**
 * CQRS projection service for per-content engagement (reactions by emotion +
 * total, distinct-reader view count, comment count, share count).
 *
 * The aggregation runs ONLY in {@link recompute} (the projector -- called inline
 * on react/comment/read and by the CDC listener), writing the whole aggregate
 * as a jsonb `value` keyed by `content_id`. {@link getSummary} reads that flat
 * row, lazily recomputing when older than the TTL, and parses the jsonb into a
 * typed view -- the table stands in for the old Redis view-count cache.
 */
export class ContentEngagementProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the engagement row for ONE content (idempotent UPSERT).
     *
     * @param params - {@link RecomputeContentEngagementParams}
     */
    async recompute(
        {
            contentId,
            entityManager,
        }: RecomputeContentEngagementParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager
        // single scoped UPSERT building the aggregate jsonb from the source tables
        await manager.query(
            this.buildUpsertSql(),
            [
                contentId,
            ],
        )
    }

    /**
     * Read a content's engagement summary from the projection. Missing or stale
     * (older than the TTL) -> recompute on the spot, then re-read (lazy self-heal).
     *
     * @param contentId - the content to summarise.
     * @returns typed engagement counters parsed from the jsonb `value`.
     */
    async getSummary(contentId: string): Promise<ContentEngagementSummary> {
        // first read of the flat projection row (PK is content_id)
        let row = await this.entityManager.findOne(
            ContentEngagementProjectionEntity,
            {
                where: {
                    contentId,
                },
            },
        )
        // TTL safety net: missing / past freshness window -> recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                contentId,
            })
            row = await this.entityManager.findOne(
                ContentEngagementProjectionEntity,
                {
                    where: {
                        contentId,
                    },
                },
            )
        }
        // parse the jsonb value into the typed summary (zeros for an absent row)
        const value = row?.value ?? {
        }
        return {
            totalReactions: Number(value.totalReactions) || 0,
            reactionsByType: (value.reactionsByType ?? {
            }) as Record<ReactionType, number>,
            viewCount: Number(value.viewCount) || 0,
            shareCount: Number(value.shareCount) || 0,
            commentCount: Number(value.commentCount) || 0,
        }
    }

    /**
     * Whether a projection row is past its freshness window.
     *
     * @param updatedAt - the row's last write time.
     * @returns true when older than the configured TTL.
     */
    private isStale(updatedAt: Date): boolean {
        // compare age against the env-tunable projection TTL
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }

    /**
     * Build the scoped engagement UPSERT -- the whole aggregate assembled into one
     * jsonb `value` for the single content `$1`, written as INSERT ... ON CONFLICT.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO content_engagement_projections (content_id, value)
            SELECT $1::uuid, jsonb_build_object(
                -- total reactions across every emotion
                'totalReactions', COALESCE((
                    SELECT COUNT(*) FROM content_reactions WHERE content_id = $1
                ), 0),
                -- per-emotion buckets { emotion: count }; '{}' when none
                'reactionsByType', COALESCE((
                    SELECT jsonb_object_agg(t.type, t.cnt)
                    FROM (
                        SELECT type, COUNT(*)::int AS cnt
                        FROM content_reactions WHERE content_id = $1 GROUP BY type
                    ) t
                ), '{}'::jsonb),
                -- distinct readers = users who marked the content read
                'viewCount', COALESCE((
                    SELECT COUNT(*) FROM user_contents
                    WHERE content_id = $1 AND is_read = true
                ), 0),
                -- shares not implemented yet
                'shareCount', 0,
                -- all comments (top-level + replies) on the content
                'commentCount', COALESCE((
                    SELECT COUNT(*) FROM content_comments WHERE content_id = $1
                ), 0)
            )
            ON CONFLICT (content_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
