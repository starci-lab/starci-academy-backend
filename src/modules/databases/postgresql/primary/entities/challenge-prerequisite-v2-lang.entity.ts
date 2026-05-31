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
    ChallengePrerequisiteV2Entity,
} from "./challenge-prerequisite-v2.entity"
import {
    ChallengePrerequisiteV2LangTranslationEntity,
} from "./challenge-prerequisite-v2-lang-translation.entity"

/**
 * Per-programming-language row of a SCHEMA V2 prerequisite item. The default-locale `text` is stored
 * on this row; per-locale overrides live in {@link ChallengePrerequisiteV2LangTranslationEntity}.
 */
@ObjectType({
    description: "Per-language row of a V2 prerequisite item (text + per-locale translations).",
})
@Entity("challenge_prerequisite_v2_langs")
export class ChallengePrerequisiteV2LangEntity extends UuidAbstractEntity {
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
        () => ChallengePrerequisiteV2Entity,
        (prerequisiteV2: ChallengePrerequisiteV2Entity) => prerequisiteV2.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_prerequisite_v2_id",
        foreignKeyConstraintName: "fk_prereq_v2_lang_challenge_prerequisites_v2",
    })
        prerequisiteV2: ChallengePrerequisiteV2Entity

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
        (lang: ChallengePrerequisiteV2LangEntity) => lang.prerequisiteV2,
    )
        prerequisiteV2Id: string

    /**
     * Per-locale text overrides for this language content.
     */
    @Field(
        () => [ChallengePrerequisiteV2LangTranslationEntity],
        {
            description: "Per-locale text overrides for this language content.",
        },
    )
    @OneToMany(
        () => ChallengePrerequisiteV2LangTranslationEntity,
        (translation: ChallengePrerequisiteV2LangTranslationEntity) => translation.lang,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengePrerequisiteV2LangTranslationEntity>
}
