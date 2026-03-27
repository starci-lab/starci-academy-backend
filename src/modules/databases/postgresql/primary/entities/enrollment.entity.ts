import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Entity,
    JoinColumn,
    ManyToOne,
    Unique,
    Column,
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

/**
 * Join entity representing many-to-many enrollment between users and courses.
 */
@ObjectType({
    description: "Enrollment relation between a user and a course.",
})
@Entity("enrollments")
@Unique(
    "UQ_enrollments_user_course",
    [
        "user",
        "course",
    ],
)
export class EnrollmentEntity extends UuidAbstractEntity {
    @Field(
        () => UserEntity,
    )
    @ManyToOne(
        () => UserEntity,
        (user: UserEntity) => user.enrollments,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
    })
        user: UserEntity

    @Field(
        () => CourseEntity,
    )
    @ManyToOne(
        () => CourseEntity,
        (course: CourseEntity) => course.enrollments,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
    })
        course: CourseEntity

    @Field(() => String,
        {
            description: "The ID of the user who enrolled in the course."
        })
    @Column({
        name: "user_id",
        type: "varchar",
    })
        userId: string

    @Field(() => String,
        {
            description: "The ID of the course that the user enrolled in."
        })
    @Column({
        name: "course_id",
        type: "varchar",
    })
        courseId: string
}
