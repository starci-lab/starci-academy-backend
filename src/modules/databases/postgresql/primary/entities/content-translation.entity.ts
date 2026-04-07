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
    ContentEntity,
} from "./content.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Translation entity storing localized values for content fields.
 *
 * Each row represents:
 * (contentId, locale, field) -> translated value
 *
 * Primary key is the composite (contentId, locale, field).
 */
@ObjectType({
    description: "Localized value for a specific content field.",
})
@Entity("content_translations")
export class ContentTranslationEntity extends AbstractEntity {
    /**
     * Target content ID (part of composite primary key).
     */
    @Field(
        () => String,
        {
            description: "Target content ID.",
        },
    )
    @PrimaryColumn({
        name: "content_id",
        type: "uuid",
    })
        contentId: string

    /**
     * Locale of the translation (e.g., vi, en).
     */
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

    /**
     * Target field name being translated (e.g., title, description, body).
     */
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

    /**
     * Translated value for the field.
     */
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

    /**
     * Reference to the parent content.
     * Cascade delete ensures translations are removed when content is deleted.
     */
    @ManyToOne(
        () => ContentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_content_id_content_translations_contents",
    })
        content: ContentEntity
}
