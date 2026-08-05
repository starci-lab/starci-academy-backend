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
    FoundationCategoryEntity,
} from "./foundation-category.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums/locale"

@ObjectType({
    description: "Localized value for a specific foundation category field.",
})
@Entity("foundation_category_translations")
/**
 * Translation entity storing localized values for foundation category fields.
 *
 * Primary key: (categoryId, locale, field).
 */
export class FoundationCategoryTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target category ID.",
        },
    )
    @PrimaryColumn({
        name: "category_id",
        type: "uuid",
    })
        categoryId: string

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
        () => FoundationCategoryEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "category_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_category_id_foundation_category_translations_categories",
    })
        category: FoundationCategoryEntity
}
