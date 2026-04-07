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
    ValuePropositionEntity,
} from "./value-proposition.entity"

/**
 * Translation entity for value proposition fields.
 * Primary key: (valuePropositionId, locale, field).
 */
@ObjectType({
    description: "Localized value for a specific value proposition field.",
})
@Entity("value_proposition_translations")
export class ValuePropositionTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target value proposition ID.",
        },
    )
    @PrimaryColumn({
        name: "value_proposition_id",
        type: "uuid",
    })
        valuePropositionId: string

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

    @ManyToOne(
        () => ValuePropositionEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "value_proposition_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_value_proposition_id_value_proposition_translations_value_propositions",
    })
        valueProposition: ValuePropositionEntity
}
