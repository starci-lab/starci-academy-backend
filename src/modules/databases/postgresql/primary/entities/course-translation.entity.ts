import {
    Field,
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
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Translation entity storing localized values for course fields.
 *
 * Each row represents:
 * (courseId, locale, field) -> translated value
 *
 * Used to override default course fields based on user locale.
 */
@ObjectType({
    description: "Localized value for a specific course field.",
})
@Entity("course_translations")
@Index(
    "uq_course_translation",
    [
        "courseId",
        "locale",
        "field"
    ],
    {
        unique: true,
    },
)
export class CourseTranslationEntity extends UuidAbstractEntity {
    /**
     * Target course ID.
     */
    @Field(() => String)
    @Column({
        name: "course_id",
        type: "varchar",
        length: 255,
    })
        courseId: string

    /**
     * Locale of the translation (e.g., vi, en).
     */
    @Field(() => GraphQLTypeLocale)
    @Column({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /**
     * Target field name being translated (e.g., title, description).
     */
    @Field(() => String)
    @Column({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    /**
     * Translated value for the field.
     */
    @Field(() => String)
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    /**
     * Reference to the parent course.
     * Cascade delete ensures translations are removed when course is deleted.
     */
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn(
        {
            name: "course_id",
            referencedColumnName: "id",
        }
    )
        course: CourseEntity
}