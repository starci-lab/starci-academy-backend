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
 * Per-locale body for a SCHEMA V2 requirement language row (normalized — no jsonb). The requirement
 * body differs by both programming language and locale. One row per (language row × locale).
 */
@ObjectType({
    description: "Per-locale body for a V2 requirement language row.",
})
@Entity("challenge_requirement_v2_lang_translations")
export class ChallengeRequirementV2LangTranslationEntity extends AbstractEntity {
    /**
     * Parent requirement language row id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_requirement_v2_lang_id",
        type: "uuid",
    })
        challengeRequirementV2LangId: string

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
     * Localized requirement body markdown.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Localized requirement body markdown.",
        },
    )
    @Column({
        name: "body",
        type: "text",
        nullable: true,
    })
        body: string | null

    /**
     * Parent requirement language row this body belongs to.
     */
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
