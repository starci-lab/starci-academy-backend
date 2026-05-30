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
    ChallengeRequirementV2TranslationEntity,
} from "./challenge-requirement-v2-translation.entity"
import {
    ChallengeRequirementV2LangEntity,
} from "./challenge-requirement-v2-lang.entity"

/**
 * SCHEMA V2 requirement ITEM for a challenge (normalized — no jsonb). One row per requirement
 * position. The language-agnostic `title` is localized via
 * {@link ChallengeRequirementV2TranslationEntity}; the per-programming-language `score` + `body`
 * live under {@link ChallengeRequirementV2LangEntity}.
 */
@ObjectType({
    description: "A SCHEMA V2 challenge requirement item (one per position).",
})
@Entity("challenge_requirements_v2")
export class ChallengeRequirementV2Entity extends UuidAbstractEntity {
    /**
     * Display order of this requirement within the challenge (agnostic position).
     */
    @Field(
        () => Int,
        {
            description: "Display order of this requirement within the challenge.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this requirement item.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this requirement item.",
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
     * Parent challenge this requirement belongs to.
     */
    @ManyToOne(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.requirementsV2,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_challenge_requirements_v2_challenges",
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
        (requirementV2: ChallengeRequirementV2Entity) => requirementV2.challenge,
    )
        challengeId: string

    /**
     * Per-locale title overrides (the title is agnostic across programming languages).
     */
    @Field(
        () => [ChallengeRequirementV2TranslationEntity],
        {
            description: "Per-locale title overrides for this requirement item.",
        },
    )
    @OneToMany(
        () => ChallengeRequirementV2TranslationEntity,
        (translation: ChallengeRequirementV2TranslationEntity) => translation.requirementV2,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengeRequirementV2TranslationEntity>

    /**
     * Per-programming-language content (score + body) for this requirement.
     */
    @Field(
        () => [ChallengeRequirementV2LangEntity],
        {
            description: "Per-programming-language content for this requirement.",
        },
    )
    @OneToMany(
        () => ChallengeRequirementV2LangEntity,
        (lang: ChallengeRequirementV2LangEntity) => lang.requirementV2,
        {
            cascade: true,
        },
    )
        langs: Array<ChallengeRequirementV2LangEntity>
}
