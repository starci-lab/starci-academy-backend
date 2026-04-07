import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractEntity,
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
 * Primary key: (courseId, locale, field).
 */
@ObjectType({
    description: "Localized value for a specific course field.",
})
@Entity("course_translations")
export class CourseTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target course ID.",
        },
    )
    @PrimaryColumn({
        name: "course_id",
        type: "uuid",
    })
        courseId: string

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale of the translation (e.g. vi, en).",
        },
    )
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    @Field(
        () => String,
        {
            description: "Translated value for the field.",
        },
    )
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_course_id_course_translations_courses",
    })
        course: CourseEntity
}
