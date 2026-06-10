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
} from "./flashcard-card.entity"

/**
 * Translation for flashcard card fields (front, back, explanation).
 * Primary key: (flashcardCardId, locale, field).
 */
@ObjectType({
    description: "Localized value for a flashcard card field.",
})
@Entity("flashcard_card_translations")
export class FlashcardCardTranslationEntity extends AbstractEntity {
    /**
     * Target flashcard card ID.
     */
    @Field(
        () => String,
        {
            description: "Target flashcard card ID.",
        },
    )
    @PrimaryColumn({
        name: "flashcard_card_id",
        type: "uuid",
    })
        flashcardCardId: string

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
     * Parent flashcard card.
     */
    @ManyToOne(
        () => FlashcardCardEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "flashcard_card_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_flashcard_card_id_flashcard_card_translations_flashcard_cards",
    })
        card: FlashcardCardEntity
}
