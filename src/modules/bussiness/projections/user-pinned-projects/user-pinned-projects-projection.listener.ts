import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    KafkaService,
} from "@modules/kafka"
import {
    AbstractProjectionListener,
    type ProjectionCdcMessage,
} from "@modules/projection"
import {
    UserPinnedProjectsProjectionService,
} from "./user-pinned-projects-projection.service"
import type {
    PinnedProjectCdcRow,
    PinnedProjectsCourseCdcRow,
    PinnedProjectsEnrollmentCdcRow,
    PinnedProjectUserIdRow,
} from "./types"

/**
 * CDC consumer that keeps `user_pinned_projects_projections` fresh. Tails the
 * three tables whose changes can move a user's pinned-projects aggregate:
 *   - `user_pinned_projects` — the pin rows themselves (owner via `user_id`).
 *   - `enrollments` — `tasks_completed_at` drives a course pin's `isVerified`;
 *     resolved back to the owners of pins referencing the changed enrollment.
 *   - `courses` — the title fallback for course pins; resolved back to the
 *     owners of pins whose enrollment points at the changed course.
 * Connection + per-message safety are owned by {@link AbstractProjectionListener}.
 */
@Injectable()
export class UserPinnedProjectsProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group → restarts resume from the committed offset. */
    protected readonly groupId = "user-pinned-projects-projection"

    /** Pin rows + the enrollment/course they derive title + verified state from. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}user_pinned_projects`,
        `${envConfig().kafka.cdcTopicPrefix}enrollments`,
        `${envConfig().kafka.cdcTopicPrefix}courses`,
    ]

    constructor(
        kafkaService: KafkaService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userPinnedProjectsProjectionService: UserPinnedProjectsProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService)
    }

    /**
     * Resolve the affected user id(s) for one CDC row, branching on the source
     * table (carried by the fully-qualified `topic`):
     *   - `user_pinned_projects` → the row's own `user_id` (0–1 ids).
     *   - `enrollments` → owners of every pin referencing that enrollment id.
     *   - `courses` → owners of every pin whose enrollment points at that course.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected user id(s) to recompute (deduplicated, may be empty).
     */
    protected async deriveTargets(
        {
            topic,
            row,
        }: ProjectionCdcMessage,
    ): Promise<Array<string>> {
        // a direct pin change carries the owner user_id on the row itself
        if (topic.endsWith("user_pinned_projects")) {
            const pinRow = row as PinnedProjectCdcRow
            // no user_id (tombstone / unexpected shape) → nothing to recompute
            return pinRow.user_id ? [
                pinRow.user_id,
            ] : []
        }
        // an enrollment change affects only pins that reference that enrollment id
        if (topic.endsWith("enrollments")) {
            const enrollmentRow = row as PinnedProjectsEnrollmentCdcRow
            if (!enrollmentRow.id) {
                return []
            }
            // reverse-lookup: owners of pins linked to this enrollment
            return this.resolveUserIds(
                `
                SELECT DISTINCT p.user_id
                FROM user_pinned_projects p
                WHERE p.enrollment_id = $1
                `,
                enrollmentRow.id,
            )
        }
        // a course change affects pins whose enrollment points at that course
        if (topic.endsWith("courses")) {
            const courseRow = row as PinnedProjectsCourseCdcRow
            if (!courseRow.id) {
                return []
            }
            // reverse-lookup: owners of pins whose enrollment's course matches
            return this.resolveUserIds(
                `
                SELECT DISTINCT p.user_id
                FROM user_pinned_projects p
                JOIN enrollments e ON e.id = p.enrollment_id
                WHERE e.course_id = $1
                `,
                courseRow.id,
            )
        }
        // unknown topic → nothing to recompute
        return []
    }

    /**
     * Recompute one user's pinned-projects projection (idempotent UPSERT).
     *
     * @param userId - the affected user id.
     */
    protected async recomputeTarget(userId: string): Promise<void> {
        await this.userPinnedProjectsProjectionService.recompute({
            userId,
        })
    }

    /**
     * Run a reverse-lookup query returning affected owner user ids.
     *
     * @param sql - the parameterised lookup ($1 is the upstream key).
     * @param key - the upstream key value to filter by.
     * @returns the distinct owner user ids the query resolved.
     */
    private async resolveUserIds(sql: string, key: string): Promise<Array<string>> {
        // run the reverse-lookup against the base pin table
        const rows = await this.entityManager.query<Array<PinnedProjectUserIdRow>>(
            sql,
            [
                key,
            ],
        )
        // project to the bare user id list the base listener expects
        return rows.map((userIdRow) => userIdRow.user_id)
    }
}
