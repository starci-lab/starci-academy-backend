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
    ContentEntity,
} from "./content.entity"
import {
    ContentLearningOutcomeTranslationEntity,
} from "./content-learning-outcome-translation.entity"

@ObjectType({
    description: "A 'what you will learn' outcome bullet belonging to a content (lesson).",
})
@Entity("content_learning_outcomes")
/**
 * A single "what you will learn" bullet attached to a content (lesson). Ordered, localized;
 * sourced from the mount `# outcomes` section. Mirrors the challenge-output shape.
 */
export class ContentLearningOutcomeEntity extends UuidAbstractEntity {
    /** Default-locale outcome text (short bullet, plain text or light markdown). */
    @Field(
        () => String,
        {
            description: "Default-locale 'what you will learn' bullet text.",
        },
    )
    @Column({
        name: "text",
        type: "text",
    })
        text: string

    /** Display order within the content's learning-outcome list. */
    @Field(
        () => Int,
        {
            description: "Display order within the content learning-outcome list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /** Pure ordering index used to reorder the list (decoupled from orderIndex). */
    @Field(() => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex).",
        })
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

    /** Locale the default `text` is written in. */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this learning-outcome row.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /** Parent content this outcome belongs to (cascade-deleted with the content). */
    @ManyToOne(
        () => ContentEntity,
        (content: ContentEntity) => content.outcomes,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_content_learning_outcomes_contents",
    })
        content: ContentEntity

    /** Parent content id (virtual relation column). */
    @Field(() => ID)
    @RelationId((learningOutcome: ContentLearningOutcomeEntity) => learningOutcome.content)
        contentId: string

    /** Localized overrides for the `text` field (one row per locale). */
    @Field(() => [ContentLearningOutcomeTranslationEntity])
    @OneToMany(
        () => ContentLearningOutcomeTranslationEntity,
        (translation: ContentLearningOutcomeTranslationEntity) => translation.contentLearningOutcome,
        {
            cascade: true,
        },
    )
        translations: Array<ContentLearningOutcomeTranslationEntity>
}
