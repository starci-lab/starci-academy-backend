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
    QuizCardOptionEntity,
} from "./quiz-card-option.entity"

/**
 * Translation for quiz card option fields (text).
 * Primary key: (quizCardOptionId, locale, field).
 */
@ObjectType({
    description: "Localized value for a quiz card option field.",
})
@Entity("quiz_card_option_translations")
export class QuizCardOptionTranslationEntity extends AbstractEntity {
    /**
     * Target quiz card option ID.
     */
    @Field(
        () => String,
        {
            description: "Target quiz card option ID.",
        },
    )
    @PrimaryColumn({
        name: "quiz_card_option_id",
        type: "uuid",
    })
        quizCardOptionId: string

    /**
     * Locale of the translation (e.g. vi, en).
     */
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

    /**
     * Target field name being translated.
     */
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

    /**
     * Translated value for the field.
     */
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

    /**
     * Parent quiz card option.
     */
    @ManyToOne(
        () => QuizCardOptionEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "quiz_card_option_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_option_id_quiz_card_option_translations_options",
    })
        option: QuizCardOptionEntity
}
