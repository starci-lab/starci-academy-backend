import {
    Field, Int, ObjectType 
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne 
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
    OutcomeEntity 
} from "./outcome.entity"
import {
    SubmissionEntity 
} from "./submission.entity"
import {
    StringAbstractEntity 
} from "./abstract"
import {
    ModuleTranslationEntity,
} from "./module-translation.entity"

@ObjectType({
    description: "A module belonging to a course; contains learning outcomes."
})
@Entity("modules")
export class ModuleEntity extends StringAbstractEntity {
    /**
     * Human-readable module title.
     */
    @Field(() => String)
    @Column({
        name: "title",
        type: "varchar",
        length: 255
    })
        title: string

    /**
     * Optional short description of the module.
     */
    @Field(() => String,
        {
            nullable: true
        })
    @Column({
        name: "description",
        type: "text",
        nullable: true
    })
        description: string | null

    /**
     * Display order within the parent course module list.
     */
    @Field(() => Int)
    @Column({
        name: "order_index",
        type: "int",
        default: 0
    })
        orderIndex: number

    /**
     * Default locale for the module.
     */
    @Field(() => GraphQLTypeLocale)
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
    @Field(() => CourseEntity)
    @ManyToOne(() => CourseEntity,
        (course: CourseEntity) => course.modules,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "course_id"
    })
        course: CourseEntity

    /**
     * Content attached to the module (optional).
     */
    @Field(
        () => ContentEntity,
        {
            nullable: true,
        },
    )
    @OneToOne(
        () => ContentEntity,
        (row: ContentEntity) => row.module,
        {
            cascade: true,
        },
    )
        content?: ContentEntity

    /**
     * Ordered preview content line items belonging to the module.
     */
    @Field(() => [PreviewContentEntity])
    @OneToMany(() => PreviewContentEntity,
        (row: PreviewContentEntity) => row.module,
        {
            cascade: true
        })
        previewContents: Array<PreviewContentEntity>

    /**
     * Lesson videos attached to the module.
     */
    @Field(() => [LessonVideoEntity])
    @OneToMany(() => LessonVideoEntity,
        (row: LessonVideoEntity) => row.module,
        {
            cascade: true
        })
        lessonVideos: Array<LessonVideoEntity>

    /**
     * Ordered learning outcomes belonging to the module.
     */
    @Field(() => [OutcomeEntity])
    @OneToMany(() => OutcomeEntity,
        (outcome: OutcomeEntity) => outcome.module,
        {
            cascade: true
        })
        outcomes: Array<OutcomeEntity>

    /**
     * Submissions associated with the module.
     */
    @Field(() => [SubmissionEntity],
        {
            nullable: true
        })
    @OneToMany(() => SubmissionEntity,
        (sub: SubmissionEntity) => sub.module,
        {
            cascade: true
        })
        submissions: Array<SubmissionEntity>

    /**
     * Localized translations of module fields such as title and description.
     */
    @Field(
        () => [ModuleTranslationEntity],
        {
            nullable: true,
        },
    )
    @OneToMany(
        () => ModuleTranslationEntity,
        (moduleTranslation: ModuleTranslationEntity) => moduleTranslation.module,
        {
            cascade: true,
        },
    )
        translations?: Array<ModuleTranslationEntity>
}
