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
    ChallengeRequirementEntity,
} from "./challenge-requirement.entity"
import {
    ChallengeRequirementLangTranslationEntity,
} from "./challenge-requirement-lang-translation.entity"

@ObjectType({
    description: "Per-language content of a V2 requirement item (score + title/body + translations).",
})
@Entity("challenge_requirement_langs")
/**
 * Per-programming-language content of a SCHEMA V2 requirement item: non-localized `score` plus
 * default-locale `title` / `body`; per-locale overrides live in
 * {@link ChallengeRequirementLangTranslationEntity}.
 */
export class ChallengeRequirementLangEntity extends UuidAbstractEntity {
    /**
     * Programming language (e.g. typescript, java, csharp, go).
     */
    @Field(
        () => String,
        {
            description: "Programming language for this requirement content.",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 32,
    })
        lang: string

    /**
     * Display order of this programming-language bucket within the parent requirement item.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the parent requirement item's language list.",
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
     * Points / weight for this requirement in this language (non-localized).
     */
    @Field(
        () => Int,
        {
            description: "Points / weight for this requirement in this language.",
        },
    )
    @Column({
        name: "score",
        type: "int",
        default: 0,
    })
        score: number

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
     * Default-locale requirement title for this programming language.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Default-locale requirement title for this programming language.",
        },
    )
    @Column({
        name: "title",
        type: "text",
        nullable: true,
    })
        title: string | null

    /**
     * Default-locale requirement body markdown for this programming language.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Default-locale requirement body for this programming language.",
        },
    )
    @Column({
        name: "body",
        type: "text",
        nullable: true,
    })
        body: string | null

    /**
     * Parent requirement item this language content belongs to.
     */
    @ManyToOne(
        () => ChallengeRequirementEntity,
        (requirement: ChallengeRequirementEntity) => requirement.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_requirement_id",
        foreignKeyConstraintName: "fk_req_v2_lang_challenge_requirements",
    })
        requirement: ChallengeRequirementEntity

    /**
     * Parent requirement item ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent requirement item ID.",
        },
    )
    @RelationId(
        (lang: ChallengeRequirementLangEntity) => lang.requirement,
    )
        requirementId: string

    /**
     * Per-locale body overrides for this language content.
     */
    @Field(
        () => [ChallengeRequirementLangTranslationEntity],
        {
            description: "Per-locale body overrides for this language content.",
        },
    )
    @OneToMany(
        () => ChallengeRequirementLangTranslationEntity,
        (translation: ChallengeRequirementLangTranslationEntity) => translation.lang,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengeRequirementLangTranslationEntity>
}
