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
    ChallengeOutputV2LangEntity,
} from "./challenge-output-v2-lang.entity"

/**
 * SCHEMA V2 output ITEM for a challenge (normalized — no jsonb). One row per output position; the
 * per-language `text` lives under {@link ChallengeOutputV2LangEntity}. Outputs carry no item-level
 * title, so there is no item translation table.
 */
@ObjectType({
    description: "A SCHEMA V2 challenge output item (one per position).",
})
@Entity("challenge_outputs_v2")
export class ChallengeOutputV2Entity extends UuidAbstractEntity {
    /**
     * Display order of this output within the challenge (agnostic position).
     */
    @Field(
        () => Int,
        {
            description: "Display order of this output within the challenge.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this output item.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this output item.",
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
     * Parent challenge this output belongs to.
     */
    @ManyToOne(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.outputsV2,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_challenge_outputs_v2_challenges",
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
        (outputV2: ChallengeOutputV2Entity) => outputV2.challenge,
    )
        challengeId: string

    /**
     * Per-programming-language content (text) for this output.
     */
    @Field(
        () => [ChallengeOutputV2LangEntity],
        {
            description: "Per-programming-language content for this output.",
        },
    )
    @OneToMany(
        () => ChallengeOutputV2LangEntity,
        (lang: ChallengeOutputV2LangEntity) => lang.outputV2,
        {
            cascade: true,
        },
    )
        langs: Array<ChallengeOutputV2LangEntity>
}
