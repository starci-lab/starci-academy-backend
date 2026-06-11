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
    ChallengeOutputV2Entity,
} from "./challenge-output-v2.entity"
import {
    ChallengeOutputV2LangTranslationEntity,
} from "./challenge-output-v2-lang-translation.entity"

/**
 * Per-programming-language row of a SCHEMA V2 output item. The default-locale `text` is stored on
 * this row; per-locale overrides live in {@link ChallengeOutputV2LangTranslationEntity}.
 */
@ObjectType({
    description: "Per-language row of a V2 output item (text + per-locale translations).",
})
@Entity("challenge_output_v2_langs")
export class ChallengeOutputV2LangEntity extends UuidAbstractEntity {
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
        () => ChallengeOutputV2Entity,
        (outputV2: ChallengeOutputV2Entity) => outputV2.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_output_v2_id",
        foreignKeyConstraintName: "fk_output_v2_lang_challenge_outputs_v2",
    })
        outputV2: ChallengeOutputV2Entity

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
        (lang: ChallengeOutputV2LangEntity) => lang.outputV2,
    )
        outputV2Id: string

    /**
     * Per-locale text overrides for this language content.
     */
    @Field(
        () => [ChallengeOutputV2LangTranslationEntity],
        {
            description: "Per-locale text overrides for this language content.",
        },
    )
    @OneToMany(
        () => ChallengeOutputV2LangTranslationEntity,
        (translation: ChallengeOutputV2LangTranslationEntity) => translation.lang,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengeOutputV2LangTranslationEntity>
}
