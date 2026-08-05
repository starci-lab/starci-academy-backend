import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractProjectionEntity,
} from "./abstract-projection"
import {
    EnrollmentEntity,
} from "./enrollment.entity"

@Entity("user_challenge_progress_projections")
/**
 * CQRS projection of a user's per-challenge progress in a course (Type A -- single
 * key `enrollment_id`).
 *
 * The aggregate (`{ completionTasks: [...] }` -- one entry per challenge with the
 * summed latest-attempt score + lifecycle status) lives in the inherited jsonb
 * `value`; the inherited `updatedAt` drives the read-time TTL lazy-refresh.
 * Recomputed inline on grade-complete + via CDC, read with a TTL lazy-refresh --
 * replaces the old Redis `challenge.submission.progress` cache (the projection
 * table IS the cache now).
 */
export class UserChallengeProgressProjectionEntity extends AbstractProjectionEntity {
    /** Enrollment this progress row belongs to -- the natural primary key. */
    @PrimaryColumn({
        name: "enrollment_id",
        type: "uuid",
    })
        enrollmentId: string

    /** The enrollment the progress is scoped to (cascade-deleted with it). */
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_enrollment_id_user_challenge_progress_projections",
    })
        enrollment: EnrollmentEntity
}
