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
    CourseEntity,
} from "./course.entity"
import {
    MilestoneTranslationEntity,
} from "./milestone-translation.entity"
import {
    MilestoneTaskEntity,
} from "./milestone-task.entity"

/**
 * A milestone (batch) belonging to a course.
 * Seeded from `.mount/data/courses/{course}/tasks/{milestone}/`.
 * Translatable fields (title, description) live in translations.
 */
@ObjectType({
    description: "A milestone belonging to a course.",
})
@Entity("milestones")
export class MilestoneEntity extends UuidAbstractEntity {
    /**
     * Milestone title.
     */
    @Field(
        () => String,
        {
            description: "Milestone title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
        default: "",
    })
        title: string

    /**
     * Optional short description of the milestone.
     */
    @Field(
        () => String,
        {
            description: "Milestone description.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        default: "",
    })
        description: string

    /**
     * Display order within the course's milestone list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the course's milestone list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Pure ordering index used to reorder the list (decoupled from orderIndex).
     */
    @Field(
        () => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex).",
        },
    )
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

    /**
     * Default locale for this milestone.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this milestone.",
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
     * Course this milestone belongs to.
     */
    @Field(
        () => CourseEntity,
        {
            description: "Course this milestone belongs to.",
        },
    )
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName:
            "fk_course_id_milestones_courses",
    })
        course: CourseEntity

    @Field(
        () => ID,
        {
            description: "Parent course ID.",
        },
    )
    @RelationId(
        (m: MilestoneEntity) => m.course,
    )
        courseId: string

    /**
     * Localized translations of milestone fields (title, description).
     */
    @Field(
        () => [MilestoneTranslationEntity],
        {
            description: "Localized translations of milestone fields.",
        },
    )
    @OneToMany(
        () => MilestoneTranslationEntity,
        (translation: MilestoneTranslationEntity) => translation.milestone,
        {
            cascade: true,
        },
    )
        translations: Array<MilestoneTranslationEntity>

    /**
     * Tasks belonging to this milestone.
     */
    @Field(
        () => [MilestoneTaskEntity],
        {
            description: "Tasks belonging to this milestone.",
        },
    )
    @OneToMany(
        () => MilestoneTaskEntity,
        (task: MilestoneTaskEntity) => task.milestone,
        {
            cascade: true,
        },
    )
        tasks: Array<MilestoneTaskEntity>
}
