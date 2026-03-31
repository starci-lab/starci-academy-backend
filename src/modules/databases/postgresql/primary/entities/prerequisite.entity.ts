import {
    Field, Int, ObjectType 
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column, Entity, JoinColumn, ManyToOne 
} from "typeorm"
import {
    OneToMany,
} from "typeorm"
import {
    CourseEntity 
} from "./course.entity"
import {
    StringAbstractEntity 
} from "./abstract"
import {
    PrerequisiteTranslationEntity,
} from "./prerequisite-translation.entity"

/**
 * A single prerequisite line item for a course (e.g. prior knowledge).
 */
@ObjectType({
    description: "Prerequisite text belonging to a course."
})
@Entity("prerequisites")
export class PrerequisiteEntity extends StringAbstractEntity {
    /**
     * Requirement or prior knowledge description.
     */
    @Field(() => String,
        {
            description: "Requirement or prior knowledge description."
        })
    @Column({
        name: "content",
        type: "text"
    })
        content: string

    /**
     * Display order within the course prerequisite list.
     */
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

    /**
     * Default locale for the prerequisite.
     */
    @Field(() => GraphQLTypeLocale)
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Course this prerequisite belongs to.
     */
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

    /**
     * Localized translations of prerequisite fields such as content.
     */
    @Field(
        () => [PrerequisiteTranslationEntity],
        {
            nullable: true,
        },
    )
    @OneToMany(
        () => PrerequisiteTranslationEntity,
        (prerequisiteTranslation: PrerequisiteTranslationEntity) => prerequisiteTranslation.prerequisite,
        {
            cascade: true,
        },
    )
        translations?: Array<PrerequisiteTranslationEntity>
}
