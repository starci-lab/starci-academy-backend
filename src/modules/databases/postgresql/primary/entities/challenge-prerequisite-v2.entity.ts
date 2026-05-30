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
    ChallengePrerequisiteV2TranslationEntity,
} from "./challenge-prerequisite-v2-translation.entity"

/**
 * SCHEMA V2 per-language prerequisite bucket for a challenge.
 * One row per programming language; the jsonb `data` holds the default locale and per-locale
 * variants live in the translation table.
 */
@ObjectType({
    description: "Per-language challenge prerequisite bucket (V2); per-locale jsonb in the translation table.",
})
@Entity("challenge_prerequisites_v2")
export class ChallengePrerequisiteV2Entity extends UuidAbstractEntity {
    /**
     * Programming language (e.g. typescript, java, csharp, go).
     */
    @Field(
        () => String,
        {
            description: "Programming language for this prerequisite bucket (e.g. typescript, java, csharp, go).",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 32,
    })
        lang: string

    /**
     * Display order within the challenge prerequisite V2 list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the challenge prerequisite V2 list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default-locale prerequisite payload (array of items) stored as jsonb; per-locale variants
     * live in {@link translations}.
     */
    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Default-locale prerequisite payload (array of items) stored as jsonb.",
        },
    )
    @Column({
        name: "data",
        type: "jsonb",
        nullable: true,
    })
        data: Array<Record<string, unknown>> | null

    /**
     * Default locale for this prerequisite bucket row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this prerequisite bucket row.",
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
     * Parent challenge this prerequisite bucket belongs to.
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
        (challengePrerequisiteV2: ChallengePrerequisiteV2Entity) => challengePrerequisiteV2.challenge,
    )
        challengeId: string

    /**
     * Per-locale prerequisite jsonb payloads for this bucket.
     */
    @Field(
        () => [ChallengePrerequisiteV2TranslationEntity],
        {
            description: "Per-locale prerequisite jsonb payloads for this bucket.",
        },
    )
    @OneToMany(
        () => ChallengePrerequisiteV2TranslationEntity,
        (translation: ChallengePrerequisiteV2TranslationEntity) => translation.challengePrerequisiteV2,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengePrerequisiteV2TranslationEntity>
}
