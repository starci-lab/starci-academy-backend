import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    AbstractEntity,
} from "./abstract"
import {
    ChallengePrerequisiteV2LangEntity,
} from "./challenge-prerequisite-v2-lang.entity"

/**
 * Per-locale body for a SCHEMA V2 prerequisite language row (normalized — no jsonb).
 * One row per (language row × locale).
 */
@ObjectType({
    description: "Per-locale body for a V2 prerequisite language row.",
})
@Entity("challenge_prerequisite_v2_lang_translations")
export class ChallengePrerequisiteV2LangTranslationEntity extends AbstractEntity {
    /**
     * Parent prerequisite language row id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_prerequisite_v2_lang_id",
        type: "uuid",
    })
        challengePrerequisiteV2LangId: string

    /**
     * Locale of this body (composite PK part).
     */
    @Field(() => GraphQLTypeLocale)
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /**
     * Localized prerequisite body markdown.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Localized prerequisite body markdown.",
        },
    )
    @Column({
        name: "body",
        type: "text",
        nullable: true,
    })
        body: string | null

    /**
     * Parent prerequisite language row this body belongs to.
     */
    @ManyToOne(
        () => ChallengePrerequisiteV2LangEntity,
        (lang: ChallengePrerequisiteV2LangEntity) => lang.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_prerequisite_v2_lang_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_prereq_v2_lang_translation_lang",
    })
        lang: ChallengePrerequisiteV2LangEntity
}
