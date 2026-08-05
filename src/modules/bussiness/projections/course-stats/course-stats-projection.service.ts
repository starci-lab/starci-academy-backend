import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CourseStatsProjectionEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    CourseStatsResult,
    RecomputeCourseStatsParams,
} from "./types"

@Injectable()
/**
 * CQRS projection service for per-course counters (currently enrollment count).
 * The COUNT runs ONLY in {@link recompute}, writing the aggregate as a jsonb
 * `value` keyed by `course_id`; {@link getStats} reads the flat row with a TTL
 * lazy-refresh and parses the jsonb into a typed view — replaces the old Redis
 * enrollment-count cache.
 */
export class CourseStatsProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the stats row for ONE course (idempotent UPSERT).
     *
     * @param params - {@link RecomputeCourseStatsParams}
     */
    async recompute(
        {
            courseId,
            entityManager,
        }: RecomputeCourseStatsParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager
        // single scoped UPSERT building the aggregate jsonb from enrollments
        await manager.query(
            this.buildUpsertSql(),
            [
                courseId,
            ],
        )
    }

    /**
     * Read a course's stats from the projection (TTL lazy-refresh).
     *
     * @param courseId - the course to read.
     * @returns typed counters parsed from the jsonb `value`.
     */
    async getStats(courseId: string): Promise<CourseStatsResult> {
        // first read of the flat projection row (PK is course_id)
        let row = await this.entityManager.findOne(
            CourseStatsProjectionEntity,
            {
                where: {
                    courseId,
                },
            },
        )
        // TTL safety net: missing / past freshness window → recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                courseId,
            })
            row = await this.entityManager.findOne(
                CourseStatsProjectionEntity,
                {
                    where: {
                        courseId,
                    },
                },
            )
        }
        // parse the jsonb value into the typed result (zero for an absent row)
        const value = row?.value ?? {
        }
        return {
            enrollmentCount: Number(value.enrollmentCount) || 0,
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
     * Build the scoped course-stats UPSERT — the aggregate assembled into one
     * jsonb `value` for the single course `$1`.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO course_stats_projections (course_id, value)
            SELECT $1::uuid, jsonb_build_object(
                -- enrollments in the course
                'enrollmentCount', COALESCE((
                    SELECT COUNT(*) FROM enrollments WHERE course_id = $1
                ), 0)
            )
            ON CONFLICT (course_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
