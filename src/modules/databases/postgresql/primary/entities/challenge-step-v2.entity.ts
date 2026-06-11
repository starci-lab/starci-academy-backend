import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ChallengeEntity,
} from "./challenge.entity"
import {
    ChallengeStepV2LangEntity,
} from "./challenge-step-v2-lang.entity"

/**
 * SCHEMA V2 step ITEM for a challenge (normalized — no jsonb). One row per step position;
 * per-programming-language `title` and `body` live under {@link ChallengeStepV2LangEntity}.
 */
@ObjectType({
    description: "A SCHEMA V2 challenge step item (one per position).",
})
@Entity("challenge_steps_v2")
export class ChallengeStepV2Entity extends UuidAbstractEntity {
    /**
     * Display order of this step within the challenge (agnostic position).
     */
    @Field(
        () => Int,
        {
            description: "Display order of this step within the challenge.",
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
     * Default locale for this step item.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this step item.",
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
     * Parent challenge this step belongs to.
     */
    @ManyToOne(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.stepsV2,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_challenge_steps_v2_challenges",
    })
        challenge: ChallengeEntity

    /**
     * Parent challenge ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent challenge ID.",
        },
    )
    @RelationId(
        (stepV2: ChallengeStepV2Entity) => stepV2.challenge,
    )
        challengeId: string

    /**
     * Per-programming-language content (title + body) for this step.
     */
    @Field(
        () => [ChallengeStepV2LangEntity],
        {
            description: "Per-programming-language content for this step.",
        },
    )
    @OneToMany(
        () => ChallengeStepV2LangEntity,
        (lang: ChallengeStepV2LangEntity) => lang.stepV2,
        {
            cascade: true,
        },
    )
        langs: Array<ChallengeStepV2LangEntity>
}
