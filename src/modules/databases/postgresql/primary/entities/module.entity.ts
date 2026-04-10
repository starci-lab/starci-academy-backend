import {
    Field, ID, Int, ObjectType 
} from "@nestjs/graphql"
import {
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
    LessonVideoEntity,
} from "./lesson-video.entity"
import {
    ChallengeEntity,
} from "./challenge.entity"
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
        unique: true,
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
            onDelete: "CASCADE"
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
     * Lesson videos attached to the module.
     */
    @Field(
        () => [LessonVideoEntity],
        {
            description: "Lesson videos attached to the module.",
        },
    )
    @OneToMany(() => LessonVideoEntity,
        (lessonVideo: LessonVideoEntity) => lessonVideo.module,
        {
            cascade: true
        })
        lessonVideos: Array<LessonVideoEntity>

    /**
     * Challenges (exercises) attached to the module.
     */
    @Field(
        () => [ChallengeEntity],
        {
            description: "Ordered challenges attached to the module.",
        },
    )
    @OneToMany(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.module,
        {
            cascade: true,
        },
    )
        challenges: Array<ChallengeEntity>

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
}
