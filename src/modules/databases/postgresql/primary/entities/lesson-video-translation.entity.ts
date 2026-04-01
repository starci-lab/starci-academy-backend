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
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    LessonVideoEntity,
} from "./lesson-video.entity"

/**
 * Translation entity storing localized values for lesson video fields.
 *
 * Each row represents:
 * (lessonVideoId, locale, field) -> translated value
 */
@ObjectType({
    description: "Localized value for a specific lesson video field.",
})
@Entity("lesson_video_translations")
@Index(
    "uq_lesson_video_translation",
    [
        "lessonVideoId",
        "locale",
        "field",
    ],
    {
        unique: true,
    },
)
export class LessonVideoTranslationEntity extends UuidAbstractEntity {
    /**
     * Target lesson video ID.
     */
    @Field(
        () => String,
        {
            description: "Target lesson video ID.",
        },
    )
    @Column({
        name: "lesson_video_id",
        type: "varchar",
        length: 255,
    })
        lessonVideoId: string

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
    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @Column({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    /**
     * Translated value for the field.
     */
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

    /**
     * Reference to the parent lesson video.
     * Cascade delete ensures translations are removed when lesson video is deleted.
     */
    @ManyToOne(
        () => LessonVideoEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "lesson_video_id",
        referencedColumnName: "id",
    })
        lessonVideo: LessonVideoEntity
}

