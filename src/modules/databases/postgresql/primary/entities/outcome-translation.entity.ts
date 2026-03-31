import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    OutcomeEntity,
} from "./outcome.entity"

/**
 * Translation entity storing localized values for outcome fields.
 *
 * Each row represents:
 * (outcomeId, locale, field) -> translated value
 */
@ObjectType({
    description: "Localized value for a specific outcome field.",
})
@Entity("outcome_translations")
@Index(
    "uq_outcome_translation",
    [
        "outcomeId",
        "locale",
        "field",
    ],
    {
        unique: true,
    },
)
export class OutcomeTranslationEntity extends UuidAbstractEntity {
    /**
     * Target outcome ID.
     */
    @Field(() => String)
    @Column({
        name: "outcome_id",
        type: "varchar",
        length: 255,
    })
        outcomeId: string

    /**
     * Locale of the translation (e.g., vi, en).
     */
    @Field(() => GraphQLTypeLocale)
    @Column({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /**
     * Target field name being translated (e.g., title, description).
     */
    @Field(() => String)
    @Column({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    /**
     * Translated value for the field.
     */
    @Field(() => String)
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    /**
     * Reference to the parent outcome.
     * Cascade delete ensures translations are removed when outcome is deleted.
     */
    @ManyToOne(
        () => OutcomeEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "outcome_id",
        referencedColumnName: "id",
    })
        outcome: OutcomeEntity
}

