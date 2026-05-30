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
    ChallengeStepV2TranslationEntity,
} from "./challenge-step-v2-translation.entity"

/**
 * SCHEMA V2 per-language step bucket for a challenge.
 * One row per (locale × programming language); the jsonb `data` payload holds a single locale's text.
 */
@ObjectType({
    description: "Per-(locale × language) challenge step bucket (V2); single-locale jsonb payload.",
})
@Entity("challenge_steps_v2")
export class ChallengeStepV2Entity extends UuidAbstractEntity {
    /**
     * Programming language (e.g. typescript, java, csharp, go).
     */
    @Field(
        () => String,
        {
            description: "Programming language for this step bucket (e.g. typescript, java, csharp, go).",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 32,
    })
        lang: string

    /**
     * Display order within the challenge step V2 list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the challenge step V2 list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default-locale step payload (array of items) stored as jsonb; per-locale variants live in
     * {@link translations}.
     */
    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Default-locale step payload (array of items) stored as jsonb.",
        },
    )
    @Column({
        name: "data",
        type: "jsonb",
        nullable: true,
    })
        data: Array<Record<string, unknown>> | null

    /**
     * Default locale for this step bucket row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this step bucket row.",
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
     * Parent challenge this step bucket belongs to.
     */
    @ManyToOne(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.stepsV2,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_challenge_steps_v2_challenges",
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
        (challengeStepV2: ChallengeStepV2Entity) => challengeStepV2.challenge,
    )
        challengeId: string

    /**
     * Per-locale step jsonb payloads for this bucket.
     */
    @Field(
        () => [ChallengeStepV2TranslationEntity],
        {
            description: "Per-locale step jsonb payloads for this bucket.",
        },
    )
    @OneToMany(
        () => ChallengeStepV2TranslationEntity,
        (translation: ChallengeStepV2TranslationEntity) => translation.challengeStepV2,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeStepV2TranslationEntity>
}
