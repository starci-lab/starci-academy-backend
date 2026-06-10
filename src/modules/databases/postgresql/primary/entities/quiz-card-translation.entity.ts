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
    FlashcardCardEntity,
} from "./quiz-card.entity"

/**
 * Translation for quiz card fields (front, back, explanation).
 * Primary key: (quizCardId, locale, field).
 */
@ObjectType({
    description: "Localized value for a quiz card field.",
})
@Entity("quiz_card_translations")
export class FlashcardCardTranslationEntity extends AbstractEntity {
    /**
     * Target quiz card ID.
     */
    @Field(
        () => String,
        {
            description: "Target quiz card ID.",
        },
    )
    @PrimaryColumn({
        name: "quiz_card_id",
        type: "uuid",
    })
        quizCardId: string

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
     * Parent quiz card.
     */
    @ManyToOne(
        () => FlashcardCardEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "quiz_card_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_quiz_card_id_quiz_card_translations_quiz_cards",
    })
        card: FlashcardCardEntity
}
