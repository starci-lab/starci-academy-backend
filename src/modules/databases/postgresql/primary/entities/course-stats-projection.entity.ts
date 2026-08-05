import {
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractProjectionEntity,
} from "./abstract-projection"
import {
    CourseEntity,
} from "./course.entity"
import {
    CourseStatsProjectionTranslationEntity,
} from "./course-stats-projection-translation.entity"

@Entity("course_stats_projections")
/**
 * CQRS projection of a course's counters (Kiểu A — single key).
 *
 * Primary key is `course_id`; the aggregate (`{ enrollmentCount }`) lives in the
 * inherited jsonb `value`. Recomputed on enroll/unenroll + CDC, read with a TTL
 * lazy-refresh — replaces the old Redis enrollment-count cache.
 */
export class CourseStatsProjectionEntity extends AbstractProjectionEntity {
    /** Target course id — the natural primary key (one row per course). */
    @PrimaryColumn({
        name: "course_id",
        type: "uuid",
    })
        courseId: string

    /** The course this stats row belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_course_id_course_stats_projections_courses",
    })
        course: CourseEntity

    /** Localized overrides (empty until the projection snapshots display text). */
    @OneToMany(
        () => CourseStatsProjectionTranslationEntity,
        (translation: CourseStatsProjectionTranslationEntity) =>
            translation.courseStatsProjection,
        {
            cascade: true,
        },
    )
        translations: Array<CourseStatsProjectionTranslationEntity>
}
