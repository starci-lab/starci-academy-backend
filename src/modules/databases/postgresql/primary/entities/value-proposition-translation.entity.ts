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
    ValuePropositionEntity,
} from "./value-proposition.entity"

/**
 * Translation entity storing localized values for value proposition fields.
 *
 * Each row represents:
 * (valuePropositionId, locale, field) -> translated value
 */
@ObjectType({
    description: "Localized value for a specific value proposition field.",
})
@Entity("value_proposition_translations")
@Index(
    "uq_value_proposition_translation",
    [
        "valuePropositionId",
        "locale",
        "field",
    ],
    {
        unique: true,
    },
)
export class ValuePropositionTranslationEntity extends UuidAbstractEntity {
    /**
     * Target value proposition ID.
     */
    @Field(() => String)
    @Column({
        name: "value_proposition_id",
        type: "varchar",
        length: 255,
    })
        valuePropositionId: string

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
     * Target field name being translated (e.g., content).
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
     * Reference to the parent value proposition.
     * Cascade delete ensures translations are removed when value proposition is deleted.
     */
    @ManyToOne(
        () => ValuePropositionEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "value_proposition_id",
        referencedColumnName: "id",
    })
        valueProposition: ValuePropositionEntity
}

