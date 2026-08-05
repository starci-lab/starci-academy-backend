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
} from "../enums/locale"
import {
    AbstractEntity,
} from "./abstract"
import {
    ChallengeStepLangEntity,
} from "./challenge-step-lang.entity"

@ObjectType({
    description: "Localized value for a V2 step language-row field.",
})
@Entity("challenge_step_lang_translations")
/**
 * Translation for V2 step language-row fields (`title`, `body`).
 * Primary key: (challengeStepLangId, locale, field).
 */
export class ChallengeStepLangTranslationEntity extends AbstractEntity {
    /** Parent step language row id (composite PK part). */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_step_lang_id",
        type: "uuid",
    })
        challengeStepLangId: string

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
        () => ChallengeStepLangEntity,
        (lang: ChallengeStepLangEntity) => lang.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_step_lang_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_step_v2_lang_translation_lang",
    })
        lang: ChallengeStepLangEntity
}
