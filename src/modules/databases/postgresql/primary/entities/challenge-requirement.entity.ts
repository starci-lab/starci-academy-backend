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
    ChallengeRequirementLangEntity,
} from "./challenge-requirement-lang.entity"

@ObjectType({
    description: "A SCHEMA V2 challenge requirement item (one per position).",
})
@Entity("challenge_requirements")
/**
 * SCHEMA V2 requirement ITEM for a challenge (normalized — no jsonb). One row per requirement
 * position; per-programming-language `score`, `title`, and `body` live under
 * {@link ChallengeRequirementLangEntity}.
 */
export class ChallengeRequirementEntity extends UuidAbstractEntity {
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
        (challenge: ChallengeEntity) => challenge.requirements,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_challenge_requirements_challenges",
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
        (requirement: ChallengeRequirementEntity) => requirement.challenge,
    )
        challengeId: string

    /**
     * Per-programming-language content (score + title + body) for this requirement.
     */
    @Field(
        () => [ChallengeRequirementLangEntity],
        {
            description: "Per-programming-language content for this requirement.",
        },
    )
    @OneToMany(
        () => ChallengeRequirementLangEntity,
        (lang: ChallengeRequirementLangEntity) => lang.requirement,
        {
            cascade: true,
        },
    )
        langs: Array<ChallengeRequirementLangEntity>
}
