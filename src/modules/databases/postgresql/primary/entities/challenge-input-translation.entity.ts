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
    ChallengeInputEntity,
} from "./challenge-input.entity"

/**
 * Translation for challenge input fields (e.g. description).
 * Primary key: (challengeInputId, locale, field).
 */
@ObjectType({
    description: "Localized value for a challenge input field.",
})
@Entity("challenge_input_translations")
export class ChallengeInputTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target challenge input ID.",
        },
    )
    @PrimaryColumn({
        name: "challenge_input_id",
        type: "uuid",
    })
        challengeInputId: string

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
        () => ChallengeInputEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_input_id",
        referencedColumnName: "id",
    })
        challengeInput: ChallengeInputEntity
}
