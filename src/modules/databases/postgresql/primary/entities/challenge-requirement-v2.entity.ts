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
    GraphQLJSON,
} from "graphql-type-json"
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

/**
 * SCHEMA V2 per-language requirement bucket for a challenge.
 * One row per (locale × programming language); the jsonb `data` payload holds a single locale's text.
 */
@ObjectType({
    description: "Per-(locale × language) challenge requirement bucket (V2); single-locale jsonb payload.",
})
@Entity("challenge_requirements_v2")
export class ChallengeRequirementV2Entity extends UuidAbstractEntity {
    /**
     * Programming language (e.g. typescript, java, csharp, go).
     */
    @Field(
        () => String,
        {
            description: "Programming language for this requirement bucket (e.g. typescript, java, csharp, go).",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 32,
    })
        lang: string

    /**
     * Display order within the challenge requirement V2 list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the challenge requirement V2 list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default-locale requirement payload (array of items) stored as jsonb; per-locale variants
     * live in {@link translations}.
     */
    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Default-locale requirement payload (array of items) stored as jsonb.",
        },
    )
    @Column({
        name: "data",
        type: "jsonb",
        nullable: true,
    })
        data: Array<Record<string, unknown>> | null

    /**
     * Default locale for this requirement bucket row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this requirement bucket row.",
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
     * Parent challenge this requirement bucket belongs to.
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
        (challengeRequirementV2: ChallengeRequirementV2Entity) => challengeRequirementV2.challenge,
    )
        challengeId: string

    /**
     * Per-locale requirement jsonb payloads for this bucket.
     */
    @Field(
        () => [ChallengeRequirementV2TranslationEntity],
        {
            description: "Per-locale requirement jsonb payloads for this bucket.",
        },
    )
    @OneToMany(
        () => ChallengeRequirementV2TranslationEntity,
        (translation: ChallengeRequirementV2TranslationEntity) => translation.challengeRequirementV2,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeRequirementV2TranslationEntity>
}
