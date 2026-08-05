import {
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
    RelationId,
} from "typeorm"
import {
    AbstractProjectionEntity,
} from "./abstract-projection"
import {
    UserEntity,
} from "./user.entity"
import {
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    CourseEntity,
} from "./course.entity"
import {
    UserCourseProgressProjectionTranslationEntity,
} from "./user-course-progress-projection-translation.entity"

@Index(["courseId"])
@Entity("user_course_progress_projections")
/**
 * CQRS projection of a user's progress in a course (Type B -- composite key of
 * two foreign keys).
 *
 * Primary key is `(user_id, course_id)`; the aggregate (`{ totalScore,
 * completedChallenges, lessonsRead, milestoneProgress, totalXp }`) lives in the
 * inherited jsonb `value`. The leaderboard reads order by `(value->>'totalXp')`;
 * a functional index on `(course_id, ((value->>'totalXp')::int) DESC)` backs
 * that ordering (created out-of-band -- TypeORM `synchronize` does not emit
 * expression indexes). The plain `course_id` index here covers the WHERE filter.
 */
export class UserCourseProgressProjectionEntity extends AbstractProjectionEntity {
    /** Owner user id -- first half of the composite primary key. */
    @PrimaryColumn({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /** Course id -- second half of the composite primary key. */
    @PrimaryColumn({
        name: "course_id",
        type: "uuid",
    })
        courseId: string

    /** The user this progress row belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_user_id_ucp_projections_users",
    })
        user: UserEntity

    /** The course the progress is scoped to (cascade-deleted with it). */
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_course_id_ucp_projections_courses",
    })
        course: CourseEntity

    /**
     * Enrollment this progress projection belongs to (user x course). The anchor
     * for per-course progress going forward; nullable while the re-key backfill
     * runs. The composite PK `(user_id, course_id)` is intentionally left
     * untouched in this phase.
     */
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName: "fk_enrollment_id_ucp_projections",
    })
        enrollment: EnrollmentEntity | null

    @RelationId(
        (projection: UserCourseProgressProjectionEntity) => projection.enrollment,
    )
        enrollmentId: string | null

    /** Localized overrides (empty until the projection snapshots display text). */
    @OneToMany(
        () => UserCourseProgressProjectionTranslationEntity,
        (translation: UserCourseProgressProjectionTranslationEntity) =>
            translation.userCourseProgressProjection,
        {
            cascade: true,
        },
    )
        translations: Array<UserCourseProgressProjectionTranslationEntity>
}
