import {
    Field, ID, Int, ObjectType 
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column, Entity, JoinColumn, ManyToOne, OneToMany, RelationId,
} from "typeorm"
import {
    CourseEntity 
} from "./course.entity"
import {
    UuidAbstractEntity 
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
export class PrerequisiteEntity extends UuidAbstractEntity {
    /**
     * Requirement or prior knowledge description.
     */
    @Field(() => String,
        {
            description: "Requirement or prior knowledge text."
        })
    @Column({
        name: "text",
        type: "text"
    })
        text: string

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
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this prerequisite row.",
        },
    )
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
        name: "course_id",
        foreignKeyConstraintName:
            "fk_course_id_prerequisites_courses",
    })
        course: CourseEntity

    @Field(
        () => ID,
        {
            description: "Parent course ID.",
        },
    )
    @RelationId(
        (p: PrerequisiteEntity) => p.course,
    )
        courseId: string

    /**
     * Localized translations of prerequisite fields such as content.
     */
    @Field(
        () => [PrerequisiteTranslationEntity],
        {
            description: "Localized overrides for prerequisite fields (e.g. content).",
        },
    )
    @OneToMany(
        () => PrerequisiteTranslationEntity,
        (prerequisiteTranslation: PrerequisiteTranslationEntity) => prerequisiteTranslation.prerequisite,
        {
            cascade: true,
        },
    )
        translations: Array<PrerequisiteTranslationEntity>
}
