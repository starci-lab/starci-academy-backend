import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    ProjectPinType,
    UserPinnedProjectsProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    RecomputeUserPinnedProjectsParams,
    UserPinnedProjectResult,
    UserPinnedProjectValue,
} from "./types"

@Injectable()
/**
 * CQRS projection service for a user's pinned projects (the public-profile
 * "pinned projects" list). The join over `user_pinned_projects` LEFT JOINed with
 * the linked enrollment + course runs ONLY in {@link recompute} (the projector --
 * called by the CDC listener and by any inline write path), folding an ordered
 * `{ pins: [...] }` array into the jsonb `value` keyed by user. {@link getByUser}
 * reads the flat row with a TTL lazy-refresh and parses the jsonb into a typed,
 * ordered view that mirrors the old direct-join read exactly.
 */
export class UserPinnedProjectsProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the pinned-projects aggregate for one user (idempotent
     * UPSERT).
     *
     * @param params - {@link RecomputeUserPinnedProjectsParams}
     */
    async recompute(
        {
            userId,
            entityManager,
        }: RecomputeUserPinnedProjectsParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager
        // single scoped UPSERT assembling the ordered pins jsonb for this one user
        await manager.query(
            this.buildUpsertSql(),
            [
                userId,
            ],
        )
    }

    /**
     * Read a user's pinned projects (ordered by `orderIndex` ascending), TTL
     * lazy-refreshed. Missing / stale -> recompute on the spot, then re-read.
     *
     * @param userId - the user whose pinned projects to read.
     * @returns the ordered pinned-project view.
     */
    async getByUser(userId: string): Promise<Array<UserPinnedProjectResult>> {
        // first read of the flat projection row (PK is user_id)
        let row = await this.entityManager.findOne(
            UserPinnedProjectsProjectionEntity,
            {
                where: {
                    userId,
                },
            },
        )
        // TTL safety net: missing / past freshness window -> recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                userId,
            })
            row = await this.entityManager.findOne(
                UserPinnedProjectsProjectionEntity,
                {
                    where: {
                        userId,
                    },
                },
            )
        }
        // parse the jsonb value into the typed view (empty list for an absent row)
        const pins = (row?.value?.pins as Array<UserPinnedProjectValue> | undefined) ?? []
        // jsonb already holds the rows ordered by orderIndex ascending; normalize
        // each field's runtime type defensively (jsonb gives back loose shapes)
        return pins.map((pin) => ({
            id: pin.id,
            type: pin.type,
            title: pin.title ?? null,
            description: pin.description ?? null,
            url: pin.url ?? null,
            techStack: pin.techStack ?? null,
            isVerified: Boolean(pin.isVerified),
            orderIndex: Number(pin.orderIndex) || 0,
        }))
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
     * Build the pinned-projects UPSERT for the single user `$1`, folding the
     * ordered pin list into the jsonb `value.pins`. Each pin resolves:
     *   - `title`: custom title, else (course pins only) the linked course title.
     *   - `isVerified`: true only for a `course` pin whose linked enrollment has a
     *     completed task plan (`tasks_completed_at` stamped); external pins never.
     * The aggregate is ordered by `order_index` ascending so the read needs no
     * re-sort. A user with no pins still upserts an empty `'[]'::jsonb` array.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO user_pinned_projects_projections (user_id, value)
            SELECT $1::uuid, jsonb_build_object(
                'pins', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id',          p.id,
                            'type',        p.type,
                            -- custom title, else course title for course pins, else null
                            'title',       COALESCE(
                                                p.title,
                                                CASE WHEN p.type = '${ProjectPinType.Course}'
                                                     THEN c.title ELSE NULL END
                                           ),
                            'description', p.description,
                            'url',         p.url,
                            'techStack',   p.tech_stack,
                            -- verified only when a course pin's enrollment finished its tasks
                            'isVerified',  (
                                                p.type = '${ProjectPinType.Course}'
                                                AND e.tasks_completed_at IS NOT NULL
                                           ),
                            'orderIndex',  p.order_index
                        ) ORDER BY p.order_index ASC, p.id ASC
                    )
                    FROM user_pinned_projects p
                    LEFT JOIN enrollments e ON e.id = p.enrollment_id
                    LEFT JOIN courses c ON c.id = e.course_id
                    WHERE p.user_id = $1
                ), '[]'::jsonb)
            )
            ON CONFLICT (user_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
