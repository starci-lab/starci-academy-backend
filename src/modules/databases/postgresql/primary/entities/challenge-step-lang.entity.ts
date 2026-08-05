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
} from "../enums/locale"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ChallengeStepEntity,
} from "./challenge-step.entity"
import {
    ChallengeStepLangTranslationEntity,
} from "./challenge-step-lang-translation.entity"

@ObjectType({
    description: "Per-language row of a V2 step item (title/body + per-locale translations).",
})
@Entity("challenge_step_langs")
/**
 * Per-programming-language row of a SCHEMA V2 step item. Default-locale `title` / `body` are stored
 * on this row; per-locale overrides live in {@link ChallengeStepLangTranslationEntity}.
 */
export class ChallengeStepLangEntity extends UuidAbstractEntity {
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
        () => ChallengeStepEntity,
        (step: ChallengeStepEntity) => step.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_step_id",
        foreignKeyConstraintName: "fk_step_v2_lang_challenge_steps",
    })
        step: ChallengeStepEntity

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
        (lang: ChallengeStepLangEntity) => lang.step,
    )
        stepId: string

    /**
     * Per-locale body overrides for this language content.
     */
    @Field(
        () => [ChallengeStepLangTranslationEntity],
        {
            description: "Per-locale body overrides for this language content.",
        },
    )
    @OneToMany(
        () => ChallengeStepLangTranslationEntity,
        (translation: ChallengeStepLangTranslationEntity) => translation.lang,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengeStepLangTranslationEntity>
}
