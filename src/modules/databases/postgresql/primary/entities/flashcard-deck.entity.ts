import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    ChallengeDifficulty,
    GraphQLTypeChallengeDifficulty,
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CourseEntity,
} from "./course.entity"
import {
    ContentEntity,
} from "./content.entity"
import {
    ModuleEntity,
} from "./module.entity"
import {
    FlashcardDeckTranslationEntity,
} from "./flashcard-deck-translation.entity"
import {
    FlashcardCardEntity,
} from "./flashcard-card.entity"

/**
 * Flashcardlet-style multiple-choice flashcard deck. Lives at the course level (shown in
 * its own course tab) and may optionally be linked to one or more contents
 * (many-to-many) for topical grouping. Seeded from `.mount` markdown and
 * localized via a translation table.
 */
@ObjectType({
    description: "Multiple-choice flashcard deck owned by a course, optionally linked to contents.",
})
@Entity("flashcard_decks")
export class FlashcardDeckEntity extends UuidAbstractEntity {
    /**
     * Deck title.
     */
    @Field(
        () => String,
        {
            description: "Deck title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
    })
        title: string

    /**
     * Human-facing stable identifier from the mount folder (`{index}-{slug}` slug segment).
     */
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier from the deck mount folder slug.",
        },
    )
    @Column({
        name: "display_id",
        type: "varchar",
        length: 255,
    })
        displayId: string

    /**
     * Deck description (Markdown).
     */
    @Field(
        () => String,
        {
            description: "Deck description (Markdown).",
        },
    )
    @Column({
        name: "description",
        type: "text",
        default: "",
    })
        description: string

    /**
     * Relative difficulty of the deck (reuses the challenge difficulty tier).
     */
    @Field(
        () => GraphQLTypeChallengeDifficulty,
        {
            description: "Relative difficulty of the deck.",
        },
    )
    @Column({
        name: "difficulty",
        type: "enum",
        enum: ChallengeDifficulty,
        enumName: "challenge_difficulty",
    })
        difficulty: ChallengeDifficulty

    /**
     * Display order within the content deck list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the content deck list.",
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
     * Default locale for this deck row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this deck row.",
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
     * Flashcards belonging to this deck.
     */
    @Field(
        () => [FlashcardCardEntity],
        {
            description: "Flashcards belonging to this deck.",
        },
    )
    @OneToMany(
        () => FlashcardCardEntity,
        (card: FlashcardCardEntity) => card.deck,
        {
            cascade: true,
        },
    )
        cards: Array<FlashcardCardEntity>

    /**
     * Localized overrides for deck fields (title, description).
     */
    @Field(
        () => [FlashcardDeckTranslationEntity],
        {
            description: "Localized overrides for deck fields (title, description).",
        },
    )
    @OneToMany(
        () => FlashcardDeckTranslationEntity,
        (translation: FlashcardDeckTranslationEntity) => translation.deck,
        {
            cascade: true,
        },
    )
        translations: Array<FlashcardDeckTranslationEntity>

    /**
     * Owning course this deck belongs to (drives the course-level flashcard tab).
     */
    @Field(
        () => CourseEntity,
        {
            description: "Course this deck belongs to.",
        },
    )
    @ManyToOne(
        () => CourseEntity,
        (course: CourseEntity) => course.flashcardDecks,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_flashcard_decks_courses",
    })
        course: CourseEntity

    /**
     * Owning course ID.
     */
    @Field(
        () => ID,
        {
            description: "Owning course ID.",
        },
    )
    @RelationId(
        (deck: FlashcardDeckEntity) => deck.course,
    )
        courseId: string

    /**
     * Optional contents this deck is linked to (many-to-many) for topical
     * grouping. Empty when the deck is course-wide.
     */
    @Field(
        () => [ContentEntity],
        {
            nullable: true,
            description: "Contents this deck is linked to (optional, many-to-many).",
        },
    )
    @ManyToMany(
        () => ContentEntity,
        (content: ContentEntity) => content.flashcardDecks,
        {
            cascade: false,
        },
    )
    @JoinTable({
        name: "flashcard_deck_contents",
        joinColumn: {
            name: "flashcard_deck_id",
            referencedColumnName: "id",
        },
        inverseJoinColumn: {
            name: "content_id",
            referencedColumnName: "id",
        },
    })
        contents: Array<ContentEntity>

    /**
     * Optional modules this deck references (many-to-many) — `# moduleRefs` in the
     * deck markdown, resolved by module `displayId` within the owning course.
     */
    @Field(
        () => [ModuleEntity],
        {
            nullable: true,
            description: "Modules this deck references (optional, many-to-many).",
        },
    )
    @ManyToMany(
        () => ModuleEntity,
        {
            cascade: false,
        },
    )
    @JoinTable({
        name: "flashcard_deck_modules",
        joinColumn: {
            name: "flashcard_deck_id",
            referencedColumnName: "id",
        },
        inverseJoinColumn: {
            name: "module_id",
            referencedColumnName: "id",
        },
    })
        modules: Array<ModuleEntity>
}
