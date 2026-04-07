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
    AbstractEntity,
} from "./abstract"
import {
    ChallengeReferenceEntity,
} from "./challenge-reference.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Translation for a challenge reference field (`field`: alias for link label). URL is not translated.
 * Primary key: (challengeReferenceId, locale, field).
 */
@ObjectType({
    description: "Localized value for a challenge reference field (e.g. alias).",
})
@Entity("challenge_reference_translations")
export class ChallengeReferenceTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target challenge reference ID.",
        },
    )
    @PrimaryColumn({
        name: "challenge_reference_id",
        type: "uuid",
    })
        challengeReferenceId: string

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale of the translation (e.g. vi, en).",
        },
    )
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    @Field(
        () => String,
        {
            description: "Translated value for the field.",
        },
    )
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    @ManyToOne(
        () => ChallengeReferenceEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_reference_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_challenge_reference_id_challenge_reference_translations_challenge_references",
    })
        challengeReference: ChallengeReferenceEntity
}
