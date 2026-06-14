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
    ChallengeOutputEntity,
} from "./challenge-output.entity"
import {
    ChallengeOutputLangTranslationEntity,
} from "./challenge-output-lang-translation.entity"

/**
 * Per-programming-language row of a SCHEMA V2 output item. The default-locale `text` is stored on
 * this row; per-locale overrides live in {@link ChallengeOutputLangTranslationEntity}.
 */
@ObjectType({
    description: "Per-language row of a V2 output item (text + per-locale translations).",
})
@Entity("challenge_output_langs")
export class ChallengeOutputLangEntity extends UuidAbstractEntity {
    /**
     * Programming language (e.g. typescript, java, csharp, go).
     */
    @Field(
        () => String,
        {
            description: "Programming language for this output content.",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 32,
    })
        lang: string

    /**
     * Display order of this programming-language bucket within the parent output item.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the parent output item's language list.",
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
     * Default-locale output text for this programming language.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Default-locale output text for this programming language.",
        },
    )
    @Column({
        name: "text",
        type: "text",
        nullable: true,
    })
        text: string | null

    /**
     * Parent output item this language content belongs to.
     */
    @ManyToOne(
        () => ChallengeOutputEntity,
        (output: ChallengeOutputEntity) => output.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_output_id",
        foreignKeyConstraintName: "fk_output_v2_lang_challenge_outputs",
    })
        output: ChallengeOutputEntity

    /**
     * Parent output item ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent output item ID.",
        },
    )
    @RelationId(
        (lang: ChallengeOutputLangEntity) => lang.output,
    )
        outputId: string

    /**
     * Per-locale text overrides for this language content.
     */
    @Field(
        () => [ChallengeOutputLangTranslationEntity],
        {
            description: "Per-locale text overrides for this language content.",
        },
    )
    @OneToMany(
        () => ChallengeOutputLangTranslationEntity,
        (translation: ChallengeOutputLangTranslationEntity) => translation.lang,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengeOutputLangTranslationEntity>
}
