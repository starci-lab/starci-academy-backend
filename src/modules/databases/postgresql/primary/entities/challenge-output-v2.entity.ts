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
    ChallengeOutputV2TranslationEntity,
} from "./challenge-output-v2-translation.entity"

/**
 * SCHEMA V2 per-language output bucket for a challenge.
 * One row per programming language; the jsonb `data` holds the default locale and per-locale
 * variants live in the translation table.
 */
@ObjectType({
    description: "Per-language challenge output bucket (V2); per-locale jsonb in the translation table.",
})
@Entity("challenge_outputs_v2")
export class ChallengeOutputV2Entity extends UuidAbstractEntity {
    /**
     * Programming language (e.g. typescript, java, csharp, go).
     */
    @Field(
        () => String,
        {
            description: "Programming language for this output bucket (e.g. typescript, java, csharp, go).",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 32,
    })
        lang: string

    /**
     * Display order within the challenge output V2 list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the challenge output V2 list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default-locale output payload (array of items) stored as jsonb; per-locale variants live in
     * {@link translations}.
     */
    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Default-locale output payload (array of items) stored as jsonb.",
        },
    )
    @Column({
        name: "data",
        type: "jsonb",
        nullable: true,
    })
        data: Array<Record<string, unknown>> | null

    /**
     * Default locale for this output bucket row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this output bucket row.",
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
     * Parent challenge this output bucket belongs to.
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
        (challengeOutputV2: ChallengeOutputV2Entity) => challengeOutputV2.challenge,
    )
        challengeId: string

    /**
     * Per-locale output jsonb payloads for this bucket.
     */
    @Field(
        () => [ChallengeOutputV2TranslationEntity],
        {
            description: "Per-locale output jsonb payloads for this bucket.",
        },
    )
    @OneToMany(
        () => ChallengeOutputV2TranslationEntity,
        (translation: ChallengeOutputV2TranslationEntity) => translation.challengeOutputV2,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeOutputV2TranslationEntity>
}
