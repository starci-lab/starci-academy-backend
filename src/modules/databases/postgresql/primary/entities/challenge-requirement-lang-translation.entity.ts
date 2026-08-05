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
    ChallengeRequirementLangEntity,
} from "./challenge-requirement-lang.entity"

@ObjectType({
    description: "Localized value for a V2 requirement language-row field.",
})
@Entity("challenge_requirement_lang_translations")
/**
 * Translation for V2 requirement language-row fields (`title`, `body`).
 * Primary key: (challengeRequirementLangId, locale, field).
 */
export class ChallengeRequirementLangTranslationEntity extends AbstractEntity {
    /** Parent requirement language row id (composite PK part). */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_requirement_lang_id",
        type: "uuid",
    })
        challengeRequirementLangId: string

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

    /** Parent requirement language row this translation belongs to. */
    @ManyToOne(
        () => ChallengeRequirementLangEntity,
        (lang: ChallengeRequirementLangEntity) => lang.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_requirement_lang_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_req_v2_lang_translation_lang",
    })
        lang: ChallengeRequirementLangEntity
}
