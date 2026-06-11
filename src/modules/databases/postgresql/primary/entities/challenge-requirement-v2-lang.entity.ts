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
    ChallengeRequirementV2Entity,
} from "./challenge-requirement-v2.entity"
import {
    ChallengeRequirementV2LangTranslationEntity,
} from "./challenge-requirement-v2-lang-translation.entity"

/**
 * Per-programming-language content of a SCHEMA V2 requirement item: non-localized `score` plus
 * default-locale `title` / `body`; per-locale overrides live in
 * {@link ChallengeRequirementV2LangTranslationEntity}.
 */
@ObjectType({
    description: "Per-language content of a V2 requirement item (score + title/body + translations).",
})
@Entity("challenge_requirement_v2_langs")
export class ChallengeRequirementV2LangEntity extends UuidAbstractEntity {
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
        () => ChallengeRequirementV2Entity,
        (requirementV2: ChallengeRequirementV2Entity) => requirementV2.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_requirement_v2_id",
        foreignKeyConstraintName: "fk_req_v2_lang_challenge_requirements_v2",
    })
        requirementV2: ChallengeRequirementV2Entity

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
        (lang: ChallengeRequirementV2LangEntity) => lang.requirementV2,
    )
        requirementV2Id: string

    /**
     * Per-locale body overrides for this language content.
     */
    @Field(
        () => [ChallengeRequirementV2LangTranslationEntity],
        {
            description: "Per-locale body overrides for this language content.",
        },
    )
    @OneToMany(
        () => ChallengeRequirementV2LangTranslationEntity,
        (translation: ChallengeRequirementV2LangTranslationEntity) => translation.lang,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengeRequirementV2LangTranslationEntity>
}
