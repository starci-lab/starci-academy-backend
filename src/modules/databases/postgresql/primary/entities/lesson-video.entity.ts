import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLessonVideoKind,
    GraphQLTypeLocale,
    GraphQLTypeVideoHostPlatform,
    LessonVideoKind,
    Locale,
    VideoHostPlatform,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    ContentEntity,
} from "./content.entity"
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
     * Human-facing stable identifier from the mount folder (`{index}-{slug}` slug segment).
     */
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier from the lesson-video mount folder slug.",
        },
    )
    @Column({
        name: "display_id",
        type: "varchar",
        length: 255,
    })
        displayId: string

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
     * Production type (raw, edited, or premium recording).
     */
    @Field(
        () => GraphQLTypeLessonVideoKind,
        {
            description: "Lesson video production type (raw, edited, or premium recording).",
        },
    )
    @Column({
        name: "kind",
        type: "enum",
        enum: LessonVideoKind,
        enumName: "lesson_video_kind",
        default: LessonVideoKind.RawStream,
    })
        kind: LessonVideoKind

    /**
     * Optional short caption / note shown next to the video (default locale column).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional caption or note for the video (localized via translations).",
        },
    )
    @Column({
        name: "caption",
        type: "text",
        nullable: true,
    })
        caption: string | null

    /**
     * Host platform for the video URL (YouTube, Google Drive, etc.).
     */
    @Field(
        () => GraphQLTypeVideoHostPlatform,
        {
            description: "Host or delivery platform for the video URL.",
        },
    )
    @Column({
        name: "host_platform",
        type: "enum",
        enum: VideoHostPlatform,
        enumName: "video_host_platform",
        default: VideoHostPlatform.Youtube,
    })
        hostPlatform: VideoHostPlatform

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
     * Optional parent content this lesson is derived from.
     */
    @Field(
        () => ContentEntity,
        {
            nullable: true,
            description: "Optional content this lesson video is associated with.",
        },
    )
    @ManyToOne(
        () => ContentEntity,
        (content: ContentEntity) => content.lessons,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_lesson_videos_contents",
    })
        content: ContentEntity

    @Field(
        () => ID,
        {
            description: "Optional parent content ID.",
        },
    )
    @RelationId(
        (lv: LessonVideoEntity) => lv.content,
    )
        contentId: string

    /**
     * Optional minimum pricing tier required to access this video; null means no extra tier gate.
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Parent pricing phase ID required to access this video.",
        },
    )
    @Column({
        name: "pricing_phase_id",
        type: "uuid",
        nullable: true,
    })
        pricingPhaseId: string | null

    /**
     * Localized translations for fields such as `title` and `description`.
     */
    @Field(
        () => [LessonVideoTranslationEntity],
        {
            description: "Localized overrides for lesson video fields (e.g. title, description, caption).",
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

