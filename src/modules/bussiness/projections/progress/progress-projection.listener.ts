import {
    Injectable,
    Logger,
    type OnModuleInit,
} from "@nestjs/common"
import {
    type EachMessagePayload,
} from "kafkajs"
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
    KafkaCdcMessageException,
} from "@modules/exceptions"
import {
    KafkaService,
} from "@modules/kafka"
import {
    ProgressProjectionService,
} from "./progress-projection.service"
import type {
    CdcEnvelope,
    ChallengeAttemptTargetRow,
    ContentCourseLookupRow,
    DerivedProgressTarget,
    EnrollmentCdcRow,
    MilestoneAttemptTargetRow,
    UserChallengeSubmissionAttemptCdcRow,
    UserContentCdcRow,
    UserMilestoneTaskAttemptCdcRow,
} from "./types"

/**
 * Kafka CDC consumer that keeps the `user_course_progress_projections`
 * read-model in sync with the source-of-truth tables.
 *
 * Debezium streams Postgres row-changes into four CDC topics; this listener
 * derives the affected `(userId, courseId)` from each change and calls
 * {@link ProgressProjectionService.recompute}, which performs an idempotent
 * UPSERT. Delivery is at-least-once, so duplicate recomputes are harmless.
 *
 * The consumer is best-effort on boot: if Kafka is unreachable (some
 * environments run without it) the failure is logged and swallowed so the
 * application still starts. The broker connection + consumer disconnect are
 * owned by {@link KafkaService}; this listener only declares its group, topics,
 * and per-message projection logic.
 */
@Injectable()
export class ProgressProjectionListener implements OnModuleInit {
    /** Scoped logger so CDC issues are easy to grep in aggregated logs. */
    private readonly logger = new Logger(ProgressProjectionListener.name)

    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly progressProjectionService: ProgressProjectionService,
        private readonly kafkaService: KafkaService,
    ) {}

    /**
     * Subscribe to the four CDC topics and start consuming. Connection and
     * shutdown are delegated to {@link KafkaService}; any failure here is logged
     * and swallowed — Kafka may be down in some environments and must not block
     * application boot.
     */
    async onModuleInit(): Promise<void> {
        // topic prefix is CDC-specific (Debezium server + schema) → stays here;
        // broker endpoints are owned by KafkaService
        const { cdcTopicPrefix } = envConfig().kafka
        // build the fully-qualified CDC topic names this listener cares about
        const topics = [
            `${cdcTopicPrefix}user_contents`,
            `${cdcTopicPrefix}user_challenge_submission_attempts`,
            `${cdcTopicPrefix}user_milestone_task_attempts`,
            `${cdcTopicPrefix}enrollments`,
        ]
        try {
            // make sure the topics exist so subscribe never trips on a cold broker
            // (no-op when Debezium / auto-create already made them)
            await this.kafkaService.ensureTopics({
                topics,
            })
            // stable groupId → restarts resume from the committed offset (no replay storm);
            // KafkaService connects the consumer and tracks it for shutdown
            const { consumer } = await this.kafkaService.createConsumer({
                groupId: "progress-projection",
            })
            // subscribe to every CDC topic; fromBeginning=false → only new changes
            await consumer.subscribe({
                topics,
                fromBeginning: false,
            })
            // start the per-message processing loop (handler is failure-isolated)
            await consumer.run({
                eachMessage: (payload) => this.handleMessage(payload),
            })
            // surface successful wiring so ops can confirm CDC is live
            this.logger.log(
                `Progress-projection CDC listener subscribed to: ${topics.join(", ")}`,
            )
        } catch (error) {
            // Kafka being unreachable is non-fatal — log Error-style (stack
            // preserved) and let the app boot. `error` is already a typed
            // KafkaConsumerConnectException when the connect step failed.
            const cause = error instanceof Error ? error : new Error(String(error))
            this.logger.error(
                "Progress-projection CDC listener disabled (Kafka unavailable)",
                cause.stack,
            )
        }
    }

    /**
     * Process one CDC message: parse it, derive the affected `(userId, courseId)`
     * for its topic, and recompute the projection. Errors are caught and logged
     * (never thrown) so one bad message does not stall the consumer — recompute
     * is an idempotent UPSERT, so the next valid message self-heals.
     *
     * @param payload - the KafkaJS per-message payload (topic + raw value)
     */
    private async handleMessage(
        {
            topic,
            message,
        }: EachMessagePayload,
    ): Promise<void> {
        try {
            // tombstone/null-value records carry no row image → nothing to derive
            if (!message.value) {
                return
            }
            // parse the Debezium envelope; `payload` is the flat row after unwrap
            const envelope = JSON.parse(message.value.toString()) as CdcEnvelope<unknown>
            // some unwrap configs emit the row at top level → fall back to whole object
            const row = envelope.payload ?? envelope
            // resolve the (user, course) to recompute for this specific topic
            const target = await this.deriveTarget({
                topic,
                row,
            })
            // could not derive (delete op / missing parent row) → skip silently
            if (!target) {
                return
            }
            // idempotent UPSERT of the projection row for the affected user+course
            await this.progressProjectionService.recompute({
                userId: target.userId,
                courseId: target.courseId,
            })
        } catch (error) {
            // at-least-once delivery → swallow + log; a later message will recover.
            // wrap in a typed exception so the log carries a stable code + the
            // original stack (Error-style), keyed by the source topic
            const exception = new KafkaCdcMessageException({
                topic,
                originalError: error instanceof Error ? error : undefined,
            })
            this.logger.error(exception.message,
                exception.stack)
        }
    }

    /**
     * Map a CDC row to the `(userId, courseId)` to recompute, branching on the
     * source topic (the table name suffix). Returns `null` when the target can
     * not be derived (missing columns / deleted parent row).
     *
     * @param params - the source topic and the parsed row image
     * @returns the derived target, or `null` to skip
     */
    private async deriveTarget(
        {
            topic,
            row,
        }: {
            topic: string
            row: unknown
        },
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
