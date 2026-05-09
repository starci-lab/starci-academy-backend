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
    PersonalProjectContextTranslationEntity,
} from "./personal-project-context-translation.entity"

/**
 * Personal project context attached to a course.
 * One row per course — holds both requirements and roadmap.
 * Used as LLM context when generating personalized milestones.
 */
@Entity("personal_project_contexts")
export class PersonalProjectContextEntity extends UuidAbstractEntity {
    /**
     * Order index for display/processing order.
     */
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Project requirements (free-form text, English default).
     */
    @Column({
        name: "requirements",
        type: "text",
        nullable: true,
    })
        requirements: string

    /**
     * Project roadmap (free-form text, English default).
     */
    @Column({
        name: "roadmap",
        type: "text",
        nullable: true,
    })
        roadmap: string

    /**
     * Course this context belongs to.
     */
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName:
            "fk_course_id_personal_project_contexts_courses",
    })
        course: CourseEntity

    @RelationId(
        (ctx: PersonalProjectContextEntity) => ctx.course,
    )
        courseId: string

    /**
     * Translations for this context (localized content).
     */
    @OneToMany(
        () => PersonalProjectContextTranslationEntity,
        (translation: PersonalProjectContextTranslationEntity) => translation.personalProjectContext,
        {
            cascade: true,
        },
    )
        translations: Array<PersonalProjectContextTranslationEntity>
}
