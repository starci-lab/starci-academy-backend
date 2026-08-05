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
    CourseStatsProjectionEntity,
} from "./course-stats-projection.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums/locale"

@ObjectType({
    description: "Localized value for a course-stats projection field.",
})
@Entity("course_stats_projection_translations")
/**
 * Localized overrides for {@link CourseStatsProjectionEntity} fields.
 *
 * Each row: (courseId, locale, field) -> translated value. Starts EMPTY (the
 * projection is numeric-only today). Composite primary key (courseId, locale, field).
 */
export class CourseStatsProjectionTranslationEntity extends AbstractEntity {
    /** Target projection natural key (course id) -- part of the composite PK. */
    @Field(
        () => String,
        {
            description: "Target course id.",
        },
    )
    @PrimaryColumn({
        name: "course_id",
        type: "uuid",
    })
        courseId: string

    /** Locale of the translation (e.g. vi, en). */
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

    /** Target field name being translated. */
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

    /** Translated value for the field. */
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

    /** Parent projection row (cascade-deleted with it). */
    @ManyToOne(
        () => CourseStatsProjectionEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        referencedColumnName: "courseId",
        foreignKeyConstraintName: "fk_course_id_course_stats_projection_translations",
    })
        courseStatsProjection: CourseStatsProjectionEntity
}
