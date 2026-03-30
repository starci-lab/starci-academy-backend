import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
} from "typeorm"
import {
    CourseEntity,
} from "./course.entity"
import {
    StringAbstractEntity,
} from "./abstract"
import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"

/**
 * Bullet value proposition line for a course (1:N from {@link CourseEntity}).
 */
@ObjectType({
    description: "Value proposition line for a course."
})
@Entity("value_propositions")
export class ValuePropositionEntity extends StringAbstractEntity {
    @Field(() => String,
        {
            description: "Value proposition line content."
        })
    @Column({
        name: "content",
        type: "text",
    })
        content: string

    @Field(() => Int,
        {
            description: "Display order within the course value proposition list."
        })
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(() => CourseEntity,
        {
            description: "Course this value proposition belongs to."
        })
    @ManyToOne(
        () => CourseEntity,
        (course: CourseEntity) => course.valuePropositions,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
    })
        course: CourseEntity
}
