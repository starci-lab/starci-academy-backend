import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    FlashcardLevel,
    GraphQLTypeFlashcardLevel,
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
    FlashcardDeckEntity,
} from "./flashcard-deck.entity"
import {
    FlashcardCardTranslationEntity,
} from "./flashcard-card-translation.entity"

/**
 * A single open-ended interview flashcard within a deck. `question` holds the
 * prompt (front), `answer` the model answer revealed on flip (back), and
 * `explanation` optional depth (follow-ups, gotchas) — all Markdown.
 */
@ObjectType({
    description: "Open-ended interview flashcard: Markdown question + answer.",
})
@Entity("flashcard_cards")
export class FlashcardCardEntity extends UuidAbstractEntity {
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
     * Interview seniority level this card targets (a deck mixes levels).
     * Nullable so legacy cards without a `### level` heading still load.
     */
    @Field(
        () => GraphQLTypeFlashcardLevel,
        {
            nullable: true,
            description: "Interview seniority level (junior/middle/senior/staff).",
        },
    )
    @Column({
        name: "level",
        type: "enum",
        enum: FlashcardLevel,
        enumName: "flashcard_level",
        nullable: true,
    })
        level: FlashcardLevel | null

    /**
     * Technology tags for this card (e.g. ["NestJS", "Redis"]) — drives chips + filtering.
     */
    @Field(
        () => [String],
        {
            description: "Technology tags for this card.",
        },
    )
    @Column({
        name: "tags",
        type: "jsonb",
        default: () => "'[]'::jsonb",
    })
        tags: Array<string>

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
     * Pure ordering index used to reorder the list (decoupled from orderIndex).
     */
    @Field(
        () => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex).",
        },
    )
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

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
        () => FlashcardDeckEntity,
        {
            description: "Parent deck.",
        },
    )
    @ManyToOne(
        () => FlashcardDeckEntity,
        (deck: FlashcardDeckEntity) => deck.cards,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "flashcard_deck_id",
        foreignKeyConstraintName: "fk_flashcard_deck_id_flashcard_cards_flashcard_decks",
    })
        deck: FlashcardDeckEntity

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
        (card: FlashcardCardEntity) => card.deck,
    )
        deckId: string

    /**
     * The model answer revealed when the card is flipped (Markdown).
     * Nullable so legacy decks not yet migrated to the Q&A format still load.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "The model answer revealed on flip (Markdown).",
        },
    )
    @Column({
        name: "answer",
        type: "text",
        nullable: true,
    })
        answer: string | null

    /**
     * Localized overrides for card fields (front, back, explanation).
     */
    @Field(
        () => [FlashcardCardTranslationEntity],
        {
            description: "Localized overrides for card fields (front, back, explanation).",
        },
    )
    @OneToMany(
        () => FlashcardCardTranslationEntity,
        (translation: FlashcardCardTranslationEntity) => translation.card,
        {
            cascade: true,
        },
    )
        translations: Array<FlashcardCardTranslationEntity>
}
