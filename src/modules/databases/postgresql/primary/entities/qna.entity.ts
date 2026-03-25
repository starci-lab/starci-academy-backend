import {
    Field, Int, ObjectType
} from "@nestjs/graphql"
import {
    Column, Entity, JoinColumn, ManyToOne
} from "typeorm"
import {
    CourseEntity
} from "./course.entity"
import {
    StringAbstractEntity
} from "./abstract"

/**
 * Frequently asked question and answer pair for a course landing page.
 */
@ObjectType({
    description: "Question and answer entry for a course."
})
@Entity("qnas")
export class QnaEntity extends StringAbstractEntity {
    @Field(() => String,
        {
            description: "FAQ question text."
        })
    @Column({
        name: "question",
        type: "text"
    })
        question: string

    @Field(() => String,
        {
            description: "FAQ answer text."
        })
    @Column({
        name: "answer",
        type: "text"
    })
        answer: string

    @Field(() => Int,
        {
            description: "Display order within the course Q&A list."
        })
    @Column({
        name: "order_index",
        type: "int",
        default: 0
    })
        orderIndex: number

    @Field(() => CourseEntity,
        {
            description: "Course this Q&A belongs to."
        })
    @ManyToOne(() => CourseEntity,
        (course: CourseEntity) => course.qnas,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "course_id"
    })
        course: CourseEntity
}
