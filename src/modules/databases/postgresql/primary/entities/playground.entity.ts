import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CourseEntity,
} from "./course.entity"
import {
    PlaygroundStepEntity,
} from "./playground-step.entity"
import {
    PlaygroundTranslationEntity,
} from "./playground-translation.entity"

/**
 * An in-course hands-on Docker/Kubernetes playground (e.g. "docker",
 * "kubernetes") owned by a course. A learner runs a local CLI agent that
 * pairs with a {@link PlaygroundSessionEntity} and works through the
 * playground's ordered {@link PlaygroundStepEntity} list.
 */
@ObjectType({
    description: "An in-course hands-on Docker/Kubernetes playground.",
})
@Index(["course"])
@Unique(["slug"])
@Entity("playgrounds")
export class PlaygroundEntity extends UuidAbstractEntity {
    /**
     * URL-facing stable identifier (e.g. "docker", "kubernetes").
     */
    @Field(
        () => String,
        {
            description: "URL-facing stable identifier for the playground.",
        },
    )
    @Column({
        name: "slug",
        type: "varchar",
        length: 128,
    })
        slug: string

    /**
     * Playground title shown on the course page.
     */
    @Field(
        () => String,
        {
            description: "Playground title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 255,
    })
        title: string

    /**
     * Short description of what the playground covers.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Short description of what the playground covers.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    /**
     * Icon shown next to the playground title (an emoji or an icon key).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Icon shown next to the playground title (emoji or icon key).",
        },
    )
    @Column({
        name: "icon",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        icon: string | null

    /**
     * Interaction kind driving the right-hand widget + verify family:
     * `terminal` (Docker/K8s — CLI agent + resource verify) or `rag`
     * (import code → ask → cite). Stored as varchar (NOT a PG enum) to dodge
     * the synchronize enum ADD-VALUE trap; legacy rows default to `terminal`.
     */
    @Field(
        () => String,
        {
            description: "Interaction kind for the playground (terminal | rag).",
        },
    )
    @Column({
        name: "kind",
        type: "varchar",
        length: 32,
        default: "terminal",
    })
        kind: string

    /**
     * Course this playground belongs to.
     */
    @Field(
        () => CourseEntity,
        {
            description: "Course this playground belongs to.",
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
        foreignKeyConstraintName: "fk_course_id_playgrounds_courses",
    })
        course: CourseEntity

    /**
     * Owning course ID.
     */
    @Field(
        () => ID,
        {
            description: "Owning course ID.",
        },
    )
    @RelationId(
        (playground: PlaygroundEntity) => playground.course,
    )
        courseId: string

    /**
     * Display order among the course's playgrounds.
     */
    @Field(
        () => Int,
        {
            description: "Display order among the course's playgrounds.",
        },
    )
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

    /**
     * Ordered steps belonging to this playground.
     */
    @Field(
        () => [PlaygroundStepEntity],
        {
            description: "Ordered steps belonging to this playground.",
        },
    )
    @OneToMany(
        () => PlaygroundStepEntity,
        (step: PlaygroundStepEntity) => step.playground,
        {
            cascade: true,
        },
    )
        steps: Array<PlaygroundStepEntity>

    /**
     * Localized overrides for playground fields (e.g. title, description).
     */
    @Field(
        () => [PlaygroundTranslationEntity],
        {
            description: "Localized overrides for playground fields (e.g. title, description).",
        },
    )
    @OneToMany(
        () => PlaygroundTranslationEntity,
        (translation: PlaygroundTranslationEntity) => translation.playground,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<PlaygroundTranslationEntity>
}
