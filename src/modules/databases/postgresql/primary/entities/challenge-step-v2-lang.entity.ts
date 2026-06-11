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
    ChallengeStepV2Entity,
} from "./challenge-step-v2.entity"
import {
    ChallengeStepV2LangTranslationEntity,
} from "./challenge-step-v2-lang-translation.entity"

/**
 * Per-programming-language row of a SCHEMA V2 step item. Default-locale `title` / `body` are stored
 * on this row; per-locale overrides live in {@link ChallengeStepV2LangTranslationEntity}.
 */
@ObjectType({
    description: "Per-language row of a V2 step item (title/body + per-locale translations).",
})
@Entity("challenge_step_v2_langs")
export class ChallengeStepV2LangEntity extends UuidAbstractEntity {
    /**
     * Programming language (e.g. typescript, java, csharp, go).
     */
    @Field(
        () => String,
        {
            description: "Programming language for this step content.",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 32,
    })
        lang: string

    /**
     * Display order of this programming-language bucket within the parent step item.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the parent step item's language list.",
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
     * Default locale for this language row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this language row.",
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
     * Default-locale step title for this programming language.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Default-locale step title for this programming language.",
        },
    )
    @Column({
        name: "title",
        type: "text",
        nullable: true,
    })
        title: string | null

    /**
     * Default-locale step body markdown for this programming language.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Default-locale step body for this programming language.",
        },
    )
    @Column({
        name: "body",
        type: "text",
        nullable: true,
    })
        body: string | null

    /**
     * Parent step item this language content belongs to.
     */
    @ManyToOne(
        () => ChallengeStepV2Entity,
        (stepV2: ChallengeStepV2Entity) => stepV2.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_step_v2_id",
        foreignKeyConstraintName: "fk_step_v2_lang_challenge_steps_v2",
    })
        stepV2: ChallengeStepV2Entity

    /**
     * Parent step item ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent step item ID.",
        },
    )
    @RelationId(
        (lang: ChallengeStepV2LangEntity) => lang.stepV2,
    )
        stepV2Id: string

    /**
     * Per-locale body overrides for this language content.
     */
    @Field(
        () => [ChallengeStepV2LangTranslationEntity],
        {
            description: "Per-locale body overrides for this language content.",
        },
    )
    @OneToMany(
        () => ChallengeStepV2LangTranslationEntity,
        (translation: ChallengeStepV2LangTranslationEntity) => translation.lang,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengeStepV2LangTranslationEntity>
}
