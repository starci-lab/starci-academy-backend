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
    ChallengePrerequisiteEntity,
} from "./challenge-prerequisite.entity"
import {
    ChallengePrerequisiteLangTranslationEntity,
} from "./challenge-prerequisite-lang-translation.entity"

/**
 * Per-programming-language row of a SCHEMA V2 prerequisite item. The default-locale `text` is stored
 * on this row; per-locale overrides live in {@link ChallengePrerequisiteLangTranslationEntity}.
 */
@ObjectType({
    description: "Per-language row of a V2 prerequisite item (text + per-locale translations).",
})
@Entity("challenge_prerequisite_langs")
export class ChallengePrerequisiteLangEntity extends UuidAbstractEntity {
    /**
     * Programming language (e.g. typescript, java, csharp, go).
     */
    @Field(
        () => String,
        {
            description: "Programming language for this prerequisite content.",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 32,
    })
        lang: string

    /**
     * Display order of this programming-language bucket within the parent prerequisite item.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the parent prerequisite item's language list.",
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
     * Default-locale prerequisite text for this programming language.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Default-locale prerequisite text for this programming language.",
        },
    )
    @Column({
        name: "text",
        type: "text",
        nullable: true,
    })
        text: string | null

    /**
     * Parent prerequisite item this language content belongs to.
     */
    @ManyToOne(
        () => ChallengePrerequisiteEntity,
        (prerequisite: ChallengePrerequisiteEntity) => prerequisite.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_prerequisite_id",
        foreignKeyConstraintName: "fk_prereq_v2_lang_challenge_prerequisites",
    })
        prerequisite: ChallengePrerequisiteEntity

    /**
     * Parent prerequisite item ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent prerequisite item ID.",
        },
    )
    @RelationId(
        (lang: ChallengePrerequisiteLangEntity) => lang.prerequisite,
    )
        prerequisiteId: string

    /**
     * Per-locale text overrides for this language content.
     */
    @Field(
        () => [ChallengePrerequisiteLangTranslationEntity],
        {
            description: "Per-locale text overrides for this language content.",
        },
    )
    @OneToMany(
        () => ChallengePrerequisiteLangTranslationEntity,
        (translation: ChallengePrerequisiteLangTranslationEntity) => translation.lang,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengePrerequisiteLangTranslationEntity>
}
