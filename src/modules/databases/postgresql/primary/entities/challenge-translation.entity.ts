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
    ChallengeEntity,
} from "./challenge.entity"

/**
 * Translation for challenge fields (title, brief, description).
 * Primary key: (challengeId, locale, field).
 */
@ObjectType({
    description: "Localized value for a challenge field.",
})
@Entity("challenge_translations")
export class ChallengeTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target challenge ID.",
        },
    )
    @PrimaryColumn({
        name: "challenge_id",
        type: "uuid",
    })
        challengeId: string

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
        () => ChallengeEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_challenge_id_challenge_translations_challenges",
    })
        challenge: ChallengeEntity
}
