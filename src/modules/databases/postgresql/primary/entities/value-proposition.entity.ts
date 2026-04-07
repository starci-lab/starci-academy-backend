import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    CourseEntity,
} from "./course.entity"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ValuePropositionTranslationEntity,
} from "./value-proposition-translation.entity"
import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Bullet value proposition line for a course (1:N from {@link CourseEntity}).
 */
@ObjectType({
    description: "Value proposition line for a course."
})
@Entity("value_propositions")
export class ValuePropositionEntity extends UuidAbstractEntity {
    /**
     * Value proposition line content.
     */
    @Field(() => String,
        {
            description: "Value proposition line content."
        })
    @Column({
        name: "text",
        type: "text",
    })
        text: string

    /**
     * Display order within the course value proposition list.
     */
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

    /**
     * Default locale for the value proposition.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this value proposition row.",
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
     * Course this value proposition belongs to.
     */
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
        foreignKeyConstraintName:
            "fk_course_id_value_propositions_courses",
    })
        course: CourseEntity

    @Field(
        () => ID,
        {
            description: "Parent course ID.",
        },
    )
    @RelationId(
        (vp: ValuePropositionEntity) => vp.course,
    )
        courseId: string

    /**
     * Localized translations of value proposition fields such as content.
     */
    @Field(
        () => [ValuePropositionTranslationEntity],
        {
            nullable: true,
            description: "Localized overrides for value proposition fields (e.g. content).",
        },
    )
    @OneToMany(
        () => ValuePropositionTranslationEntity,
        (valuePropositionTranslation: ValuePropositionTranslationEntity) => valuePropositionTranslation.valueProposition,
        {
            cascade: true,
        },
    )
        translations?: Array<ValuePropositionTranslationEntity>
}
