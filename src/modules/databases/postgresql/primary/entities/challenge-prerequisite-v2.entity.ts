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
    ChallengePrerequisiteV2LangEntity,
} from "./challenge-prerequisite-v2-lang.entity"

/**
 * SCHEMA V2 prerequisite ITEM for a challenge (normalized — no jsonb). One row per prerequisite
 * position; the per-language `text` lives under {@link ChallengePrerequisiteV2LangEntity}.
 * Prerequisites carry no item-level title, so there is no item translation table.
 */
@ObjectType({
    description: "A SCHEMA V2 challenge prerequisite item (one per position).",
})
@Entity("challenge_prerequisites_v2")
export class ChallengePrerequisiteV2Entity extends UuidAbstractEntity {
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
        (challenge: ChallengeEntity) => challenge.prerequisitesV2,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_challenge_prerequisites_v2_challenges",
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
        (prerequisiteV2: ChallengePrerequisiteV2Entity) => prerequisiteV2.challenge,
    )
        challengeId: string

    /**
     * Per-programming-language content (text) for this prerequisite.
     */
    @Field(
        () => [ChallengePrerequisiteV2LangEntity],
        {
            description: "Per-programming-language content for this prerequisite.",
        },
    )
    @OneToMany(
        () => ChallengePrerequisiteV2LangEntity,
        (lang: ChallengePrerequisiteV2LangEntity) => lang.prerequisiteV2,
        {
            cascade: true,
        },
    )
        langs: Array<ChallengePrerequisiteV2LangEntity>
}
