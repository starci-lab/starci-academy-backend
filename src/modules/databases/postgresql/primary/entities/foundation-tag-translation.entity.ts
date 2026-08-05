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
    FoundationTagEntity,
} from "./foundation-tag.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

@ObjectType({
    description: "Localized value for a foundation tag field (e.g. value).",
})
@Entity("foundation_tag_translations")
/**
 * Translation for a foundation tag field (use `field`: value).
 * Primary key: (foundationTagId, locale, field).
 */
export class FoundationTagTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target foundation tag ID.",
        },
    )
    @PrimaryColumn({
        name: "foundation_tag_id",
        type: "uuid",
    })
        foundationTagId: string

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
        () => FoundationTagEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "foundation_tag_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_foundation_tag_id_foundation_tag_translations_foundation_tags",
    })
        foundationTag: FoundationTagEntity
}
