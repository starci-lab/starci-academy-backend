import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    CourseEntity,
} from "./course.entity"

/**
 * CQRS read-model (projection) of a user's aggregate progress in a course.
 *
 * Pre-computed on write by the progress projector (recompute on the events that
 * change XP — challenge passed / lesson read / milestone passed / enroll) so the
 * leaderboard + rank read a FLAT indexed row instead of running the multi-CTE
 * aggregate on every request. `(user, course)` is unique.
 *
 * Numeric-only → no translatable text, so it has no `*ProjectionTranslation`
 * companion yet (added later per the standard translation convention if a
 * projection ever snapshots display text — default locale `en`).
 */
@Unique(
    "UQ_user_course_progress_projection_user_course",
    [
        "user",
        "course",
    ],
)
// orders the per-course leaderboard + powers "users above me" rank counts
@Index(["course",
    "totalXp"])
@Entity("user_course_progress_projections")
export class UserCourseProgressProjectionEntity extends UuidAbstractEntity {
    /** The user this progress row belongs to. */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_ucp_projection_users",
    })
        user: UserEntity

    /** Id of the user (virtual, read from the relation). */
    @RelationId(
        (projection: UserCourseProgressProjectionEntity) => projection.user,
    )
        userId: string

    /** The course the progress is scoped to. */
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_ucp_projection_courses",
    })
        course: CourseEntity

    /** Id of the course (virtual, read from the relation). */
    @RelationId(
        (projection: UserCourseProgressProjectionEntity) => projection.course,
    )
        courseId: string

    /** Challenge-only score: sum over challenges of max(attempt.score) per submission. */
    @Column({
        name: "total_score",
        type: "int",
        default: 0,
    })
        totalScore: number

    /** Number of challenges fully passed (challenge score ≥ challenge.score). */
    @Column({
        name: "completed_challenges",
        type: "int",
        default: 0,
    })
        completedChallenges: number

    /** Lessons marked read inside this course. */
    @Column({
        name: "lessons_read",
        type: "int",
        default: 0,
    })
        lessonsRead: number

    /** Milestone tasks with ≥1 passed attempt. */
    @Column({
        name: "milestone_progress",
        type: "int",
        default: 0,
    })
        milestoneProgress: number

    /** Total XP = totalScore + lessonsRead×3 + milestoneProgress×10 (the rank key). */
    @Column({
        name: "total_xp",
        type: "int",
        default: 0,
    })
        totalXp: number
}
