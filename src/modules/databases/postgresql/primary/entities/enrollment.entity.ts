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
    RelationId,
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
import {
    GraphQLTypePricingPhase,
    PricingPhase,
} from "../enums"

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
        {
            description: "User who enrolled.",
        },
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
        foreignKeyConstraintName: "fk_user_id_enrollments_users",
    })
        user: UserEntity

    @Field(
        () => CourseEntity,
        {
            description: "Course the user enrolled in.",
        },
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
        foreignKeyConstraintName: "fk_course_id_enrollments_courses",
    })
        course: CourseEntity

    @Field(() => String,
        {
            description: "The ID of the user who enrolled in the course."
        })
    @RelationId(
        (e: EnrollmentEntity) => e.user,
    )
        userId: string

    @Field(() => String,
        {
            description: "The ID of the course that the user enrolled in."
        })
    @RelationId(
        (e: EnrollmentEntity) => e.course,
    )
        courseId: string

    @Field(() => GraphQLTypePricingPhase,
        {
            description: "The pricing phase that the user enrolled in."
        })
    @Column({
        name: "pricing_phase",
        type: "enum",
        enum: PricingPhase,
    })
        pricingPhase: PricingPhase
}
