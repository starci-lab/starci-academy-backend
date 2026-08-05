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
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    PlaygroundEntity,
} from "./playground.entity"
import {
    PlaygroundStepTranslationEntity,
} from "./playground-step-translation.entity"

@ObjectType({
    description: "One ordered step of a playground.",
})
@Index(["playground"])
@Entity("playground_steps")
/**
 * One ordered step of a {@link PlaygroundEntity}. Carries the learner-facing
 * instructions (`title`/`body`/`commandHint`) plus the server-only "lite"
 * verify pattern matched against the agent's self-reported resource list
 * (`verifyResourceKind`/`verifyResourceNamePattern`/`verifyExpectedStatus`) --
 * the verify fields are never exposed to GraphQL clients.
 */
export class PlaygroundStepEntity extends UuidAbstractEntity {
    /**
     * Playground this step belongs to.
     */
    @Field(
        () => PlaygroundEntity,
        {
            description: "Playground this step belongs to.",
        },
    )
    @ManyToOne(
        () => PlaygroundEntity,
        (playground: PlaygroundEntity) => playground.steps,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "playground_id",
        foreignKeyConstraintName: "fk_playground_id_playground_steps_playgrounds",
    })
        playground: PlaygroundEntity

    /**
     * Owning playground ID.
     */
    @Field(
        () => ID,
        {
            description: "Owning playground ID.",
        },
    )
    @RelationId(
        (step: PlaygroundStepEntity) => step.playground,
    )
        playgroundId: string

    /**
     * Display order within the playground's step list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the playground's step list.",
        },
    )
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

    /**
     * Step title.
     */
    @Field(
        () => String,
        {
            description: "Step title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 255,
    })
        title: string

    /**
     * Step instructions body (markdown).
     */
    @Field(
        () => String,
        {
            description: "Step instructions body (markdown).",
        },
    )
    @Column({
        name: "body",
        type: "text",
    })
        body: string

    /**
     * Sample command shown to the student for this step.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Sample command shown to the student for this step.",
        },
    )
    @Column({
        name: "command_hint",
        type: "text",
        nullable: true,
    })
        commandHint: string | null

    /**
     * RAG-kind counterpart of {@link commandHint}: the learner-facing action to
     * perform in the right-hand widget (e.g. "Paste sample code into the left pane then
     * click Load"). Null for `terminal` steps (which use {@link commandHint}).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Sample action shown to the student for a RAG-kind step.",
        },
    )
    @Column({
        name: "action_hint",
        type: "text",
        nullable: true,
    })
        actionHint: string | null

    /**
     * RAG-kind verify predicate (`imported` | `asked` | `answered`) checked
     * against the paired RAG session state. Null for `terminal` steps (which use
     * the `verifyResource*` triple). Server-only -- NOT exposed via GraphQL.
     */
    @Column({
        name: "verify_kind",
        type: "varchar",
        length: 32,
        nullable: true,
    })
        verifyKind: string | null

    /**
     * Resource kind to match against the agent's self-reported resource list
     * (e.g. "Pod", "Deployment", "Service", "Container", "Image"). Server-only --
     * NOT exposed via GraphQL.
     */
    @Column({
        name: "verify_resource_kind",
        type: "varchar",
        length: 64,
    })
        verifyResourceKind: string

    /**
     * Substring/prefix matched against the reported resource name (empty string
     * matches any name). Server-only -- NOT exposed via GraphQL.
     */
    @Column({
        name: "verify_resource_name_pattern",
        type: "varchar",
        length: 255,
    })
        verifyResourceNamePattern: string

    /**
     * Expected reported status (e.g. "Running"); null = existence check only.
     * Server-only -- NOT exposed via GraphQL.
     */
    @Column({
        name: "verify_expected_status",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        verifyExpectedStatus: string | null

    /**
     * Localized overrides for playground step fields (e.g. title, body).
     */
    @Field(
        () => [PlaygroundStepTranslationEntity],
        {
            description: "Localized overrides for playground step fields (e.g. title, body).",
        },
    )
    @OneToMany(
        () => PlaygroundStepTranslationEntity,
        (translation: PlaygroundStepTranslationEntity) => translation.playgroundStep,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<PlaygroundStepTranslationEntity>
}
