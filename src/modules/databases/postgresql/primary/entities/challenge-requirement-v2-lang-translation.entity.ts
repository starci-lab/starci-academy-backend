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
    ChallengeRequirementV2LangEntity,
} from "./challenge-requirement-v2-lang.entity"

/**
 * Translation for V2 requirement language-row fields (`title`, `body`).
 * Primary key: (challengeRequirementV2LangId, locale, field).
 */
@ObjectType({
    description: "Localized value for a V2 requirement language-row field.",
})
@Entity("challenge_requirement_v2_lang_translations")
export class ChallengeRequirementV2LangTranslationEntity extends AbstractEntity {
    /** Parent requirement language row id (composite PK part). */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_requirement_v2_lang_id",
        type: "uuid",
    })
        challengeRequirementV2LangId: string

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
        () => ChallengeRequirementV2LangEntity,
        (lang: ChallengeRequirementV2LangEntity) => lang.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_requirement_v2_lang_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_req_v2_lang_translation_lang",
    })
        lang: ChallengeRequirementV2LangEntity
}
