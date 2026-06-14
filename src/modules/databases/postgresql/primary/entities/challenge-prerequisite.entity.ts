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
    ChallengePrerequisiteLangEntity,
} from "./challenge-prerequisite-lang.entity"

/**
 * SCHEMA V2 prerequisite ITEM for a challenge (normalized — no jsonb). One row per prerequisite
 * position; the per-language `text` lives under {@link ChallengePrerequisiteLangEntity}.
 * Prerequisites carry no item-level title, so there is no item translation table.
 */
@ObjectType({
    description: "A SCHEMA V2 challenge prerequisite item (one per position).",
})
@Entity("challenge_prerequisites")
export class ChallengePrerequisiteEntity extends UuidAbstractEntity {
    /**
     * Display order of this prerequisite within the challenge (agnostic position).
     */
    @Field(
        () => Int,
        {
            description: "Display order of this prerequisite within the challenge.",
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
     * Default locale for this prerequisite item.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this prerequisite item.",
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
     * Parent challenge this prerequisite belongs to.
     */
    @ManyToOne(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.prerequisites,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_challenge_prerequisites_challenges",
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
        (prerequisite: ChallengePrerequisiteEntity) => prerequisite.challenge,
    )
        challengeId: string

    /**
     * Per-programming-language content (text) for this prerequisite.
     */
    @Field(
        () => [ChallengePrerequisiteLangEntity],
        {
            description: "Per-programming-language content for this prerequisite.",
        },
    )
    @OneToMany(
        () => ChallengePrerequisiteLangEntity,
        (lang: ChallengePrerequisiteLangEntity) => lang.prerequisite,
        {
            cascade: true,
        },
    )
        langs: Array<ChallengePrerequisiteLangEntity>
}
