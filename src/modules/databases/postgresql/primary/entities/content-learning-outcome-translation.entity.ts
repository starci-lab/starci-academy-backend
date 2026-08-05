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
} from "../enums/locale"
import {
    AbstractEntity,
} from "./abstract"
import {
    ContentLearningOutcomeEntity,
} from "./content-learning-outcome.entity"

@ObjectType({
    description: "Localized value for a content learning-outcome field.",
})
@Entity("content_learning_outcome_translations")
/**
 * Localized value for a content learning-outcome field (composite PK: outcome id + locale + field).
 */
export class ContentLearningOutcomeTranslationEntity extends AbstractEntity {
    /** Parent learning-outcome id this translation overrides. */
    @Field(() => String)
    @PrimaryColumn({
        name: "content_learning_outcome_id",
        type: "uuid",
    })
        contentLearningOutcomeId: string

    /** Locale this translation targets. */
    @Field(() => GraphQLTypeLocale)
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /** Name of the localized field (e.g. `text`). */
    @Field(() => String)
    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    /** Localized value for `field` in `locale`. */
    @Field(() => String)
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    /** Parent learning-outcome row (cascade-deleted with the outcome). */
    @ManyToOne(
        () => ContentLearningOutcomeEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_learning_outcome_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_clo_id_clo_translations_content_learning_outcomes",
    })
        contentLearningOutcome: ContentLearningOutcomeEntity
}
