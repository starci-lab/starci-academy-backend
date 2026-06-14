import {
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractProjectionEntity,
} from "./abstract-projection"
import {
    UserEntity,
} from "./user.entity"
import {
    CourseEntity,
} from "./course.entity"
import {
    UserCourseProgressProjectionTranslationEntity,
} from "./user-course-progress-projection-translation.entity"

/**
 * CQRS projection of a user's progress in a course (Kiểu B — composite key of
 * two foreign keys).
 *
 * Primary key is `(user_id, course_id)`; the aggregate (`{ totalScore,
 * completedChallenges, lessonsRead, milestoneProgress, totalXp }`) lives in the
 * inherited jsonb `value`. The leaderboard reads order by `(value->>'totalXp')`;
 * a functional index on `(course_id, ((value->>'totalXp')::int) DESC)` backs
 * that ordering (created out-of-band — TypeORM `synchronize` does not emit
 * expression indexes). The plain `course_id` index here covers the WHERE filter.
 */
@Index(["courseId"])
@Entity("user_course_progress_projections")
export class UserCourseProgressProjectionEntity extends AbstractProjectionEntity {
    /** Owner user id — first half of the composite primary key. */
    @PrimaryColumn({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /** Course id — second half of the composite primary key. */
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
