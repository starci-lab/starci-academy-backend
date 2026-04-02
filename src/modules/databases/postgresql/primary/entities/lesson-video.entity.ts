import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from "typeorm"
import {
    ModuleEntity,
} from "./module.entity"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    LessonVideoTranslationEntity,
} from "./lesson-video-translation.entity"

/**
 * Lesson video for a module (e.g. YouTube URL with metadata).
 */
@ObjectType({
    description: "Lesson video link (typically YouTube) attached to a module.",
})
@Entity("lesson_videos")
export class LessonVideoEntity extends UuidAbstractEntity {
    /**
     * Video title.
     */
    @Field(
        () => String,
        {
            description: "Video title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
    })
        title: string

    /**
     * Optional video description.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional video description.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    /**
     * Video URL (e.g. YouTube watch or embed link).
     */
    @Field(
        () => String,
        {
            description: "Video URL (e.g. YouTube watch or embed link).",
        },
    )
    @Column({
        name: "url",
        type: "varchar",
        length: 2048,
    })
        url: string

    /**
     * Optional thumbnail image URL (e.g. poster frame or CDN asset).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional thumbnail image URL (e.g. poster frame or CDN asset).",
        },
    )
    @Column({
        name: "thumbnail_url",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        thumbnailUrl: string | null

    /**
     * Video duration in milliseconds.
     */
    @Field(
        () => Int,
        {
            description: "Video duration in milliseconds (for sorting, progress, APIs).",
        },
    )
    @Column({
        name: "duration_ms",
        type: "int",
    })
        durationMs: number

    /**
     * Display order within the module lesson video list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the module lesson video list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this lesson video row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this lesson video row.",
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
     * Parent module this lesson video belongs to.
     */
    @Field(
        () => ModuleEntity,
        {
            description: "Parent module this lesson video belongs to.",
        },
    )
    @ManyToOne(
        () => ModuleEntity,
        (module: ModuleEntity) => module.lessonVideos,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "module_id",
    })
        module: ModuleEntity

    /**
     * Localized translations for fields such as `title` and `description`.
     */
    @Field(
        () => [LessonVideoTranslationEntity],
        {
            description: "Localized overrides for lesson video fields (e.g. title, description).",
        },
    )
    @OneToMany(
        () => LessonVideoTranslationEntity,
        (lessonVideoTranslation: LessonVideoTranslationEntity) => lessonVideoTranslation.lessonVideo,
        {
            cascade: true,
        },
    )
        translations: Array<LessonVideoTranslationEntity>
}

