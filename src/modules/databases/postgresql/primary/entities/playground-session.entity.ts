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
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    PlaygroundEntity,
} from "./playground.entity"
import {
    GraphQLTypePlaygroundSessionMode,
    PlaygroundSessionMode,
} from "../enums"

/**
 * One learner's run of a {@link PlaygroundEntity}. The learner's browser
 * shows `pairingCode`; the CLI agent pairs with it over Socket.IO
 * (`/playground_byom` namespace), flipping `connected` to true and joining
 * the room keyed by this row's id. Progress (`currentStepIndex`,
 * `passedStepIndexes`) is advanced by the "lite" resource-report verify.
 */
@ObjectType({
    description: "One learner's run of a playground.",
})
@Index(["user"])
@Index(["playground"])
@Unique(["pairingCode"])
@Entity("playground_sessions")
export class PlaygroundSessionEntity extends UuidAbstractEntity {
    /**
     * Learner running this session.
     */
    @Field(
        () => UserEntity,
        {
            description: "Learner running this session.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_playground_sessions_users",
    })
        user: UserEntity

    /**
     * Owning user ID.
     */
    @Field(
        () => ID,
        {
            description: "Owning user ID.",
        },
    )
    @RelationId(
        (session: PlaygroundSessionEntity) => session.user,
    )
        userId: string

    /**
     * Playground this session runs.
     */
    @Field(
        () => PlaygroundEntity,
        {
            description: "Playground this session runs.",
        },
    )
    @ManyToOne(
        () => PlaygroundEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "playground_id",
        foreignKeyConstraintName: "fk_playground_id_playground_sessions_playgrounds",
    })
        playground: PlaygroundEntity

    /**
     * Target playground ID.
     */
    @Field(
        () => ID,
        {
            description: "Target playground ID.",
        },
    )
    @RelationId(
        (session: PlaygroundSessionEntity) => session.playground,
    )
        playgroundId: string

    /**
     * How much scaffolding this session gives the learner — "guided" (default,
     * step `commandHint`s shown) or "free" (hints redacted server-side, see
     * {@link PlaygroundSessionMode}). Row count was 0 at the time this column
     * was added, so it is safe as NOT NULL with a default.
     */
    @Field(
        () => GraphQLTypePlaygroundSessionMode,
        {
            description: "How much scaffolding this session gives the learner (guided / free).",
        },
    )
    @Column({
        name: "mode",
        type: "enum",
        enum: PlaygroundSessionMode,
        enumName: "playground_session_mode",
        default: PlaygroundSessionMode.Guided,
    })
        mode: PlaygroundSessionMode

    /**
     * Short random code (e.g. 6 chars) the learner types into the CLI agent to
     * pair it with this session.
     */
    @Field(
        () => String,
        {
            description: "Short pairing code the CLI agent uses to join this session.",
        },
    )
    @Column({
        name: "pairing_code",
        // holds a UUID (36 chars) — the pairing code is `randomUUID()` (unguessable,
        // no brute-force). Widened from the old short-code length via `synchronize`.
        type: "varchar",
        length: 36,
    })
        pairingCode: string

    /**
     * Whether the CLI agent has paired with this session.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the CLI agent has paired with this session.",
        },
    )
    @Column({
        name: "connected",
        type: "boolean",
        default: false,
    })
        connected: boolean

    /**
     * Index (into the playground's ordered steps) of the step the learner is
     * currently working on.
     */
    @Field(
        () => Int,
        {
            description: "Index of the step the learner is currently working on.",
        },
    )
    @Column({
        name: "current_step_index",
        type: "int",
        default: 0,
    })
        currentStepIndex: number

    /**
     * Step indexes verified as passed so far (append-only, deduplicated).
     */
    @Field(
        () => [Int],
        {
            description: "Step indexes verified as passed so far.",
        },
    )
    @Column({
        name: "passed_step_indexes",
        type: "jsonb",
        default: () => "'[]'::jsonb",
    })
        passedStepIndexes: Array<number>
}
