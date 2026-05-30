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
    ChallengeStepV2LangEntity,
} from "./challenge-step-v2-lang.entity"

/**
 * Per-locale body for a SCHEMA V2 step language row (normalized — no jsonb).
 * One row per (language row × locale).
 */
@ObjectType({
    description: "Per-locale body for a V2 step language row.",
})
@Entity("challenge_step_v2_lang_translations")
export class ChallengeStepV2LangTranslationEntity extends AbstractEntity {
    /**
     * Parent step language row id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_step_v2_lang_id",
        type: "uuid",
    })
        challengeStepV2LangId: string

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
     * Localized step body markdown.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Localized step body markdown.",
        },
    )
    @Column({
        name: "body",
        type: "text",
        nullable: true,
    })
        body: string | null

    /**
     * Parent step language row this body belongs to.
     */
    @ManyToOne(
        () => ChallengeStepV2LangEntity,
        (lang: ChallengeStepV2LangEntity) => lang.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_step_v2_lang_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_step_v2_lang_translation_lang",
    })
        lang: ChallengeStepV2LangEntity
}
