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
    ChallengePrerequisiteLangEntity,
} from "./challenge-prerequisite-lang.entity"

/**
 * Translation for V2 prerequisite language-row fields (`text`).
 * Primary key: (challengePrerequisiteLangId, locale, field).
 */
@ObjectType({
    description: "Localized value for a V2 prerequisite language-row field.",
})
@Entity("challenge_prerequisite_lang_translations")
export class ChallengePrerequisiteLangTranslationEntity extends AbstractEntity {
    /** Parent prerequisite language row id (composite PK part). */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_prerequisite_lang_id",
        type: "uuid",
    })
        challengePrerequisiteLangId: string

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

    /** Parent prerequisite language row this translation belongs to. */
    @ManyToOne(
        () => ChallengePrerequisiteLangEntity,
        (lang: ChallengePrerequisiteLangEntity) => lang.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_prerequisite_lang_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_prereq_v2_lang_translation_lang",
    })
        lang: ChallengePrerequisiteLangEntity
}
