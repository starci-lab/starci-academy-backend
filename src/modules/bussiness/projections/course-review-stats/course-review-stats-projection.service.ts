import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CourseReviewStatsProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/course-review-stats-projection.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
import type {
    CourseReviewStatsResult,
    RecomputeCourseReviewStatsParams,
} from "./types"

@Injectable()
/**
 * CQRS projection service for a course's review aggregate.
 *
 * The aggregation runs ONLY in {@link recompute}, which rebuilds the whole aggregate from the
 * `course_reviews` rows and writes it as a jsonb `value` keyed by `course_id`. {@link getStats}
 * reads the flat row with a TTL lazy-refresh.
 *
 * Rebuilt, never incremented. A duplicate CDC delivery of one review would otherwise raise the
 * average of a course nobody rated twice, and a missed delivery could never heal -- CDC-4 is the
 * rule, and an average is the shape of value where being slightly wrong is invisible forever.
 */
export class CourseReviewStatsProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the review aggregate for ONE course (idempotent UPSERT).
     *
     * @param params - {@link RecomputeCourseReviewStatsParams}
     */
    async recompute(
        {
            courseId,
            entityManager,
        }: RecomputeCourseReviewStatsParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager
        await manager.query(
            this.buildUpsertSql(),
            [
                courseId,
            ],
        )
    }

    /**
     * Read a course's review aggregate from the projection (TTL lazy-refresh).
     *
     * @param courseId - the course to read.
     * @returns typed counters parsed from the jsonb `value`.
     */
    async getStats(courseId: string): Promise<CourseReviewStatsResult> {
        let row = await this.entityManager.findOne(
            CourseReviewStatsProjectionEntity,
            {
                where: {
                    courseId,
                },
            },
        )
        // TTL safety net: missing / past freshness window -> recompute + re-read. This is also
        // what saves a seeded database: writing `course_reviews` directly leaves the projection
        // untouched until either the listener runs or a read falls through to here
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                courseId,
            })
            row = await this.entityManager.findOne(
                CourseReviewStatsProjectionEntity,
                {
                    where: {
                        courseId,
                    },
                },
            )
        }
        const value = row?.value ?? {
        }
        return {
            averageScore: Number(value.averageScore) || 0,
            reviewCount: Number(value.reviewCount) || 0,
            scoreHistogram: (value.scoreHistogram as Record<string, number>) ?? {
            },
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
     * Build the scoped review-aggregate UPSERT for the single course `$1`.
     *
     * The histogram is built from a GROUP BY rather than from five scalar sub-selects because a
     * star nobody chose must be ABSENT rather than zero-filled by an author who happened to
     * remember all five -- and a bucket list assembled by hand is exactly where the five-star row
     * gets forgotten.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO course_review_stats_projections (course_id, value)
            SELECT $1::uuid, jsonb_build_object(
                -- how many reviews the course carries
                'reviewCount', COALESCE((
                    SELECT COUNT(*) FROM course_reviews WHERE course_id = $1
                ), 0),
                -- mean score to two decimals; zero when there is nothing to average
                'averageScore', COALESCE((
                    SELECT ROUND(AVG(score)::numeric, 2) FROM course_reviews WHERE course_id = $1
                ), 0),
                -- one bucket per star that somebody actually chose
                'scoreHistogram', COALESCE((
                    SELECT jsonb_object_agg(bucket.score::text, bucket.tally)
                    FROM (
                        SELECT score, COUNT(*) AS tally
                        FROM course_reviews
                        WHERE course_id = $1
                        GROUP BY score
                    ) AS bucket
                ), '{}'::jsonb)
            )
            ON CONFLICT (course_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
