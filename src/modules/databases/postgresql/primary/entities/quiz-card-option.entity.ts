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
    QuizCardEntity,
} from "./quiz-card.entity"
import {
    QuizCardOptionTranslationEntity,
} from "./quiz-card-option-translation.entity"

/**
 * One multiple-choice option of a quiz card. Exactly one option per card is
 * expected to carry `isCorrect = true`; Learn/Test modes grade a selection by
 * matching against this flag.
 */
@ObjectType({
    description: "A multiple-choice option of a quiz card.",
})
@Entity("quiz_card_options")
export class QuizCardOptionEntity extends UuidAbstractEntity {
    /**
     * Option text shown to the learner (Markdown).
     */
    @Field(
        () => String,
        {
            description: "Option text (Markdown).",
        },
    )
    @Column({
        name: "text",
        type: "text",
    })
        text: string

    /**
     * Whether this option is the correct answer.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether this option is the correct answer.",
        },
    )
    @Column({
        name: "is_correct",
        type: "boolean",
        default: false,
    })
        isCorrect: boolean

    /**
     * Display order within the card option list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the card option list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this option row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this option row.",
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
     * Parent quiz card.
     */
    @Field(
        () => QuizCardEntity,
        {
            description: "Parent quiz card.",
        },
    )
    @ManyToOne(
        () => QuizCardEntity,
        (card: QuizCardEntity) => card.options,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "quiz_card_id",
        foreignKeyConstraintName:
            "fk_quiz_card_id_quiz_card_options_quiz_cards",
    })
        card: QuizCardEntity

    /**
     * Parent quiz card ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent quiz card ID.",
        },
    )
    @RelationId(
        (option: QuizCardOptionEntity) => option.card,
    )
        cardId: string

    /**
     * Localized overrides for the option text.
     */
    @Field(
        () => [QuizCardOptionTranslationEntity],
        {
            description: "Localized overrides for the option text.",
        },
    )
    @OneToMany(
        () => QuizCardOptionTranslationEntity,
        (translation: QuizCardOptionTranslationEntity) => translation.option,
        {
            cascade: true,
        },
    )
        translations: Array<QuizCardOptionTranslationEntity>
}
