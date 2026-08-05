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
    WinstonService,
} from "@modules/winston"
import {
    AbstractProjectionListener,
    type ProjectionCdcMessage,
} from "@modules/projection"
import {
    ProgressProjectionService,
} from "./progress-projection.service"
import type {
    ChallengeAttemptTargetRow,
    ContentCourseLookupRow,
    DerivedProgressTarget,
    EnrollmentCdcRow,
    MilestoneAttemptTargetRow,
    UserChallengeSubmissionAttemptCdcRow,
    UserContentCdcRow,
    UserMilestoneTaskAttemptCdcRow,
} from "./types"

@Injectable()
/**
 * Kafka CDC consumer that keeps the `user_course_progress_projections`
 * read-model in sync with the source-of-truth tables.
 *
 * Debezium streams Postgres row-changes into four CDC topics; this listener
 * derives the affected `(userId, courseId)` from each change and calls
 * {@link ProgressProjectionService.recompute}, which performs an idempotent
 * UPSERT. Delivery is at-least-once, so duplicate recomputes are harmless.
 *
 * Extends {@link AbstractProjectionListener}, which owns topic subscription,
 * best-effort boot, and the swallow-and-log per-message loop; this class only
 * declares its group, its topics, and how to derive/recompute one target.
 */
export class ProgressProjectionListener extends AbstractProjectionListener<DerivedProgressTarget> {
    /** Stable groupId → restarts resume from the committed offset (no replay storm). */
    protected readonly groupId = "progress-projection"

    /** The four CDC topics whose row-changes can move a user's course progress. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}user_contents`,
        `${envConfig().kafka.cdcTopicPrefix}user_challenge_submission_attempts`,
        `${envConfig().kafka.cdcTopicPrefix}user_milestone_task_attempts`,
        `${envConfig().kafka.cdcTopicPrefix}enrollments`,
    ]

    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly progressProjectionService: ProgressProjectionService,
        kafkaService: KafkaService,
        winstonService: WinstonService,
    ) {
        // base owns the Kafka wiring (subscribe, boot, per-message loop)
        super(kafkaService,
            winstonService)
    }

    /**
     * Map a CDC row to the `(userId, courseId)` to recompute, branching on the
     * source topic (the table name suffix). Returns an empty array when the
     * target cannot be derived (missing columns / deleted parent row) — the
     * base class treats an empty array as "skip this message".
     *
     * @param message - {@link ProjectionCdcMessage} (source topic + parsed row).
     * @returns the derived target wrapped in an array (0–1 elements).
     */
    protected async deriveTargets(
        {
            topic,
            row,
        }: ProjectionCdcMessage,
    ): Promise<Array<DerivedProgressTarget>> {
        const target = await this.deriveTarget({
            topic,
            row,
        })
        return target ? [
            target,
        ] : []
    }

    /**
     * Map a CDC row to the `(userId, courseId)` to recompute, branching on the
     * source topic (the table name suffix). Returns `null` when the target
     * cannot be derived (missing columns / deleted parent row).
     *
     * @param params - the source topic and the parsed row image
     * @returns the derived target, or `null` to skip
     */
    private async deriveTarget(
        {
            topic,
            row,
        }: ProjectionCdcMessage,
    ): Promise<DerivedProgressTarget | null> {
        // match the topic by its table-name suffix (prefix is env-configurable)
        if (topic.endsWith("user_contents")) {
            return this.deriveFromUserContent(row as UserContentCdcRow)
        }
        if (topic.endsWith("user_challenge_submission_attempts")) {
            return this.deriveFromChallengeAttempt(row as UserChallengeSubmissionAttemptCdcRow)
        }
        if (topic.endsWith("user_milestone_task_attempts")) {
            return this.deriveFromMilestoneAttempt(row as UserMilestoneTaskAttemptCdcRow)
        }
        if (topic.endsWith("enrollments")) {
            return this.deriveFromEnrollment(row as EnrollmentCdcRow)
        }
        // unknown topic (mis-subscription) → nothing to do
        return null
    }

    /**
     * Recompute the projection for one derived `(userId, courseId)` target
     * (idempotent UPSERT).
     *
     * @param target - one target returned by {@link deriveTargets}.
     */
    protected async recomputeTarget(target: DerivedProgressTarget): Promise<void> {
        await this.progressProjectionService.recompute({
            userId: target.userId,
            courseId: target.courseId,
        })
    }

    /**
     * `user_contents`: the row carries `user_id` directly; the course is looked
     * up from the content's owning module.
     *
     * @param row - the `user_contents` row image
     * @returns the derived target, or `null` when the user/content is missing
     */
    private async deriveFromUserContent(
        row: UserContentCdcRow,
    ): Promise<DerivedProgressTarget | null> {
        // both columns are required to resolve a course → bail if either absent
        if (!row.user_id || !row.content_id) {
            return null
        }
        // walk content → module to find the owning course (dashboard has no course)
        const rows = await this.entityManager.query<Array<ContentCourseLookupRow>>(
            `
            SELECT m.course_id
            FROM contents ct
            JOIN modules m ON m.id = ct.module_id
            WHERE ct.id = $1
            `,
            [
                row.content_id,
            ],
        )
        // content was deleted / not found → skip
        if (rows.length === 0) {
            return null
        }
        return {
            userId: row.user_id,
            courseId: rows[0].course_id,
        }
    }

    /**
     * `user_challenge_submission_attempts`: only the FK
     * `user_challenge_submission_id` is on the row; join up through
     * user_challenge_submissions → challenge_submissions → challenges →
     * contents → modules to reach both the user and the course.
     *
     * @param row - the attempt row image
     * @returns the derived target, or `null` when the chain cannot be resolved
     */
    private async deriveFromChallengeAttempt(
        row: UserChallengeSubmissionAttemptCdcRow,
    ): Promise<DerivedProgressTarget | null> {
        // the join root FK must be present
        if (!row.user_challenge_submission_id) {
            return null
        }
        // resolve user_id (from the submission) + course_id (from the content chain)
        const rows = await this.entityManager.query<Array<ChallengeAttemptTargetRow>>(
            `
            SELECT ucs.user_id, m.course_id
            FROM user_challenge_submissions ucs
            JOIN challenge_submissions cs ON cs.id = ucs.submission_id
            JOIN challenges ch ON ch.id = cs.challenge_id
            JOIN contents ct ON ct.id = ch.content_id
            JOIN modules m ON m.id = ct.module_id
            WHERE ucs.id = $1
            `,
            [
                row.user_challenge_submission_id,
            ],
        )
        // parent submission deleted / orphan → skip
        if (rows.length === 0) {
            return null
        }
        return {
            userId: rows[0].user_id,
            courseId: rows[0].course_id,
        }
    }

    /**
     * `user_milestone_task_attempts`: only the FK `user_milestone_task_id` is on
     * the row; join up through user_milestone_tasks → enrollments to read the
     * enrollment's user_id + course_id directly.
     *
     * @param row - the attempt row image
     * @returns the derived target, or `null` when the chain cannot be resolved
     */
    private async deriveFromMilestoneAttempt(
        row: UserMilestoneTaskAttemptCdcRow,
    ): Promise<DerivedProgressTarget | null> {
        // the join root FK must be present
        if (!row.user_milestone_task_id) {
            return null
        }
        // the enrollment row holds both user_id and course_id authoritatively
        const rows = await this.entityManager.query<Array<MilestoneAttemptTargetRow>>(
            `
            SELECT e.user_id, e.course_id
            FROM user_milestone_tasks umt
            JOIN enrollments e ON e.id = umt.enrollment_id
            WHERE umt.id = $1
            `,
            [
                row.user_milestone_task_id,
            ],
        )
        // milestone task / enrollment deleted → skip
        if (rows.length === 0) {
            return null
        }
        return {
            userId: rows[0].user_id,
            courseId: rows[0].course_id,
        }
    }

    /**
     * `enrollments`: the row carries both `user_id` and `course_id` directly, so
     * no lookup is needed.
     *
     * @param row - the enrollment row image
     * @returns the derived target, or `null` when either column is missing
     */
    private deriveFromEnrollment(
        row: EnrollmentCdcRow,
    ): DerivedProgressTarget | null {
        // both columns must be present to scope the recompute
        if (!row.user_id || !row.course_id) {
            return null
        }
        return {
            userId: row.user_id,
            courseId: row.course_id,
        }
    }
}
