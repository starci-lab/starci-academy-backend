import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CourseEntity,
} from "./course.entity"
import {
    UserEntity,
} from "./user.entity"

@ObjectType(
    "CourseReview",
    {
        description: "One review a learner wrote about a course.",
    },
)
@Entity("course_reviews")
@Index(
    "idx_course_reviews_course_created",
    [
        "courseId",
        "createdAt",
    ],
)
/**
 * One review a learner wrote about a course.
 *
 * There is deliberately NO unique constraint on `(user, course)`: a learner may review the same
 * course more than once, because a course is not finished in one sitting and an opinion formed at
 * module two is a different statement from one formed at module ten. Both stay, both count, and the
 * projection averages every row rather than the latest one.
 *
 * The row records the author and the course as relations rather than as loose ids so that deleting
 * either takes its reviews with it -- an orphaned review would keep contributing to an average for
 * a course that no longer exists.
 *
 * IT IS A GRAPHQL OUTPUT TYPE because `submitCourseReview` and `updateCourseReview` both return it
 * as their `data`. Without `@ObjectType` the schema cannot be built at all -- Nest refuses with
 * "Cannot determine a GraphQL output type for the data" and the whole API fails to boot, which is
 * how this was found.
 *
 * ONLY THE SCALARS ARE EXPOSED. The `course` and `user` relations stay out of the schema: a client
 * that just wrote a review already knows both, and admitting them here would pull `CourseEntity`
 * and `UserEntity` into this type's graph for a field that resolves to null unless somebody
 * remembers to join it.
 */
export class CourseReviewEntity extends UuidAbstractEntity {
    /** The course being reviewed. */
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "course_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_course_id_course_reviews_courses",
    })
        course: CourseEntity

    /**
     * Denormalised course id.
     *
     * Carried as its own column so the listing index above can be composite and so the CDC
     * listener can read the projection target off the changed row without loading the relation --
     * a Debezium payload is columns, and a relation it cannot join is a target it cannot derive.
     */
    @Field(
        () => ID,
        {
            description: "Id of the course this review is about.",
        },
    )
    @Column({
        name: "course_id",
        type: "uuid",
    })
        courseId: string

    /** The learner who wrote it. */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_user_id_course_reviews_users",
    })
        user: UserEntity

    /** Denormalised author id, for the same reason the course id is carried. */
    @Field(
        () => ID,
        {
            description: "Id of the learner who wrote it.",
        },
    )
    @Column({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /**
     * The star score, one to five inclusive.
     *
     * A smallint rather than a float: half-stars are not a thing this product offers, and storing a
     * scale that admits values the UI cannot produce means the average is computed over numbers no
     * reader ever chose. The bound is enforced by the handler, which is the only place that can say
     * so with an exception a client can act on.
     */
    @Field(
        () => Int,
        {
            description: "The star score, one to five inclusive.",
        },
    )
    @Column({
        name: "score",
        type: "smallint",
    })
        score: number

    /**
     * What the learner wrote, when they wrote anything.
     *
     * Optional because a score alone is a complete review: forcing prose out of somebody who only
     * wanted to rate the course produces one-word bodies that make the list worse, not better.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "What the learner wrote, absent when they only scored the course.",
        },
    )
    @Column({
        name: "body",
        type: "text",
        nullable: true,
    })
        body?: string | null
}
