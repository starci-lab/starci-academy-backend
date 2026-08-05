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
    TemplateCVEntity,
} from "./template-cv.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

@ObjectType({
    description: "Localized value for a specific template CV field.",
})
@Entity("template_cv_translations")
/**
 * Translation entity storing localized values for template CV fields.
 *
 * Each row represents:
 * (templateCVId, locale, field) -> translated value
 *
 * Primary key is the composite (templateCVId, locale, field).
 */
export class TemplateCVTranslationEntity extends AbstractEntity {
    /**
     * Target template CV ID (part of composite primary key).
     */
    @Field(
        () => String,
        {
            description: "Target template CV ID.",
        },
    )
    @PrimaryColumn({
        name: "template_cv_id",
        type: "uuid",
    })
        templateCVId: string

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
     * Reference to the parent template CV.
     * Cascade delete ensures translations are removed when template is deleted.
     */
    @ManyToOne(
        () => TemplateCVEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "template_cv_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_template_cv_id_template_cv_translations_template_cvs",
    })
        templateCV: TemplateCVEntity
}
