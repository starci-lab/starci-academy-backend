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
    AbstractEntity,
} from "./abstract"
import {
    FoundationEntity,
} from "./foundation.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

@ObjectType({
    description: "Localized value for a specific foundation field.",
})
@Entity("foundation_translations")
/**
 * Translation entity storing localized values for foundation fields.
 *
 * Primary key: (foundationId, locale, field).
 */
export class FoundationTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target foundation ID.",
        },
    )
    @PrimaryColumn({
        name: "foundation_id",
        type: "uuid",
    })
        foundationId: string

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
        () => FoundationEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "foundation_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_foundation_id_foundation_translations_foundations",
    })
        foundation: FoundationEntity
}
