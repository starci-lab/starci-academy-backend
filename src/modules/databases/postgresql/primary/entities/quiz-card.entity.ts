import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    QuizDeckEntity,
} from "./quiz-deck.entity"
import {
    QuizCardTranslationEntity,
} from "./quiz-card-translation.entity"
import {
    QuizCardOptionEntity,
} from "./quiz-card-option.entity"

/**
 * A single multiple-choice quiz question within a deck. `question` holds the
 * prompt, `explanation` optional context shown after grading, and `options`
 * the answer choices (exactly one flagged `isCorrect`) that drive auto-grading.
 */
@ObjectType({
    description: "Multiple-choice quiz question: prompt + answer options.",
})
@Entity("quiz_cards")
export class QuizCardEntity extends UuidAbstractEntity {
    /**
     * The question prompt (Markdown).
     */
    @Field(
        () => String,
        {
            description: "The question prompt (Markdown).",
        },
    )
    @Column({
        name: "question",
        type: "text",
    })
        question: string

    /**
     * Optional extra explanation shown after the answer is revealed (Markdown).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional extra explanation (Markdown).",
        },
    )
    @Column({
        name: "explanation",
        type: "text",
        nullable: true,
    })
        explanation: string | null

    /**
     * Display order within the deck card list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the deck card list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this card row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this card row.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Parent deck.
     */
    @Field(
        () => QuizDeckEntity,
        {
            description: "Parent deck.",
        },
    )
    @ManyToOne(
        () => QuizDeckEntity,
        (deck: QuizDeckEntity) => deck.cards,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "quiz_deck_id",
        foreignKeyConstraintName: "fk_quiz_deck_id_quiz_cards_quiz_decks",
    })
        deck: QuizDeckEntity

    /**
     * Parent deck ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent deck ID.",
        },
    )
    @RelationId(
        (card: QuizCardEntity) => card.deck,
    )
        deckId: string

    /**
     * Multiple-choice options (empty for pure free-text/self-graded cards).
     */
    @Field(
        () => [QuizCardOptionEntity],
        {
            nullable: true,
            description: "Multiple-choice options; empty for free-text cards.",
        },
    )
    @OneToMany(
        () => QuizCardOptionEntity,
        (option: QuizCardOptionEntity) => option.card,
        {
            cascade: true,
        },
    )
        options: Array<QuizCardOptionEntity>

    /**
     * Localized overrides for card fields (front, back, explanation).
     */
    @Field(
        () => [QuizCardTranslationEntity],
        {
            description: "Localized overrides for card fields (front, back, explanation).",
        },
    )
    @OneToMany(
        () => QuizCardTranslationEntity,
        (translation: QuizCardTranslationEntity) => translation.card,
        {
            cascade: true,
        },
    )
        translations: Array<QuizCardTranslationEntity>
}
