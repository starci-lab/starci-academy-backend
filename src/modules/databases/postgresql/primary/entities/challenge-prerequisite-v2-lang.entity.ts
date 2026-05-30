import {
    Field,
    ID,
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
 * Per-programming-language row of a SCHEMA V2 prerequisite item. The localized `body` lives in
 * {@link ChallengePrerequisiteV2LangTranslationEntity}.
 */
@ObjectType({
    description: "Per-language row of a V2 prerequisite item (localized body lives in translations).",
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
     * Per-locale body overrides for this language content.
     */
    @Field(
        () => [ChallengePrerequisiteV2LangTranslationEntity],
        {
            description: "Per-locale body overrides for this language content.",
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
