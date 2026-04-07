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
    ContentReferenceEntity,
} from "./content-reference.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Translation for a content reference field (use `field`: alias for the link label).
 * Primary key: (contentReferenceId, locale, field). URL is not translated.
 */
@ObjectType({
    description: "Localized value for a content reference field (e.g. alias).",
})
@Entity("content_reference_translations")
export class ContentReferenceTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target content reference ID.",
        },
    )
    @PrimaryColumn({
        name: "content_reference_id",
        type: "uuid",
    })
        contentReferenceId: string

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
        () => ContentReferenceEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_reference_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_content_reference_id_content_reference_translations_content_references",
    })
        contentReference: ContentReferenceEntity
}
