import {
    Field, ID, Int, ObjectType
} from "@nestjs/graphql"
import {
    CourseContentTier,
    GraphQLTypeCourseContentTier,
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
    ContentEntity,
} from "./content.entity"
import {
    PreviewContentEntity,
} from "./preview-content.entity"
import {
    UuidAbstractEntity
} from "./abstract"
import {
    ModuleTranslationEntity,
} from "./module-translation.entity"

@ObjectType({
    description: "A module belonging to a course."
})
@Entity("modules")
/**
 * Ordered unit inside a course that owns lessons and challenges. Progress,
 * hydration, paywall (`isPremium`), and CDN sync all key off module id -- a
 * lesson never hangs directly off the course.
 */
export class ModuleEntity extends UuidAbstractEntity {
    /**
     * Human-readable module title.
     */
    @Field(
        () => String,
        {
            description: "Human-readable module title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 255
    })
        title: string

    /**
     * Human-facing stable identifier for display and external references (not the primary key).
     */
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier for display and external references (not the primary key).",
        },
    )
    @Column({
        name: "display_id",
        type: "varchar",
        length: 255,
        //unique: true,
    })
        displayId: string

    /**
     * Optional short description of the module.
     */
    @Field(() => String,
        {
            description: "Optional short description of the module.",
        })
    @Column({
        name: "description",
        type: "text",
    })
        description: string

    /**
     * Display order within the parent course module list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the parent course module list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0
    })
        orderIndex: number

    /**
     * Pure display-ordering index, editable to reorder modules later without
     * touching `orderIndex` (which is folder/seed-derived). The module list is
     * sorted by THIS. Seeded from `# index` (falls back to `orderIndex` when absent).
     */
    @Field(
        () => Int,
        {
            description: "Pure ordering index used to reorder the module list (decoupled from orderIndex).",
        },
    )
    @Column({
        name: "sort_index",
        type: "int",
        default: 0
    })
        sortIndex: number

    /**
     * Hard per-module paywall flag -- when true, all of the module's contents are
     * premium (locked for non-entitled viewers). Set explicitly via `# isPremium`
     * in the module mount; independent of `contentTier` (a display-only badge).
     */
    @Field(
        () => Boolean,
        {
            description: "Whether this module is premium — locks all its contents for non-entitled viewers.",
        },
    )
    @Column({
        name: "is_premium",
        type: "boolean",
        default: false,
    })
        isPremium: boolean

    /**
     * Learning tier of the module -- stored explicitly so tiering never depends on
     * `orderIndex`. Drives the tier-based paywall (advanced + later-half intermediate
     * are premium). Seeded from the module's `# contentType` field.
     */
    @Field(
        () => GraphQLTypeCourseContentTier,
        {
            nullable: true,
            description: "Learning tier of the module (foundation / intermediate / advanced). Null on rows seeded before this column existed (predates the DB default) — treat as unset, not a crash.",
        },
    )
    @Column({
        name: "content_tier",
        type: "enum",
        enum: CourseContentTier,
        enumName: "course_content_tier",
        nullable: true,
        default: CourseContentTier.Foundation,
    })
        contentTier: CourseContentTier | null

    /**
     * Default locale for the module.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for module copy when no translation applies.",
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
     * Parent course this module belongs to.
     */
    @Field(
        () => CourseEntity,
        {
            description: "Parent course this module belongs to.",
        },
    )
    @ManyToOne(() => CourseEntity,
        (course: CourseEntity) => course.modules,
        {
            onDelete: "CASCADE",
            nullable: false,
        })
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_modules_courses",
    })
        course: CourseEntity

    @Field(
        () => ID,
        {
            description: "Parent course ID.",
        },
    )
    @RelationId(
        (mod: ModuleEntity) => mod.course,
    )
        courseId: string

    /**
     * Ordered contents attached to the module.
     */
    @Field(
        () => [ContentEntity],
        {
            description: "Ordered contents (title/body) attached to the module.",
        },
    )
    @OneToMany(
        () => ContentEntity,
        (content: ContentEntity) => content.module,
        {
            cascade: true,
        },
    )
        contents: Array<ContentEntity>

    /**
     * Ordered preview content line items belonging to the module.
     */
    @Field(
        () => [PreviewContentEntity],
        {
            description: "Ordered preview content line items belonging to the module.",
        },
    )
    @OneToMany(() => PreviewContentEntity,
        (previewContent: PreviewContentEntity) => previewContent.module,
        {
            cascade: true
        })
        previewContents: Array<PreviewContentEntity>

    /**
     * Localized translations of module fields such as title and description.
     */
    @Field(
        () => [ModuleTranslationEntity],
        {
            description: "Localized overrides for module fields (e.g. title, description).",
        },
    )
    @OneToMany(
        () => ModuleTranslationEntity,
        (moduleTranslation: ModuleTranslationEntity) => moduleTranslation.module,
        {
            cascade: true,
        },
    )
        translations: Array<ModuleTranslationEntity>

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Number of contents associated with this module.",
        },
    )
    @Column({
        name: "num_contents",
        type: "int",
        default: 0,
    })
        numContents: number
}
