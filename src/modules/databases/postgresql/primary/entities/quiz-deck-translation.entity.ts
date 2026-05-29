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
    QuizDeckEntity,
} from "./quiz-deck.entity"

/**
 * Translation for quiz deck fields (title, description).
 * Primary key: (quizDeckId, locale, field).
 */
@ObjectType({
    description: "Localized value for a quiz deck field.",
})
@Entity("quiz_deck_translations")
export class QuizDeckTranslationEntity extends AbstractEntity {
    /**
     * Target quiz deck ID.
     */
    @Field(
        () => String,
        {
            description: "Target quiz deck ID.",
        },
    )
    @PrimaryColumn({
        name: "quiz_deck_id",
        type: "uuid",
    })
        quizDeckId: string

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
     * Parent quiz deck.
     */
    @ManyToOne(
        () => QuizDeckEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "quiz_deck_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_quiz_deck_id_quiz_deck_translations_quiz_decks",
    })
        deck: QuizDeckEntity
}
