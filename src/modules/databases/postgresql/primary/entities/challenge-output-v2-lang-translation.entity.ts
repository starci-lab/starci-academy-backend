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
 * Translation for V2 output language-row fields (`text`).
 * Primary key: (challengeOutputV2LangId, locale, field).
 */
@ObjectType({
    description: "Localized value for a V2 output language-row field.",
})
@Entity("challenge_output_v2_lang_translations")
export class ChallengeOutputV2LangTranslationEntity extends AbstractEntity {
    /** Parent output language row id (composite PK part). */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_output_v2_lang_id",
        type: "uuid",
    })
        challengeOutputV2LangId: string

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

    /** Parent output language row this translation belongs to. */
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
