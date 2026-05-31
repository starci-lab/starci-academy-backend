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
 * Translation for V2 step language-row fields (`title`, `body`).
 * Primary key: (challengeStepV2LangId, locale, field).
 */
@ObjectType({
    description: "Localized value for a V2 step language-row field.",
})
@Entity("challenge_step_v2_lang_translations")
export class ChallengeStepV2LangTranslationEntity extends AbstractEntity {
    /** Parent step language row id (composite PK part). */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_step_v2_lang_id",
        type: "uuid",
    })
        challengeStepV2LangId: string

    /** Locale of the translation (composite PK part). */
    @Field(() => GraphQLTypeLocale)
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /** Target field name being translated (composite PK part). */
    @Field(() => String)
    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    /** Translated value for the field. */
    @Field(() => String)
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    /** Parent step language row this translation belongs to. */
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
