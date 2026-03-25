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
 * A single prerequisite line item for a course (e.g. prior knowledge).
 */
@ObjectType({
    description: "Prerequisite text belonging to a course."
})
@Entity("prerequisites")
export class PrerequisiteEntity extends StringAbstractEntity {
    @Field(() => String,
        {
            description: "Requirement or prior knowledge description."
        })
    @Column({
        name: "content",
        type: "text"
    })
        content: string

    @Field(() => Int,
        {
            description: "Display order within the course prerequisite list."
        })
    @Column({
        name: "order_index",
        type: "int",
        default: 0
    })
        orderIndex: number

    @Field(() => CourseEntity,
        {
            description: "Course this prerequisite belongs to."
        })
    @ManyToOne(() => CourseEntity,
        (course: CourseEntity) => course.prerequisites,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "course_id"
    })
        course: CourseEntity
}
