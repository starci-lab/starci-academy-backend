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
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    AbstractEntity,
} from "./abstract"
import {
    LessonVideoEntity,
} from "./lesson-video.entity"

/**
 * Translation entity for lesson video fields.
 * Primary key: (lessonVideoId, locale, field).
 */
@ObjectType({
    description: "Localized value for a specific lesson video field.",
})
@Entity("lesson_video_translations")
export class LessonVideoTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target lesson video ID.",
        },
    )
    @PrimaryColumn({
        name: "lesson_video_id",
        type: "uuid",
    })
        lessonVideoId: string

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
        () => LessonVideoEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "lesson_video_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_lesson_video_id_lesson_video_translations_lesson_videos",
    })
        lessonVideo: LessonVideoEntity
}
