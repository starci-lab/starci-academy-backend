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
    ChallengeOutputLangEntity,
} from "./challenge-output-lang.entity"

@ObjectType({
    description: "A SCHEMA V2 challenge output item (one per position).",
})
@Entity("challenge_outputs")
/**
 * SCHEMA V2 output ITEM for a challenge (normalized -- no jsonb). One row per output position; the
 * per-language `text` lives under {@link ChallengeOutputLangEntity}. Outputs carry no item-level
 * title, so there is no item translation table.
 */
export class ChallengeOutputEntity extends UuidAbstractEntity {
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
        (challenge: ChallengeEntity) => challenge.outputs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_challenge_outputs_challenges",
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
        (output: ChallengeOutputEntity) => output.challenge,
    )
        challengeId: string

    /**
     * Per-programming-language content (text) for this output.
     */
    @Field(
        () => [ChallengeOutputLangEntity],
        {
            description: "Per-programming-language content for this output.",
        },
    )
    @OneToMany(
        () => ChallengeOutputLangEntity,
        (lang: ChallengeOutputLangEntity) => lang.output,
        {
            cascade: true,
        },
    )
        langs: Array<ChallengeOutputLangEntity>
}
