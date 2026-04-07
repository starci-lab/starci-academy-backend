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
    ChallengeStepEntity,
} from "./challenge-step.entity"

/**
 * Translation for challenge step fields (title, description, body).
 * Primary key: (challengeStepId, locale, field).
 */
@ObjectType({
    description: "Localized value for a challenge step field.",
})
@Entity("challenge_step_translations")
export class ChallengeStepTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target challenge step ID.",
        },
    )
    @PrimaryColumn({
        name: "challenge_step_id",
        type: "uuid",
    })
        challengeStepId: string

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
        () => ChallengeStepEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_step_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_challenge_step_id_challenge_step_translations_challenge_steps",
    })
        challengeStep: ChallengeStepEntity
}
