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
    CourseEntity,
} from "./course.entity"

@Entity("course_review_stats_projections")
/**
 * CQRS projection of a course's review aggregate (Type A -- single key).
 *
 * Primary key is `course_id`; the aggregate lives in the inherited jsonb `value` as
 * `{ reviewCount, averageScore, scoreHistogram }`. It exists because the star rating is read on
 * every course card and every detail page, and computing an average across a course's whole review
 * table on each of those reads is a cost paid per viewer for an answer that changes per review.
 *
 * It is rebuilt from the review rows by the listener, never incremented by the delta an event
 * carried: CDC-4 is not a style preference here, because a duplicate delivery would raise the
 * average of a course nobody rated twice and a missed one could never heal itself.
 *
 * The consequence worth stating for anyone seeding data: writing `course_reviews` directly changes
 * NOTHING a reader sees until the listener has consumed the change. A seeded course with reviews
 * and no stars is the projection behaving correctly, not a bug in the read path.
 */
export class CourseReviewStatsProjectionEntity extends AbstractProjectionEntity {
    /** Target course id -- the natural primary key (one row per course). */
    @PrimaryColumn({
        name: "course_id",
        type: "uuid",
    })
        courseId: string

    /** The course this aggregate belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_course_id_course_review_stats_projections_courses",
    })
        course: CourseEntity
}
