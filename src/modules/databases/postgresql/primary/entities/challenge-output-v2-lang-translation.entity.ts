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
    ChallengeOutputV2LangEntity,
} from "./challenge-output-v2-lang.entity"

/**
 * Per-locale body for a SCHEMA V2 output language row (normalized — no jsonb).
 * One row per (language row × locale).
 */
@ObjectType({
    description: "Per-locale body for a V2 output language row.",
})
@Entity("challenge_output_v2_lang_translations")
export class ChallengeOutputV2LangTranslationEntity extends AbstractEntity {
    /**
     * Parent output language row id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_output_v2_lang_id",
        type: "uuid",
    })
        challengeOutputV2LangId: string

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
     * Localized output body markdown.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Localized output body markdown.",
        },
    )
    @Column({
        name: "body",
        type: "text",
        nullable: true,
    })
        body: string | null

    /**
     * Parent output language row this body belongs to.
     */
    @ManyToOne(
        () => ChallengeOutputV2LangEntity,
        (lang: ChallengeOutputV2LangEntity) => lang.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_output_v2_lang_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_output_v2_lang_translation_lang",
    })
        lang: ChallengeOutputV2LangEntity
}
