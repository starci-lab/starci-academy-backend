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
    UserCourseProgressProjectionEntity,
} from "./user-course-progress-projection.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums/locale"

@ObjectType({
    description: "Localized value for a user-course-progress projection field.",
})
@Entity("user_course_progress_projection_translations")
/**
 * Localized overrides for {@link UserCourseProgressProjectionEntity} fields.
 *
 * Each row: (userId, courseId, locale, field) -> translated value. Starts EMPTY
 * (the projection is numeric-only today). Composite primary key
 * (userId, courseId, locale, field); the (userId, courseId) pair is also the FK
 * back to the projection.
 */
export class UserCourseProgressProjectionTranslationEntity extends AbstractEntity {
    /** Owner user id -- part of the composite PK + composite FK. */
    @Field(
        () => String,
        {
            description: "Target user id.",
        },
    )
    @PrimaryColumn({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /** Course id -- part of the composite PK + composite FK. */
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

    /** Parent projection row (cascade-deleted with it); composite (user, course) FK. */
    @ManyToOne(
        () => UserCourseProgressProjectionEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn([
        {
            name: "user_id",
            referencedColumnName: "userId",
            foreignKeyConstraintName: "fk_ucpp_translation_projection",
        },
        {
            name: "course_id",
            referencedColumnName: "courseId",
            foreignKeyConstraintName: "fk_ucpp_translation_projection",
        },
    ])
        userCourseProgressProjection: UserCourseProgressProjectionEntity
}
