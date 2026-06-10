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
    FlashcardDeckEntity,
} from "./flashcard-deck.entity"

/**
 * Translation for flashcard deck fields (title, description).
 * Primary key: (flashcardDeckId, locale, field).
 */
@ObjectType({
    description: "Localized value for a flashcard deck field.",
})
@Entity("flashcard_deck_translations")
export class FlashcardDeckTranslationEntity extends AbstractEntity {
    /**
     * Target flashcard deck ID.
     */
    @Field(
        () => String,
        {
            description: "Target flashcard deck ID.",
        },
    )
    @PrimaryColumn({
        name: "flashcard_deck_id",
        type: "uuid",
    })
        flashcardDeckId: string

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
     * Parent flashcard deck.
     */
    @ManyToOne(
        () => FlashcardDeckEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "flashcard_deck_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_flashcard_deck_id_flashcard_deck_translations_flashcard_decks",
    })
        deck: FlashcardDeckEntity
}
