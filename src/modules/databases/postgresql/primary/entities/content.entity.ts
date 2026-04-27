import {
    Field,
    ID,
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
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ModuleEntity,
} from "./module.entity"
import {
    ContentTranslationEntity,
} from "./content-translation.entity"
import {
    ContentReferenceEntity,
} from "./content-reference.entity"
import {
    ChallengeEntity,
} from "./challenge.entity"
import {
    LessonVideoEntity,
} from "./lesson-video.entity"

/**
 * Content attached to a module (title, optional description, body).
 */
@ObjectType({
    description: "Content attached to a module (title, description, body).",
})
@Entity("contents")
export class ContentEntity extends UuidAbstractEntity {
    /**
     * Content title.
     */
    @Field(
        () => String,
        {
            description: "Content title.",
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
            description: "Human-facing stable identifier from the content mount folder slug.",
        },
    )
    @Column({
        name: "display_id",
        type: "varchar",
        length: 255,
    })
        displayId: string

    /**
     * Optional short summary shown before the body (plain text or light markdown).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional short summary shown before the body.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    /**
     * Optional markdown body.
     */
    @Field(
        () => String,
        {
            description: "Markdown body content.",
        },
    )
    @Column({
        name: "body",
        type: "text",
    })
        body: string

    /**
     * Display order within the module content list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the module content list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this content row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this content row.",
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
     * Parent module this content belongs to.
     */
    @Field(
        () => ModuleEntity,
        {
            description: "Parent module this content belongs to.",
        },
    )
    @ManyToOne(
        () => ModuleEntity,
        (module: ModuleEntity) => module.contents,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "module_id",
        foreignKeyConstraintName: "fk_module_id_contents_modules",
    })
        module: ModuleEntity

    @Field(
        () => ID,
        {
            description: "Parent module ID.",
        },
    )
    @RelationId(
        (c: ContentEntity) => c.module,
    )
        moduleId: string

    /**
     * Estimated minutes to read content text content (articles, docs, etc.).
     */
    @Field(
        () => Int,
        {
            description: "Estimated minutes to read content text content.",
        },
    )
    @Column({
        name: "minutes_read",
        type: "int",
        default: 0,
    })
        minutesRead: number

    /**
     * Localized translations for fields such as `title` and `body`.
     */
    @Field(
        () => [ContentTranslationEntity],
        {
            description: "Localized overrides for content fields (e.g. title, description, body).",
        },
    )
    @OneToMany(
        () => ContentTranslationEntity,
        (contentTranslation: ContentTranslationEntity) => contentTranslation.content,
        {
            cascade: true,
        },
    )
        translations: Array<ContentTranslationEntity>

    /**
     * External URL references (docs, repos, etc.).
     */
    @Field(
        () => [ContentReferenceEntity],
        {
            description: "External URL references linked to this content.",
        },
    )
    @OneToMany(
        () => ContentReferenceEntity,
        (reference: ContentReferenceEntity) => reference.content,
        {
            cascade: true,
        },
    )
        references: Array<ContentReferenceEntity>

    /**
     * Lessons derived from this content.
     */
    @Field(
        () => [LessonVideoEntity],
        {
            nullable: true,
            description: "Lesson videos associated with this content.",
        },
    )
    @OneToMany(
        () => LessonVideoEntity,
        (lesson: LessonVideoEntity) => lesson.content,
        {
            cascade: true,
        },
    )
        lessons: Array<LessonVideoEntity>

    /**
     * Challenges derived from this content.
     */
    @Field(
        () => [ChallengeEntity],
        {
            nullable: true,
            description: "Challenges associated with this content.",
        },
    )
    @OneToMany(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.content,
        {
            cascade: true,
        },
    )
        challenges: Array<ChallengeEntity>

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Number of challenges associated with this content.",
        },
    )
    @Column({
        name: "num_challenges",
        type: "int",
        default: 0,
    })
        numChallenges: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Number of lessons associated with this content.",
        },
    )
    @Column({
        name: "num_lessons",
        type: "int",
        default: 0,
    })
        numLessons: number
}