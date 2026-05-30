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
    ChallengeOutputV2TranslationEntity,
} from "./challenge-output-v2-translation.entity"
import {
    ChallengeOutputV2LangEntity,
} from "./challenge-output-v2-lang.entity"

/**
 * SCHEMA V2 output ITEM for a challenge (normalized — no jsonb). One row per output position; the
 * per-language `body` lives under {@link ChallengeOutputV2LangEntity}. Outputs have no title, so the
 * item-level {@link ChallengeOutputV2TranslationEntity} title stays null (kept for table uniformity).
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
     * Per-locale title overrides (null for outputs; kept for table uniformity).
     */
    @Field(
        () => [ChallengeOutputV2TranslationEntity],
        {
            description: "Per-locale title overrides for this output item.",
        },
    )
    @OneToMany(
        () => ChallengeOutputV2TranslationEntity,
        (translation: ChallengeOutputV2TranslationEntity) => translation.outputV2,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengeOutputV2TranslationEntity>

    /**
     * Per-programming-language content (body) for this output.
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
