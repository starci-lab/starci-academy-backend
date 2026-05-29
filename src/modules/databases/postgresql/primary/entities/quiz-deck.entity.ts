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
    QuizDeckTranslationEntity,
} from "./quiz-deck-translation.entity"
import {
    QuizCardEntity,
} from "./quiz-card.entity"

/**
 * Quizlet-style multiple-choice quiz deck. Lives at the course level (shown in
 * its own course tab) and may optionally be linked to one or more contents
 * (many-to-many) for topical grouping. Seeded from `.mount` markdown and
 * localized via a translation table.
 */
@ObjectType({
    description: "Multiple-choice quiz deck owned by a course, optionally linked to contents.",
})
@Entity("quiz_decks")
export class QuizDeckEntity extends UuidAbstractEntity {
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
        () => [QuizCardEntity],
        {
            description: "Flashcards belonging to this deck.",
        },
    )
    @OneToMany(
        () => QuizCardEntity,
        (card: QuizCardEntity) => card.deck,
        {
            cascade: true,
        },
    )
        cards: Array<QuizCardEntity>

    /**
     * Localized overrides for deck fields (title, description).
     */
    @Field(
        () => [QuizDeckTranslationEntity],
        {
            description: "Localized overrides for deck fields (title, description).",
        },
    )
    @OneToMany(
        () => QuizDeckTranslationEntity,
        (translation: QuizDeckTranslationEntity) => translation.deck,
        {
            cascade: true,
        },
    )
        translations: Array<QuizDeckTranslationEntity>

    /**
     * Owning course this deck belongs to (drives the course-level quiz tab).
     */
    @Field(
        () => CourseEntity,
        {
            description: "Course this deck belongs to.",
        },
    )
    @ManyToOne(
        () => CourseEntity,
        (course: CourseEntity) => course.quizDecks,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_quiz_decks_courses",
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
        (deck: QuizDeckEntity) => deck.course,
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
        (content: ContentEntity) => content.quizDecks,
        {
            cascade: false,
        },
    )
    @JoinTable({
        name: "quiz_deck_contents",
        joinColumn: {
            name: "quiz_deck_id",
            referencedColumnName: "id",
        },
        inverseJoinColumn: {
            name: "content_id",
            referencedColumnName: "id",
        },
    })
        contents: Array<ContentEntity>
}
